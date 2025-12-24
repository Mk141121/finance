import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation, QuotationStatus } from './quotation.entity';
import { QuotationItem } from './quotation-item.entity';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private quotationsRepository: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private quotationItemsRepository: Repository<QuotationItem>,
  ) {}

  async create(
    createQuotationDto: CreateQuotationDto,
    tenantId: string,
    userId: string,
  ): Promise<Quotation> {
    const { items, ...quotationData } = createQuotationDto;

    // Calculate totals
    let subtotal = 0;
    const quotationItems: QuotationItem[] = [];

    items.forEach((item, index) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discountRate = Number(item.discountRate || 0);
      const taxRate = Number(item.taxRate || quotationData.taxRate || 10);

      const lineSubtotal = quantity * unitPrice;
      const discountAmount = (lineSubtotal * discountRate) / 100;
      const lineAfterDiscount = lineSubtotal - discountAmount;
      const taxAmount = (lineAfterDiscount * taxRate) / 100;
      const lineTotal = lineAfterDiscount + taxAmount;

      subtotal += lineSubtotal;

      const quotationItem = this.quotationItemsRepository.create({
        ...item,
        tenantId,
        lineNumber: index + 1,
        quantity,
        unitPrice,
        discountRate,
        discountAmount,
        taxRate,
        taxAmount,
        lineTotal,
      });

      quotationItems.push(quotationItem);
    });

    // Calculate quotation totals
    const discountRate = Number(quotationData.discountRate || 0);
    const discountAmount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxRate = Number(quotationData.taxRate || 10);
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;

    const quotation = this.quotationsRepository.create({
      ...quotationData,
      tenantId,
      createdBy: userId,
      subtotal,
      discountRate,
      discountAmount,
      taxRate,
      taxAmount,
      total,
      items: quotationItems,
    });

    return await this.quotationsRepository.save(quotation);
  }

  async findAll(tenantId: string): Promise<Quotation[]> {
    return await this.quotationsRepository.find({
      where: { tenantId, deletedAt: null },
      relations: ['customer', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Quotation> {
    const quotation = await this.quotationsRepository.findOne({
      where: { id, tenantId, deletedAt: null },
      relations: ['customer', 'items', 'items.product'],
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    return quotation;
  }

  async update(
    id: string,
    updateQuotationDto: UpdateQuotationDto,
    tenantId: string,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id, tenantId);

    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft quotations can be updated',
      );
    }

    const { items, ...quotationData } = updateQuotationDto;

    // If items are provided, recalculate
    if (items) {
      // Delete old items
      await this.quotationItemsRepository.delete({
        quotationId: id,
        tenantId,
      });

      // Calculate new totals
      let subtotal = 0;
      const quotationItems: QuotationItem[] = [];

      items.forEach((item, index) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const discountRate = Number(item.discountRate || 0);
        const taxRate = Number(item.taxRate || quotationData.taxRate || 10);

        const lineSubtotal = quantity * unitPrice;
        const discountAmount = (lineSubtotal * discountRate) / 100;
        const lineAfterDiscount = lineSubtotal - discountAmount;
        const taxAmount = (lineAfterDiscount * taxRate) / 100;
        const lineTotal = lineAfterDiscount + taxAmount;

        subtotal += lineSubtotal;

        const quotationItem = this.quotationItemsRepository.create({
          ...item,
          quotationId: id,
          tenantId,
          lineNumber: index + 1,
          quantity,
          unitPrice,
          discountRate,
          discountAmount,
          taxRate,
          taxAmount,
          lineTotal,
        });

        quotationItems.push(quotationItem);
      });

      const discountRate = Number(quotationData.discountRate || 0);
      const discountAmount = (subtotal * discountRate) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxRate = Number(quotationData.taxRate || 10);
      const taxAmount = (afterDiscount * taxRate) / 100;
      const total = afterDiscount + taxAmount;

      Object.assign(quotation, {
        ...quotationData,
        subtotal,
        discountRate,
        discountAmount,
        taxRate,
        taxAmount,
        total,
      });

      quotation.items = quotationItems;
    } else {
      Object.assign(quotation, quotationData);
    }

    return await this.quotationsRepository.save(quotation);
  }

  async updateStatus(
    id: string,
    status: QuotationStatus,
    tenantId: string,
    userId: string,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id, tenantId);

    quotation.status = status;
    if (status === QuotationStatus.ACCEPTED) {
      quotation.approvedBy = userId;
      quotation.approvedAt = new Date();
    }

    return await this.quotationsRepository.save(quotation);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const quotation = await this.findOne(id, tenantId);
    quotation.deletedAt = new Date();
    await this.quotationsRepository.save(quotation);
  }

  /**
   * Send quotation to customer
   * Change status from draft to sent
   */
  async send(id: string, tenantId: string, userId: string): Promise<Quotation> {
    const quotation = await this.findOne(id, tenantId);

    // Validate status
    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ có thể gửi báo giá ở trạng thái Dự thảo'
      );
    }

    // Validate items
    if (!quotation.items || quotation.items.length === 0) {
      throw new BadRequestException(
        'Báo giá phải có ít nhất 1 sản phẩm'
      );
    }

    // Update status
    quotation.status = QuotationStatus.SENT;
    quotation.sentAt = new Date();

    return await this.quotationsRepository.save(quotation);
  }

  async checkExpiredQuotations(tenantId: string): Promise<void> {
    const today = new Date();
    await this.quotationsRepository
      .createQueryBuilder()
      .update(Quotation)
      .set({ status: QuotationStatus.EXPIRED })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere('status IN (:...statuses)', {
        statuses: [QuotationStatus.DRAFT, QuotationStatus.SENT],
      })
      .andWhere('valid_until < :today', { today })
      .execute();
  }
}
