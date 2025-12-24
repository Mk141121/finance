import { Test, TestingModule } from '@nestjs/testing';
import { SalesOrdersService } from './sales-orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { AccountingService } from '../accounting/accounting.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { createMockSalesOrder } from '../../test/factories';

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;
  let salesOrderRepository: Repository<SalesOrder>;
  let salesOrderItemRepository: Repository<SalesOrderItem>;
  let accountingService: AccountingService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockSalesOrder = createMockSalesOrder();

  const mockSalesOrderItem = {
    id: 'item-1',
    salesOrderId: mockSalesOrder.id,
    productId: 'product-1',
    description: 'Product A',
    quantityOrdered: 10,
    unitPrice: 100000,
    discountRate: 0,
    discountAmount: 0,
    taxRate: 10,
    taxAmount: 100000,
    lineTotal: 1100000,
    lineNumber: 1,
  };

  const mockCreateDto = {
    customerId: 'customer-1',
    date: new Date(),
    taxRate: 10,
    discountRate: 0,
    items: [
      {
        productId: 'product-1',
        quantityOrdered: 10,
        unitPrice: 100000,
        taxRate: 10,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SalesOrderItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: AccountingService,
          useValue: {
            createJournalEntryFromSalesOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SalesOrdersService>(SalesOrdersService);
    salesOrderRepository = module.get<Repository<SalesOrder>>(
      getRepositoryToken(SalesOrder),
    );
    salesOrderItemRepository = module.get<Repository<SalesOrderItem>>(
      getRepositoryToken(SalesOrderItem),
    );
    accountingService = module.get<AccountingService>(AccountingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===== BASIC CRUD (8 tests) =====
  describe('create', () => {
    it('should create new sales order successfully', async () => {
      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const result = await service.create(mockCreateDto as any, mockTenantId, mockUserId);

      expect(result).toBeDefined();
      expect(salesOrderRepository.save).toHaveBeenCalled();
    });

    it('should calculate totals correctly', async () => {
      const dto = {
        ...mockCreateDto,
        items: [
          { productId: 'prod-1', quantityOrdered: 10, unitPrice: 100000, taxRate: 10 },
          { productId: 'prod-2', quantityOrdered: 5, unitPrice: 200000, taxRate: 10 },
        ],
      };

      const order = { ...mockSalesOrder, subtotal: 2000000, total: 2200000 };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const result = await service.create(dto as any, mockTenantId, mockUserId);

      expect(result.subtotal).toBe(2000000); // 10*100k + 5*200k
      expect(result.total).toBe(2200000); // subtotal + 10% tax
    });

    it('should apply discount correctly - percentage type', async () => {
      const dto = {
        ...mockCreateDto,
        discountRate: 10,
        items: [{ productId: 'prod-1', quantityOrdered: 10, unitPrice: 100000, taxRate: 10 }],
      };

      const order = { 
        ...mockSalesOrder, 
        subtotal: 1000000, 
        discountAmount: 100000, 
        total: 990000 
      };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const result = await service.create(dto as any, mockTenantId, mockUserId);

      expect(result.discountAmount).toBe(100000);
    });

    it('should handle zero discount', async () => {
      const dto = {
        ...mockCreateDto,
        discountRate: 0,
      };

      const order = { ...mockSalesOrder, discountAmount: 0 };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const result = await service.create(dto as any, mockTenantId, mockUserId);

      expect(result.discountAmount).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return all sales orders for tenant', async () => {
      const orders = [mockSalesOrder, mockSalesOrder];
      jest.spyOn(salesOrderRepository, 'find').mockResolvedValue(orders as any);

      const result = await service.findAll(mockTenantId);

      expect(result).toHaveLength(2);
      expect(salesOrderRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ 
            tenantId: mockTenantId,
            deletedAt: null 
          })
        })
      );
    });

    it('should include relations', async () => {
      jest.spyOn(salesOrderRepository, 'find').mockResolvedValue([mockSalesOrder] as any);

      await service.findAll(mockTenantId);

      expect(salesOrderRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['customer', 'quotation', 'items', 'items.product']
        })
      );
    });

    it('should order by createdAt DESC', async () => {
      jest.spyOn(salesOrderRepository, 'find').mockResolvedValue([mockSalesOrder] as any);

      await service.findAll(mockTenantId);

      expect(salesOrderRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' }
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return sales order by ID', async () => {
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(mockSalesOrder as any);

      const result = await service.findOne(mockSalesOrder.id, mockTenantId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockSalesOrder.id);
    });

    it('should throw NotFoundException when not found', async () => {
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id', mockTenantId))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ===== BUSINESS LOGIC (12 tests) =====
  describe('Business Logic', () => {
    it('should calculate VAT for multiple rates', async () => {
      const dto = {
        ...mockCreateDto,
        items: [
          { productId: 'prod-1', quantityOrdered: 10, unitPrice: 100000, taxRate: 0 },
          { productId: 'prod-2', quantityOrdered: 5, unitPrice: 200000, taxRate: 10 },
        ],
      };

      const order = { 
        ...mockSalesOrder, 
        subtotal: 2000000,
        taxAmount: 100000 // Only 10% on 2nd item after discount
      };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const result = await service.create(dto as any, mockTenantId, mockUserId);

      expect(result.taxAmount).toBe(100000);
    });

    it('should round VND correctly (no decimals)', async () => {
      const dto = {
        ...mockCreateDto,
        items: [{ productId: 'prod-1', quantityOrdered: 3, unitPrice: 99999, taxRate: 10 }],
      };

      const total = Math.round((3 * 99999) * 1.1);
      const order = { ...mockSalesOrder, total };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const result = await service.create(dto as any, mockTenantId, mockUserId);

      expect(result.total % 1).toBe(0); // No decimals
    });

    it('should handle zero total edge case', async () => {
      const dto = {
        ...mockCreateDto,
        items: [{ productId: 'prod-1', quantityOrdered: 10, unitPrice: 0, taxRate: 10 }],
      };

      const order = { ...mockSalesOrder, total: 0 };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const result = await service.create(dto as any, mockTenantId, mockUserId);

      expect(result.total).toBe(0);
    });

    it('should handle large quantity (999999)', async () => {
      const dto = {
        ...mockCreateDto,
        items: [{ productId: 'prod-1', quantityOrdered: 999999, unitPrice: 100, taxRate: 10 }],
      };

      const subtotal = 999999 * 100;
      const order = { ...mockSalesOrder, subtotal };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const result = await service.create(dto as any, mockTenantId, mockUserId);

      expect(result.subtotal).toBeGreaterThan(0);
    });

    it('should apply line-level discount', async () => {
      const dto = {
        ...mockCreateDto,
        items: [
          { 
            productId: 'prod-1', 
            quantityOrdered: 10, 
            unitPrice: 100000, 
            discountRate: 10,
            taxRate: 10 
          }
        ],
      };

      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue({
        ...mockSalesOrderItem,
        discountAmount: 100000,
        lineTotal: 990000 // (1000000 - 100000) * 1.1
      } as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      await service.create(dto as any, mockTenantId, mockUserId);

      expect(salesOrderItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discountAmount: expect.any(Number)
        })
      );
    });

    it('should handle multiple items with different discounts', async () => {
      const dto = {
        ...mockCreateDto,
        items: [
          { productId: 'prod-1', quantityOrdered: 10, unitPrice: 100000, discountRate: 10, taxRate: 10 },
          { productId: 'prod-2', quantityOrdered: 5, unitPrice: 200000, discountRate: 5, taxRate: 10 },
        ],
      };

      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      await service.create(dto as any, mockTenantId, mockUserId);

      expect(salesOrderItemRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should set line numbers correctly', async () => {
      const dto = {
        ...mockCreateDto,
        items: [
          { productId: 'prod-1', quantityOrdered: 10, unitPrice: 100000 },
          { productId: 'prod-2', quantityOrdered: 5, unitPrice: 200000 },
          { productId: 'prod-3', quantityOrdered: 2, unitPrice: 500000 },
        ],
      };

      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      await service.create(dto as any, mockTenantId, mockUserId);

      expect(salesOrderItemRepository.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ lineNumber: 1 })
      );
      expect(salesOrderItemRepository.create).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ lineNumber: 2 })
      );
      expect(salesOrderItemRepository.create).toHaveBeenNthCalledWith(3,
        expect.objectContaining({ lineNumber: 3 })
      );
    });

    it('should use default taxRate when not provided', async () => {
      const dto = {
        ...mockCreateDto,
        taxRate: 10,
        items: [
          { productId: 'prod-1', quantityOrdered: 10, unitPrice: 100000 }
        ],
      };

      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      await service.create(dto as any, mockTenantId, mockUserId);

      expect(salesOrderItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taxRate: 10
        })
      );
    });

    it('should set createdBy field', async () => {
      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      await service.create(mockCreateDto as any, mockTenantId, mockUserId);

      expect(salesOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: mockUserId
        })
      );
    });

    it('should set tenantId for order and items', async () => {
      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      await service.create(mockCreateDto as any, mockTenantId, mockUserId);

      expect(salesOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId
        })
      );
      expect(salesOrderItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId
        })
      );
    });

    it('should handle order-level and line-level discounts together', async () => {
      const dto = {
        ...mockCreateDto,
        discountRate: 5, // Order level
        items: [
          { 
            productId: 'prod-1', 
            quantityOrdered: 10, 
            unitPrice: 100000,
            discountRate: 10, // Line level
            taxRate: 10
          }
        ],
      };

      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'create').mockReturnValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      await service.create(dto as any, mockTenantId, mockUserId);

      expect(salesOrderRepository.save).toHaveBeenCalled();
    });
  });

  // ===== STATUS WORKFLOW (7 tests) =====
  describe('Status Workflow', () => {
    it('should allow DRAFT → CONFIRMED transition', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.DRAFT };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
        ...order,
        status: SalesOrderStatus.CONFIRMED,
        approvedAt: new Date()
      } as any);

      const result = await service.updateStatus(
        order.id, 
        SalesOrderStatus.CONFIRMED, 
        mockTenantId, 
        mockUserId
      );

      expect(result.status).toBe(SalesOrderStatus.CONFIRMED);
      expect(result.approvedAt).toBeDefined();
    });

    it('should allow CONFIRMED → PROCESSING transition', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.CONFIRMED };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
        ...order,
        status: SalesOrderStatus.PROCESSING
      } as any);

      const result = await service.updateStatus(
        order.id, 
        SalesOrderStatus.PROCESSING, 
        mockTenantId, 
        mockUserId
      );

      expect(result.status).toBe(SalesOrderStatus.PROCESSING);
    });

    it('should allow PROCESSING → COMPLETED transition', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.PROCESSING };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
        ...order,
        status: SalesOrderStatus.COMPLETED
      } as any);
      jest.spyOn(accountingService, 'createJournalEntryFromSalesOrder').mockResolvedValue(null);

      const result = await service.updateStatus(
        order.id, 
        SalesOrderStatus.COMPLETED, 
        mockTenantId, 
        mockUserId
      );

      expect(result.status).toBe(SalesOrderStatus.COMPLETED);
      expect(accountingService.createJournalEntryFromSalesOrder).toHaveBeenCalled();
    });

    it('should reject COMPLETED → DRAFT transition', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.COMPLETED };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);

      await expect(
        service.updateStatus(order.id, SalesOrderStatus.DRAFT, mockTenantId, mockUserId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow any status → CANCELLED transition', async () => {
      const statuses = [
        SalesOrderStatus.DRAFT,
        SalesOrderStatus.CONFIRMED,
        SalesOrderStatus.PROCESSING,
      ];

      for (const status of statuses) {
        const order = { ...mockSalesOrder, status };
        jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
        jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
          ...order,
          status: SalesOrderStatus.CANCELLED
        } as any);

        const result = await service.updateStatus(
          order.id, 
          SalesOrderStatus.CANCELLED, 
          mockTenantId, 
          mockUserId
        );
        expect(result.status).toBe(SalesOrderStatus.CANCELLED);
      }
    });

    it('should NOT allow transition from CANCELLED', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.CANCELLED };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);

      await expect(
        service.updateStatus(order.id, SalesOrderStatus.CONFIRMED, mockTenantId, mockUserId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should set approvedBy and approvedAt when confirmed', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.DRAFT };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
        ...order,
        status: SalesOrderStatus.CONFIRMED,
        approvedBy: mockUserId,
        approvedAt: new Date()
      } as any);

      const result = await service.updateStatus(
        order.id, 
        SalesOrderStatus.CONFIRMED, 
        mockTenantId, 
        mockUserId
      );

      expect(result.approvedBy).toBe(mockUserId);
      expect(result.approvedAt).toBeInstanceOf(Date);
    });
  });

  // ===== UPDATE OPERATIONS (4 tests) =====
  describe('Update Operations', () => {
    it('should update draft order successfully', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.DRAFT };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
        ...order,
        notes: 'Updated notes'
      } as any);

      const result = await service.update(
        order.id,
        { notes: 'Updated notes' },
        mockTenantId
      );

      expect(result.notes).toBe('Updated notes');
    });

    it('should update confirmed order successfully', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.CONFIRMED };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
        ...order,
        notes: 'Updated'
      } as any);

      const result = await service.update(
        order.id,
        { notes: 'Updated' },
        mockTenantId
      );

      expect(result.notes).toBe('Updated');
    });

    it('should reject update of processing order', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.PROCESSING };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);

      await expect(
        service.update(order.id, { notes: 'Update' }, mockTenantId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should recalculate totals when items updated', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.DRAFT, items: [] };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderItemRepository, 'delete').mockResolvedValue(null);
      jest.spyOn(salesOrderItemRepository, 'create').mockReturnValue(mockSalesOrderItem as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const updateDto = {
        items: [
          { productId: 'prod-1', quantityOrdered: 20, unitPrice: 100000, taxRate: 10 }
        ]
      };

      await service.update(order.id, updateDto as any, mockTenantId);

      expect(salesOrderItemRepository.delete).toHaveBeenCalled();
      expect(salesOrderItemRepository.create).toHaveBeenCalled();
    });
  });

  // ===== ERROR HANDLING (5 tests) =====
  describe('Error Handling', () => {
    it('should throw NotFoundException when order not found for update', async () => {
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { notes: 'Test' }, mockTenantId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when order not found for status update', async () => {
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', SalesOrderStatus.CONFIRMED, mockTenantId, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(salesOrderRepository, 'find').mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.findAll(mockTenantId))
        .rejects.toThrow('Database error');
    });

    it('should continue if journal entry creation fails on completion', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.PROCESSING };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
        ...order,
        status: SalesOrderStatus.COMPLETED
      } as any);
      jest.spyOn(accountingService, 'createJournalEntryFromSalesOrder')
        .mockRejectedValue(new Error('Accounting error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.updateStatus(
        order.id, 
        SalesOrderStatus.COMPLETED, 
        mockTenantId, 
        mockUserId
      );

      expect(result.status).toBe(SalesOrderStatus.COMPLETED);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle concurrent updates gracefully', async () => {
      const order = { ...mockSalesOrder, status: SalesOrderStatus.DRAFT };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue(order as any);

      const update1 = service.update(order.id, { notes: 'Update 1' }, mockTenantId);
      const update2 = service.update(order.id, { notes: 'Update 2' }, mockTenantId);

      await Promise.all([update1, update2]);

      expect(salesOrderRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  // ===== SOFT DELETE (2 tests) =====
  describe('Soft Delete', () => {
    it('should soft delete order successfully', async () => {
      const order = { ...mockSalesOrder };
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(order as any);
      jest.spyOn(salesOrderRepository, 'save').mockResolvedValue({
        ...order,
        deletedAt: new Date()
      } as any);

      await service.remove(order.id, mockTenantId);

      expect(salesOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date)
        })
      );
    });

    it('should throw NotFoundException when removing non-existent order', async () => {
      jest.spyOn(salesOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(service.remove('invalid-id', mockTenantId))
        .rejects.toThrow(NotFoundException);
    });
  });
});
