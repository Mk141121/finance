import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JournalEntry, JournalEntryType, JournalEntryStatus } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(JournalEntry)
    private journalEntriesRepository: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private journalEntryLinesRepository: Repository<JournalEntryLine>,
    @InjectRepository(ChartOfAccount)
    private chartOfAccountsRepository: Repository<ChartOfAccount>,
    private dataSource: DataSource,
  ) {}

  // ==================== CHART OF ACCOUNTS ====================
  async findAllAccounts(tenantId: string): Promise<ChartOfAccount[]> {
    return await this.chartOfAccountsRepository.find({
      where: { tenantId, deletedAt: null },
      order: { accountCode: 'ASC' },
    });
  }

  async findAccountByCode(
    tenantId: string,
    accountCode: string,
  ): Promise<ChartOfAccount> {
    const account = await this.chartOfAccountsRepository.findOne({
      where: { tenantId, accountCode, deletedAt: null },
    });
    if (!account) {
      throw new NotFoundException(`Account ${accountCode} not found`);
    }
    return account;
  }

  // ==================== JOURNAL ENTRIES ====================
  async createJournalEntry(
    createDto: CreateJournalEntryDto,
    tenantId: string,
    userId: string,
  ): Promise<JournalEntry> {
    const { lines, ...entryData } = createDto;

    // Validate: Debit must equal Credit
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Debit (${totalDebit}) must equal Credit (${totalCredit})`,
      );
    }

    const journalEntry = this.journalEntriesRepository.create({
      ...entryData,
      tenantId,
      createdBy: userId,
      totalDebit,
      totalCredit,
      status: JournalEntryStatus.DRAFT,
    });

    // Create lines
    const entryLines: JournalEntryLine[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const entryLine = this.journalEntryLinesRepository.create({
        ...line,
        tenantId,
        lineNumber: i + 1,
        debitAmount: Number(line.debitAmount),
        creditAmount: Number(line.creditAmount),
      });
      entryLines.push(entryLine);
    }

    journalEntry.lines = entryLines;
    return await this.journalEntriesRepository.save(journalEntry);
  }

  async findAllJournalEntries(tenantId: string): Promise<JournalEntry[]> {
    return await this.journalEntriesRepository.find({
      where: { tenantId, deletedAt: null },
      relations: ['lines', 'lines.account'],
      order: { entryDate: 'DESC', entryNumber: 'DESC' },
    });
  }

  async findOneJournalEntry(id: string, tenantId: string): Promise<JournalEntry> {
    const entry = await this.journalEntriesRepository.findOne({
      where: { id, tenantId, deletedAt: null },
      relations: ['lines', 'lines.account'],
    });

    if (!entry) {
      throw new NotFoundException(`Journal Entry with ID ${id} not found`);
    }

    return entry;
  }

  async postJournalEntry(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<JournalEntry> {
    const entry = await this.findOneJournalEntry(id, tenantId);

    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new BadRequestException('Only draft entries can be posted');
    }

    entry.status = JournalEntryStatus.POSTED;
    entry.postedBy = userId;
    entry.postedAt = new Date();

    return await this.journalEntriesRepository.save(entry);
  }

  // ==================== AUTO JOURNAL ENTRIES ====================
  
  /**
   * Tự động tạo bút toán từ Sales Order
   * Nợ TK 131 (Phải thu KH): Total amount
   * Có TK 511 (Doanh thu): Subtotal + Discount
   * Có TK 3331 (VAT phải nộp): Tax amount
   * 
   * Nợ TK 632 (Giá vốn): Cost of goods
   * Có TK 156 (Hàng hóa): Cost of goods
   */
  async createJournalEntryFromSalesOrder(
    tenantId: string,
    userId: string,
    salesOrderId: string,
    salesOrderData: {
      code: string;
      date: Date;
      customerId: string;
      total: number;
      subtotal: number;
      discountAmount: number;
      taxAmount: number;
      items: Array<{ quantity: number; unitCost: number }>;
    },
  ): Promise<JournalEntry> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get accounts
      const acc131 = await this.findAccountByCode(tenantId, '131'); // Phải thu KH
      const acc511 = await this.findAccountByCode(tenantId, '511'); // Doanh thu
      const acc3331 = await this.findAccountByCode(tenantId, '3331'); // VAT phải nộp
      const acc632 = await this.findAccountByCode(tenantId, '632'); // Giá vốn
      const acc156 = await this.findAccountByCode(tenantId, '156'); // Hàng hóa

      // Calculate cost of goods sold
      const cogs = salesOrderData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0,
      );

      const entryNumber = `JE-SO-${salesOrderData.code}`;
      const description = `Bán hàng ${salesOrderData.code}`;

      // Create journal entry
      const journalEntry = this.journalEntriesRepository.create({
        tenantId,
        entryNumber,
        entryDate: salesOrderData.date,
        type: JournalEntryType.AUTO_SALES,
        status: JournalEntryStatus.DRAFT,
        description,
        referenceType: 'sales_order',
        referenceId: salesOrderId,
        createdBy: userId,
        totalDebit: salesOrderData.total + cogs,
        totalCredit: salesOrderData.total + cogs,
      });

      const lines: JournalEntryLine[] = [];
      let lineNumber = 1;

      // Line 1: Nợ TK 131 (Phải thu KH)
      lines.push(
        this.journalEntryLinesRepository.create({
          tenantId,
          lineNumber: lineNumber++,
          accountId: acc131.id,
          debitAmount: salesOrderData.total,
          creditAmount: 0,
          description: `Phải thu khách hàng ${salesOrderData.code}`,
          partnerType: 'customer',
          partnerId: salesOrderData.customerId,
        }),
      );

      // Line 2: Có TK 511 (Doanh thu)
      const revenueAmount = salesOrderData.subtotal - salesOrderData.discountAmount;
      lines.push(
        this.journalEntryLinesRepository.create({
          tenantId,
          lineNumber: lineNumber++,
          accountId: acc511.id,
          debitAmount: 0,
          creditAmount: revenueAmount,
          description: `Doanh thu bán hàng ${salesOrderData.code}`,
        }),
      );

      // Line 3: Có TK 3331 (VAT phải nộp)
      if (salesOrderData.taxAmount > 0) {
        lines.push(
          this.journalEntryLinesRepository.create({
            tenantId,
            lineNumber: lineNumber++,
            accountId: acc3331.id,
            debitAmount: 0,
            creditAmount: salesOrderData.taxAmount,
            description: `VAT đầu ra ${salesOrderData.code}`,
          }),
        );
      }

      // Line 4: Nợ TK 632 (Giá vốn)
      if (cogs > 0) {
        lines.push(
          this.journalEntryLinesRepository.create({
            tenantId,
            lineNumber: lineNumber++,
            accountId: acc632.id,
            debitAmount: cogs,
            creditAmount: 0,
            description: `Giá vốn hàng bán ${salesOrderData.code}`,
          }),
        );

        // Line 5: Có TK 156 (Hàng hóa)
        lines.push(
          this.journalEntryLinesRepository.create({
            tenantId,
            lineNumber: lineNumber++,
            accountId: acc156.id,
            debitAmount: 0,
            creditAmount: cogs,
            description: `Xuất kho ${salesOrderData.code}`,
          }),
        );
      }

      journalEntry.lines = lines;
      const savedEntry = await queryRunner.manager.save(journalEntry);

      await queryRunner.commitTransaction();
      return savedEntry;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Tự động tạo bút toán từ Purchase Order
   * Nợ TK 156 (Hàng hóa): Subtotal - Discount
   * Nợ TK 1331 (VAT đầu vào): Tax amount
   * Có TK 331 (Phải trả NCC): Total amount
   */
  async createJournalEntryFromPurchaseOrder(
    tenantId: string,
    userId: string,
    purchaseOrderId: string,
    purchaseOrderData: {
      code: string;
      date: Date;
      supplierId: string;
      total: number;
      subtotal: number;
      discountAmount: number;
      taxAmount: number;
    },
  ): Promise<JournalEntry> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get accounts
      const acc156 = await this.findAccountByCode(tenantId, '156'); // Hàng hóa
      const acc1331 = await this.findAccountByCode(tenantId, '1331'); // VAT đầu vào
      const acc331 = await this.findAccountByCode(tenantId, '331'); // Phải trả NCC

      const entryNumber = `JE-PO-${purchaseOrderData.code}`;
      const description = `Mua hàng ${purchaseOrderData.code}`;

      const journalEntry = this.journalEntriesRepository.create({
        tenantId,
        entryNumber,
        entryDate: purchaseOrderData.date,
        type: JournalEntryType.AUTO_PURCHASE,
        status: JournalEntryStatus.DRAFT,
        description,
        referenceType: 'purchase_order',
        referenceId: purchaseOrderId,
        createdBy: userId,
        totalDebit: purchaseOrderData.total,
        totalCredit: purchaseOrderData.total,
      });

      const lines: JournalEntryLine[] = [];
      let lineNumber = 1;

      // Line 1: Nợ TK 156 (Hàng hóa)
      const goodsAmount = purchaseOrderData.subtotal - purchaseOrderData.discountAmount;
      lines.push(
        this.journalEntryLinesRepository.create({
          tenantId,
          lineNumber: lineNumber++,
          accountId: acc156.id,
          debitAmount: goodsAmount,
          creditAmount: 0,
          description: `Nhập kho ${purchaseOrderData.code}`,
        }),
      );

      // Line 2: Nợ TK 1331 (VAT đầu vào)
      if (purchaseOrderData.taxAmount > 0) {
        lines.push(
          this.journalEntryLinesRepository.create({
            tenantId,
            lineNumber: lineNumber++,
            accountId: acc1331.id,
            debitAmount: purchaseOrderData.taxAmount,
            creditAmount: 0,
            description: `VAT đầu vào ${purchaseOrderData.code}`,
          }),
        );
      }

      // Line 3: Có TK 331 (Phải trả NCC)
      lines.push(
        this.journalEntryLinesRepository.create({
          tenantId,
          lineNumber: lineNumber++,
          accountId: acc331.id,
          debitAmount: 0,
          creditAmount: purchaseOrderData.total,
          description: `Phải trả NCC ${purchaseOrderData.code}`,
          partnerType: 'supplier',
          partnerId: purchaseOrderData.supplierId,
        }),
      );

      journalEntry.lines = lines;
      const savedEntry = await queryRunner.manager.save(journalEntry);

      await queryRunner.commitTransaction();
      return savedEntry;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteJournalEntry(id: string, tenantId: string): Promise<void> {
    const entry = await this.findOneJournalEntry(id, tenantId);
    
    if (entry.status === JournalEntryStatus.POSTED) {
      throw new BadRequestException('Cannot delete posted journal entry');
    }

    entry.deletedAt = new Date();
    await this.journalEntriesRepository.save(entry);
  }
}
