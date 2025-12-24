import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EInvoice, InvoiceStatus } from '../entities/e-invoice.entity';
import { EInvoiceItem } from '../entities/e-invoice-item.entity';
import {
  CreateEInvoiceDto,
  UpdateEInvoiceDto,
  IssueEInvoiceDto,
  ReplaceEInvoiceDto,
  CancelEInvoiceDto,
} from '../dto/create-e-invoice.dto';
import { XmlGenerationService } from './xml-generation.service';
import { DigitalSignatureService } from './digital-signature.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class EInvoicesService {
  constructor(
    @InjectRepository(EInvoice)
    private invoiceRepository: Repository<EInvoice>,
    @InjectRepository(EInvoiceItem)
    private invoiceItemRepository: Repository<EInvoiceItem>,
    private xmlGenerationService: XmlGenerationService,
    private digitalSignatureService: DigitalSignatureService,
  ) {}

  /**
   * Create a new draft e-invoice
   */
  async create(tenantId: string, dto: CreateEInvoiceDto): Promise<EInvoice> {
    // Generate invoice number (auto-increment within series)
    const invoiceNumber = await this.generateInvoiceNumber(
      tenantId,
      dto.invoiceSeries,
    );

    // Convert amount to words
    const amountInWords = this.convertAmountToWords(dto.totalAmount);

    // Create invoice entity
    const invoice = this.invoiceRepository.create({
      tenantId,
      invoiceNumber,
      invoiceSeries: dto.invoiceSeries,
      templateCode: dto.templateCode,
      invoiceType: dto.invoiceType,
      invoiceStatus: InvoiceStatus.DRAFT,
      invoiceDate: new Date(dto.invoiceDate),
      customerId: dto.customerId,
      customerName: dto.customerName,
      customerTaxCode: dto.customerTaxCode,
      customerAddress: dto.customerAddress,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      buyerName: dto.buyerName,
      paymentMethod: dto.paymentMethod,
      bankAccount: dto.bankAccount,
      bankName: dto.bankName,
      subtotal: dto.subtotal,
      discountAmount: dto.discountAmount || 0,
      taxAmount: dto.taxAmount,
      totalAmount: dto.totalAmount,
      amountInWords,
      currencyCode: dto.currencyCode || 'VND',
      exchangeRate: dto.exchangeRate || 1,
      notes: dto.notes,
      salesOrderId: dto.salesOrderId,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create invoice items
    const items = dto.items.map((itemDto) =>
      this.invoiceItemRepository.create({
        invoiceId: savedInvoice.id,
        ...itemDto,
      }),
    );

    await this.invoiceItemRepository.save(items);

    // Reload invoice with items
    return this.findOne(tenantId, savedInvoice.id);
  }

  /**
   * Find all invoices for a tenant
   */
  async findAll(tenantId: string): Promise<EInvoice[]> {
    return this.invoiceRepository.find({
      where: { tenantId, deletedAt: null },
      relations: ['items', 'customer', 'salesOrder'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find one invoice by ID
   */
  async findOne(tenantId: string, id: string): Promise<EInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, tenantId, deletedAt: null },
      relations: ['items', 'customer', 'salesOrder'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  /**
   * Update draft invoice
   */
  async update(
    tenantId: string,
    id: string,
    dto: UpdateEInvoiceDto,
  ): Promise<EInvoice> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceStatus !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft invoices can be updated',
      );
    }

    // Update invoice fields
    Object.assign(invoice, dto);

    // Update items if provided
    if (dto.items) {
      // Delete old items
      await this.invoiceItemRepository.delete({ invoiceId: id });

      // Create new items
      const items = dto.items.map((itemDto) =>
        this.invoiceItemRepository.create({
          invoiceId: id,
          ...itemDto,
        }),
      );
      await this.invoiceItemRepository.save(items);
    }

    await this.invoiceRepository.save(invoice);

    return this.findOne(tenantId, id);
  }

  /**
   * Issue invoice (generate XML and sign)
   */
  async issue(
    tenantId: string,
    id: string,
    dto: IssueEInvoiceDto,
  ): Promise<EInvoice> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceStatus !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be issued');
    }

    try {
      // Generate XML
      const xmlContent = this.xmlGenerationService.generateInvoiceXml(invoice);

      // Create storage directory
      const storageDir = path.join(
        process.cwd(),
        'storage',
        'invoices',
        tenantId,
      );
      await fs.mkdir(storageDir, { recursive: true });

      // Save XML file
      const xmlFileName = `${invoice.invoiceSeries}_${invoice.invoiceNumber}.xml`;
      const xmlFilePath = path.join(storageDir, xmlFileName);
      await fs.writeFile(xmlFilePath, xmlContent, 'utf8');

      // Sign XML
      const { signedXml, signature } =
        await this.digitalSignatureService.signXml(xmlContent);

      // Save signed XML file
      const signedXmlFileName = `${invoice.invoiceSeries}_${invoice.invoiceNumber}_signed.xml`;
      const signedXmlFilePath = path.join(storageDir, signedXmlFileName);
      await fs.writeFile(signedXmlFilePath, signedXml, 'utf8');

      // Generate lookup code
      const lookupCode = dto.lookupCode || this.generateLookupCode(invoice);

      // Update invoice
      invoice.invoiceStatus = InvoiceStatus.ISSUED;
      invoice.issueDate = new Date();
      invoice.signedDate = new Date();
      invoice.xmlFilePath = xmlFilePath;
      invoice.signedXmlFilePath = signedXmlFilePath;
      invoice.signature = signature;
      invoice.signerName = dto.signerName;
      invoice.lookupCode = lookupCode;

      await this.invoiceRepository.save(invoice);

      return this.findOne(tenantId, id);
    } catch (error) {
      console.error('Error issuing invoice:', error);
      throw new BadRequestException(`Failed to issue invoice: ${error.message}`);
    }
  }

  /**
   * Send invoice to customer (via email)
   */
  async send(tenantId: string, id: string): Promise<EInvoice> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceStatus !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Only issued invoices can be sent');
    }

    // TODO: Implement email sending
    // For now, just update status

    invoice.invoiceStatus = InvoiceStatus.SENT;
    await this.invoiceRepository.save(invoice);

    return this.findOne(tenantId, id);
  }

  /**
   * Cancel invoice
   */
  async cancel(
    tenantId: string,
    id: string,
    dto: CancelEInvoiceDto,
  ): Promise<EInvoice> {
    const invoice = await this.findOne(tenantId, id);

    if (![InvoiceStatus.ISSUED, InvoiceStatus.SENT].includes(invoice.invoiceStatus)) {
      throw new BadRequestException(
        'Only issued or sent invoices can be cancelled',
      );
    }

    invoice.invoiceStatus = InvoiceStatus.CANCELLED;
    invoice.notes = `${invoice.notes || ''}\nCancelled: ${dto.reason}`;
    await this.invoiceRepository.save(invoice);

    return this.findOne(tenantId, id);
  }

  /**
   * Replace invoice (create replacement invoice)
   */
  async replace(
    tenantId: string,
    id: string,
    dto: ReplaceEInvoiceDto,
  ): Promise<EInvoice> {
    const originalInvoice = await this.findOne(tenantId, dto.originalInvoiceId);

    if (originalInvoice.invoiceStatus === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot replace a cancelled invoice');
    }

    // Create new replacement invoice
    const createDto: CreateEInvoiceDto = {
      invoiceSeries: originalInvoice.invoiceSeries,
      templateCode: originalInvoice.templateCode,
      invoiceType: originalInvoice.invoiceType,
      invoiceDate: new Date().toISOString().split('T')[0],
      customerId: originalInvoice.customerId,
      customerName: originalInvoice.customerName,
      customerTaxCode: originalInvoice.customerTaxCode,
      customerAddress: originalInvoice.customerAddress,
      customerEmail: originalInvoice.customerEmail,
      customerPhone: originalInvoice.customerPhone,
      buyerName: originalInvoice.buyerName,
      paymentMethod: originalInvoice.paymentMethod,
      bankAccount: originalInvoice.bankAccount,
      bankName: originalInvoice.bankName,
      subtotal: dto.items.reduce((sum, item) => sum + item.lineAmount, 0),
      discountAmount: dto.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0),
      taxAmount: dto.items.reduce((sum, item) => sum + item.taxAmount, 0),
      totalAmount: dto.items.reduce((sum, item) => sum + item.totalAmount, 0),
      items: dto.items,
    };

    const newInvoice = await this.create(tenantId, createDto);

    // Set replacement info
    newInvoice.originalInvoiceId = dto.originalInvoiceId;
    newInvoice.replacementReason = dto.replacementReason;
    await this.invoiceRepository.save(newInvoice);

    // Mark original as replaced
    originalInvoice.invoiceStatus = InvoiceStatus.REPLACED;
    await this.invoiceRepository.save(originalInvoice);

    return this.findOne(tenantId, newInvoice.id);
  }

  /**
   * Delete draft invoice
   */
  async remove(tenantId: string, id: string): Promise<void> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceStatus !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be deleted');
    }

    invoice.deletedAt = new Date();
    await this.invoiceRepository.save(invoice);
  }

  /**
   * Download XML file
   */
  async downloadXml(tenantId: string, id: string, signed: boolean = false): Promise<string> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.invoiceStatus === InvoiceStatus.DRAFT) {
      throw new BadRequestException('Draft invoices do not have XML files');
    }

    const filePath = signed ? invoice.signedXmlFilePath : invoice.xmlFilePath;
    
    if (!filePath) {
      throw new NotFoundException('XML file not found');
    }

    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new NotFoundException('XML file not found on disk');
    }
  }

  /**
   * Generate next invoice number for a series
   */
  private async generateInvoiceNumber(
    tenantId: string,
    series: string,
  ): Promise<string> {
    const lastInvoice = await this.invoiceRepository.findOne({
      where: { tenantId, invoiceSeries: series },
      order: { invoiceNumber: 'DESC' },
    });

    if (!lastInvoice) {
      return '0000001';
    }

    const lastNumber = parseInt(lastInvoice.invoiceNumber, 10);
    const nextNumber = lastNumber + 1;
    return nextNumber.toString().padStart(7, '0');
  }

  /**
   * Generate lookup code for invoice
   */
  private generateLookupCode(invoice: EInvoice): string {
    const date = new Date(invoice.invoiceDate);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${invoice.invoiceSeries}${dateStr}${randomStr}`;
  }

  /**
   * Convert amount to Vietnamese words
   */
  private convertAmountToWords(amount: number): string {
    // Simplified version - just return formatted number
    // TODO: Implement full Vietnamese number-to-words conversion
    const formatted = new Intl.NumberFormat('vi-VN').format(amount);
    return `${formatted} đồng chẵn`;
  }
}
