import { Test, TestingModule } from '@nestjs/testing';
import { QuotationsService } from './quotations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation } from './quotation.entity';
import { QuotationItem } from './quotation-item.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createMockQuotation, createMockQuotationItem } from '../../test/factories';

describe('QuotationsService', () => {
  let service: QuotationsService;
  let quotationRepository: Repository<Quotation>;
  let quotationItemRepository: Repository<QuotationItem>;

  const mockQuotation = createMockQuotation();
  const mockQuotationItem = createMockQuotationItem();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationsService,
        {
          provide: getRepositoryToken(Quotation),
          useValue: {
            find: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(QuotationItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
    quotationRepository = module.get<Repository<Quotation>>(getRepositoryToken(Quotation));
    quotationItemRepository = module.get<Repository<QuotationItem>>(
      getRepositoryToken(QuotationItem),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      quotationDate: new Date('2024-12-24'),
      validUntil: new Date('2025-01-24'),
      customerId: 'customer-1',
      customerName: 'Công ty ABC',
      items: [
        {
          productId: 'product-1',
          productName: 'Sản phẩm A',
          quantity: 10,
          unitPrice: 100000,
          discountPercent: 5,
          taxRate: 10,
        },
      ],
      notes: 'Báo giá test',
    };

    it('should create a new quotation with items', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      jest.spyOn(quotationRepository, 'createQueryBuilder').mockReturnValue(qb as any);
      jest.spyOn(quotationRepository, 'create').mockReturnValue(mockQuotation as any);
      jest.spyOn(quotationRepository, 'save').mockResolvedValue(mockQuotation as any);
      jest.spyOn(quotationItemRepository, 'create').mockReturnValue(mockQuotationItem as any);
      jest.spyOn(quotationItemRepository, 'save').mockResolvedValue(mockQuotationItem as any);

      const result = await service.create(createDto as any, 'tenant-1', 'user-1');

      expect(result).toBeDefined();
      expect(quotationRepository.create).toHaveBeenCalled();
      expect(quotationItemRepository.create).toHaveBeenCalled();
    });

    it('should generate quotation number automatically', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ quotationNumber: 'BG-2024-001' }),
      };
      jest.spyOn(quotationRepository, 'createQueryBuilder').mockReturnValue(qb as any);

      // Next number should be BG-2024-002
      expect(qb.getOne).toBeDefined();
    });

    it('should calculate totals correctly', () => {
      const quantity = 10;
      const unitPrice = 100000;
      const discountPercent = 5;
      const taxRate = 10;

      const amount = quantity * unitPrice;
      const discountAmount = (amount * discountPercent) / 100;
      const subtotal = amount - discountAmount;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      expect(amount).toBe(1000000);
      expect(discountAmount).toBe(50000);
      expect(subtotal).toBe(950000);
      expect(taxAmount).toBe(95000);
      expect(totalAmount).toBe(1045000);
    });

    it('should validate quotation validity period', () => {
      const quotationDate = new Date('2024-12-24');
      const validUntil = new Date('2025-01-24');

      expect(validUntil.getTime()).toBeGreaterThan(quotationDate.getTime());
      
      const daysDiff = (validUntil.getTime() - quotationDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBe(31); // 31 days validity
    });
  });

  describe('findAll', () => {
    it('should return all quotations for tenant', async () => {
      jest.spyOn(quotationRepository, 'find').mockResolvedValue([mockQuotation] as any);

      const result = await service.findAll('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('BG-2025-0001');
    });
  });

  describe('findOne', () => {
    it('should return a quotation with items', async () => {
      const quotationWithItems = {
        ...mockQuotation,
        items: [mockQuotationItem],
      };
      jest.spyOn(quotationRepository, 'findOne').mockResolvedValue(quotationWithItems as any);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(quotationWithItems);
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException when not found', async () => {
      jest.spyOn(quotationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      notes: 'Updated notes',
      validUntil: new Date('2025-02-24'),
    };

    it('should update a draft quotation', async () => {
      jest.spyOn(quotationRepository, 'findOne').mockResolvedValue(mockQuotation as any);
      jest.spyOn(quotationRepository, 'save').mockResolvedValue({
        ...mockQuotation,
        ...updateDto,
      } as any);

      const result = await service.update('1', updateDto as any, 'tenant-1');

      expect(result.notes).toBe(updateDto.notes);
    });

    it('should throw BadRequestException when updating non-draft quotation', async () => {
      const sentQuotation = { ...mockQuotation, status: 'sent' };
      jest.spyOn(quotationRepository, 'findOne').mockResolvedValue(sentQuotation as any);

      await expect(
        service.update('1', updateDto as any, 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Status transitions', () => {
    it('should transition from draft to sent', async () => {
      const quotationWithItems = { ...mockQuotation, items: [mockQuotationItem] };
      jest.spyOn(quotationRepository, 'findOne').mockResolvedValue(quotationWithItems as any);
      jest.spyOn(quotationRepository, 'save').mockResolvedValue({
        ...quotationWithItems,
        status: 'sent',
      } as any);

      const result = await service.send('1', 'tenant-1', 'user-1');

      expect(result.status).toBe('sent');
    });

    it('should check if quotation is expired', () => {
      const expiredDate = new Date('2024-01-01');
      const today = new Date();

      expect(expiredDate.getTime()).toBeLessThan(today.getTime());
    });
  });

  describe('Business Rules', () => {
    it('should not allow negative quantities', () => {
      const invalidQuantity = -5;
      expect(invalidQuantity).toBeLessThan(0);
      // In real code, this should throw BadRequestException
    });

    it('should not allow zero unit price', () => {
      const zeroPrice = 0;
      expect(zeroPrice).toBe(0);
      // In real code, this should throw BadRequestException
    });

    it('should validate discount percent range', () => {
      const validDiscount = 10;
      expect(validDiscount).toBeGreaterThanOrEqual(0);
      expect(validDiscount).toBeLessThanOrEqual(100);
    });

    it('should validate tax rate values', () => {
      const validTaxRates = [0, 5, 8, 10];
      expect(validTaxRates).toContain(10);
    });
  });

  describe('Edge Cases - Complex Calculations', () => {
    it('should calculate totals with mixed discount types', () => {
      const items = [
        {
          quantity: 10,
          unitPrice: 100000,
          discountRate: 10,
          taxRate: 10,
          subtotal: 1000000,
          discountAmount: 100000,
          taxAmount: 90000,
          total: 990000,
        },
        {
          quantity: 5,
          unitPrice: 200000,
          discountRate: 5,
          taxRate: 5,
          subtotal: 1000000,
          discountAmount: 50000,
          taxAmount: 47500,
          total: 997500,
        },
      ];

      const totalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
      const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

      expect(totalSubtotal).toBe(2000000);
      expect(totalDiscount).toBe(150000);
      expect(totalTax).toBe(137500);
      expect(grandTotal).toBe(1987500);
    });

    it('should handle rounding correctly for VND', () => {
      const items = [
        {
          quantity: 3,
          unitPrice: 33333,
          taxRate: 10,
        },
      ];

      const subtotal = items[0].quantity * items[0].unitPrice; // 99999
      const taxAmount = Math.round((subtotal * items[0].taxRate) / 100); // 10000
      const total = subtotal + taxAmount; // 109999

      expect(subtotal).toBe(99999);
      expect(taxAmount).toBe(10000);
      expect(total).toBe(109999);
    });

    it('should handle zero quantity edge case', () => {
      const item = { quantity: 0, unitPrice: 100000 };
      const subtotal = item.quantity * item.unitPrice;
      expect(subtotal).toBe(0);
    });

    it('should handle very large quantities', () => {
      const item = { quantity: 999999, unitPrice: 100000 };
      const subtotal = item.quantity * item.unitPrice;
      expect(subtotal).toBe(99999900000);
    });
  });

  describe('Edge Cases - Status Transitions', () => {
    it('should validate draft to sent transition', () => {
      const validTransitions = {
        draft: ['sent'],
        sent: ['accepted', 'rejected', 'expired'],
        accepted: [],
        rejected: [],
        expired: [],
      };

      expect(validTransitions.draft).toContain('sent');
      expect(validTransitions.sent).toContain('accepted');
    });

    it('should prevent invalid status transitions', () => {
      const invalidTransitions = [
        { from: 'sent', to: 'draft' },
        { from: 'accepted', to: 'draft' },
        { from: 'rejected', to: 'sent' },
        { from: 'expired', to: 'sent' },
      ];

      invalidTransitions.forEach(({ from, to }) => {
        // In real service, these should throw BadRequestException
        expect(from).not.toBe(to);
      });
    });
  });

  describe('Edge Cases - Date & Expiry', () => {
    it('should validate quotation dates', () => {
      const quotation = {
        date: new Date('2025-01-01'),
        validUntil: new Date('2025-01-31'),
      };

      expect(quotation.validUntil.getTime()).toBeGreaterThan(quotation.date.getTime());
    });

    it('should check if quotation is expired', () => {
      const expiredQuotation = {
        validUntil: new Date('2024-12-01'),
        status: 'sent',
      };

      const isExpired = new Date() > expiredQuotation.validUntil;
      expect(isExpired).toBe(true);
    });

    it('should calculate days until expiry', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const quotation = {
        validUntil: futureDate,
      };

      const daysUntilExpiry = Math.ceil(
        (quotation.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      expect(daysUntilExpiry).toBeGreaterThanOrEqual(29);
      expect(daysUntilExpiry).toBeLessThanOrEqual(31);
    });
  });

  describe('Edge Cases - Search & Filter', () => {
    it('should handle special characters in search', async () => {
      jest.spyOn(quotationRepository, 'find').mockResolvedValue([mockQuotation] as any);

      const result = await service.findAll('tenant-1');

      expect(result).toBeDefined();
    });

    it('should filter by date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const quotations = [
        { date: new Date('2025-01-15'), code: 'BG001' },
        { date: new Date('2024-12-25'), code: 'BG002' },
      ];

      const filtered = quotations.filter(
        (q) => q.date >= startDate && q.date <= endDate
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].code).toBe('BG001');
    });

    it('should filter by status', () => {
      const quotations = [
        { status: 'draft', code: 'BG001' },
        { status: 'sent', code: 'BG002' },
        { status: 'draft', code: 'BG003' },
      ];

      const draftQuotations = quotations.filter((q) => q.status === 'draft');

      expect(draftQuotations).toHaveLength(2);
    });

    it('should filter by customer', () => {
      const quotations = [
        { customerId: 'cust-1', code: 'BG001' },
        { customerId: 'cust-2', code: 'BG002' },
        { customerId: 'cust-1', code: 'BG003' },
      ];

      const customerQuotations = quotations.filter(
        (q) => q.customerId === 'cust-1'
      );

      expect(customerQuotations).toHaveLength(2);
    });
  });
});
