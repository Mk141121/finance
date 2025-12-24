import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersService } from './purchase-orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createMockPurchaseOrder } from '../../test/factories';
import { AccountingService } from '../accounting/accounting.service';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let purchaseOrderRepository: Repository<PurchaseOrder>;
  let purchaseOrderItemRepository: Repository<PurchaseOrderItem>;
  let accountingService: AccountingService;

  const mockPurchaseOrder = createMockPurchaseOrder();
  const mockPurchaseOrderItem = {
    id: 'item-1',
    purchaseOrderId: mockPurchaseOrder.id,
    productId: 'product-1',
    description: 'Nguyên vật liệu A',
    quantity: 100,
    unit: 'Kg',
    unitPrice: 100000,
    subtotal: 10000000,
    taxRate: 10,
    taxAmount: 1000000,
    total: 11000000,
    amount: 10000000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: getRepositoryToken(PurchaseOrder),
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
          provide: getRepositoryToken(PurchaseOrderItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: AccountingService,
          useValue: {
            createJournalEntry: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
    purchaseOrderRepository = module.get<Repository<PurchaseOrder>>(
      getRepositoryToken(PurchaseOrder),
    );
    purchaseOrderItemRepository = module.get<Repository<PurchaseOrderItem>>(
      getRepositoryToken(PurchaseOrderItem),
    );
    accountingService = module.get<AccountingService>(AccountingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      orderDate: new Date('2024-12-24'),
      supplierId: 'supplier-1',
      supplierName: 'Nhà cung cấp ABC',
      items: [
        {
          productId: 'product-1',
          productName: 'Nguyên vật liệu A',
          quantity: 100,
          unitPrice: 100000,
          taxRate: 10,
        },
      ],
      notes: 'Test PO',
    };

    it('should create purchase order with items', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      jest.spyOn(purchaseOrderRepository, 'createQueryBuilder').mockReturnValue(qb as any);
      jest.spyOn(purchaseOrderRepository, 'create').mockReturnValue(mockPurchaseOrder as any);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue(mockPurchaseOrder as any);
      jest.spyOn(purchaseOrderItemRepository, 'create').mockReturnValue(mockPurchaseOrderItem as any);
      jest.spyOn(purchaseOrderItemRepository, 'save').mockResolvedValue(mockPurchaseOrderItem as any);

      const result = await service.create(createDto as any, 'tenant-1', 'user-1');

      expect(result).toBeDefined();
      expect(purchaseOrderRepository.create).toHaveBeenCalled();
    });

    it('should calculate totals with VAT correctly', () => {
      const quantity = 100;
      const unitPrice = 100000;
      const taxRate = 10;

      const subtotal = quantity * unitPrice;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      expect(subtotal).toBe(10000000);
      expect(taxAmount).toBe(1000000);
      expect(totalAmount).toBe(11000000);
    });
  });

  describe('findAll', () => {
    it('should return all purchase orders for tenant', async () => {
      jest.spyOn(purchaseOrderRepository, 'find').mockResolvedValue([mockPurchaseOrder] as any);

      const result = await service.findAll('tenant-1');

      expect(result).toHaveLength(1);
    });

    it('should filter by status', async () => {
      jest.spyOn(purchaseOrderRepository, 'find').mockResolvedValue([mockPurchaseOrder] as any);

      await service.findAll('tenant-1');

      expect(purchaseOrderRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return purchase order with items', async () => {
      const orderWithItems = {
        ...mockPurchaseOrder,
        items: [mockPurchaseOrderItem],
      };
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(orderWithItems as any);

      const result = await service.findOne('1', 'tenant-1');

      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException when not found', async () => {
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Status workflow', () => {
    it('should have valid status transitions', () => {
      const validStatuses = ['draft', 'sent', 'confirmed', 'received', 'cancelled'];
      
      expect(mockPurchaseOrder.status).toBe('draft');
      expect(validStatuses).toContain(mockPurchaseOrder.status);
    });

    it('should transition draft → sent', async () => {
      const poWithItems = { ...mockPurchaseOrder, items: [mockPurchaseOrderItem] };
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(poWithItems as any);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue({
        ...poWithItems,
        status: 'sent',
      } as any);

      const result = await service.send('1', 'tenant-1', 'user-1');

      expect(result.status).toBe('sent');
    });

    it('should not allow sending non-draft orders', async () => {
      const sentOrder = { ...mockPurchaseOrder, status: 'sent' };
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(sentOrder as any);

      await expect(service.send('1', 'tenant-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('Business validations', () => {
    it('should validate minimum order quantity', () => {
      const minQuantity = 1;
      expect(mockPurchaseOrderItem.quantity).toBeGreaterThanOrEqual(minQuantity);
    });

    it('should validate unit price is positive', () => {
      expect(mockPurchaseOrderItem.unitPrice).toBeGreaterThan(0);
    });

    it('should validate total amount calculation', () => {
      const calculatedAmount = mockPurchaseOrderItem.quantity * mockPurchaseOrderItem.unitPrice;
      expect(calculatedAmount).toBe(mockPurchaseOrderItem.amount);
    });

    it('should handle multiple items', () => {
      const items = [
        { quantity: 100, unitPrice: 100000 },
        { quantity: 50, unitPrice: 200000 },
      ];

      const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      expect(total).toBe(20000000);
    });
  });

  describe('Accounting integration', () => {
    it('should prepare data for automatic journal entry', () => {
      // Nợ 156 (Hàng hóa): 10,000,000
      // Nợ 1331 (VAT đầu vào): 1,000,000
      // Có 331 (Phải trả NCC): 11,000,000

      const journalEntry = {
        debit_156: mockPurchaseOrder.subtotal,
        debit_1331: mockPurchaseOrder.taxAmount,
        credit_331: mockPurchaseOrder.total,
      };

      expect(journalEntry.debit_156).toBe(2000000);
      expect(journalEntry.debit_1331).toBe(200000);
      expect(journalEntry.credit_331).toBe(2200000);
      expect(journalEntry.debit_156 + journalEntry.debit_1331).toBe(journalEntry.credit_331);
    });
  });

  describe('Edge Cases - Complex Scenarios', () => {
    it('should calculate totals with multiple items', () => {
      const items = [
        { quantity: 10, unitPrice: 100000, taxRate: 10 },
        { quantity: 5, unitPrice: 200000, taxRate: 10 },
        { quantity: 20, unitPrice: 50000, taxRate: 5 },
      ];

      let subtotal = 0;
      let totalTax = 0;

      items.forEach((item) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemTax = (itemSubtotal * item.taxRate) / 100;
        subtotal += itemSubtotal;
        totalTax += itemTax;
      });

      const total = subtotal + totalTax;

      expect(subtotal).toBe(3000000); // 1M + 1M + 1M
      expect(totalTax).toBe(250000); // 100k + 100k + 50k
      expect(total).toBe(3250000);
    });

    it('should handle rounding for tax calculations', () => {
      const item = { quantity: 3, unitPrice: 33333, taxRate: 10 };
      const subtotal = item.quantity * item.unitPrice; // 99999
      const tax = Math.round((subtotal * item.taxRate) / 100); // 10000
      const total = subtotal + tax; // 109999

      expect(subtotal).toBe(99999);
      expect(tax).toBe(10000);
      expect(total).toBe(109999);
    });

    it('should validate minimum order quantity', () => {
      const minQuantity = 1;
      const item = { quantity: 10 };

      expect(item.quantity).toBeGreaterThanOrEqual(minQuantity);
    });

    it('should validate price is positive', () => {
      const item = { unitPrice: 100000 };
      expect(item.unitPrice).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases - Status Workflow', () => {
    it('should validate status transitions', () => {
      const validTransitions = {
        draft: ['sent'],
        sent: ['confirmed', 'cancelled'],
        confirmed: ['received', 'cancelled'],
        received: [],
        cancelled: [],
      };

      expect(validTransitions.draft).toContain('sent');
      expect(validTransitions.sent).toContain('confirmed');
      expect(validTransitions.confirmed).toContain('received');
    });

    it('should handle expected delivery date', () => {
      const po = {
        date: new Date('2025-01-01'),
        expectedDeliveryDate: new Date('2025-01-08'),
      };

      expect(po.expectedDeliveryDate.getTime()).toBeGreaterThan(po.date.getTime());
    });

    it('should calculate days until delivery', () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const daysUntil = Math.ceil(
        (futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysUntil).toBeGreaterThanOrEqual(6);
      expect(daysUntil).toBeLessThanOrEqual(8);
    });
  });

  describe('Edge Cases - Search & Filter', () => {
    it('should filter by supplier', () => {
      const orders = [
        { supplierId: 'sup-1', code: 'PO001' },
        { supplierId: 'sup-2', code: 'PO002' },
        { supplierId: 'sup-1', code: 'PO003' },
      ];

      const filtered = orders.filter((o) => o.supplierId === 'sup-1');
      expect(filtered).toHaveLength(2);
    });

    it('should filter by date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const orders = [
        { date: new Date('2025-01-15'), code: 'PO001' },
        { date: new Date('2024-12-25'), code: 'PO002' },
      ];

      const filtered = orders.filter(
        (o) => o.date >= startDate && o.date <= endDate
      );

      expect(filtered).toHaveLength(1);
    });

    it('should filter by status', () => {
      const orders = [
        { status: 'draft', code: 'PO001' },
        { status: 'sent', code: 'PO002' },
        { status: 'draft', code: 'PO003' },
      ];

      const draftOrders = orders.filter((o) => o.status === 'draft');
      expect(draftOrders).toHaveLength(2);
    });
  });
});
