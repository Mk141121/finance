import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { ProductBatch } from './entities/product-batch.entity';
import { StockTransaction, StockTransactionType } from './entities/stock-transaction.entity';
import { StockTransactionItem } from './entities/stock-transaction-item.entity';
import { StockBalance } from './entities/stock-balance.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

describe('InventoryService', () => {
  let service: InventoryService;
  let warehouseRepository: Repository<Warehouse>;
  let batchRepository: Repository<ProductBatch>;
  let transactionRepository: Repository<StockTransaction>;
  let transactionItemRepository: Repository<StockTransactionItem>;
  let balanceRepository: Repository<StockBalance>;
  let dataSource: DataSource;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockWarehouseId = 'warehouse-123';
  const mockProductId = 'product-123';

  const mockWarehouse = {
    id: mockWarehouseId,
    tenantId: mockTenantId,
    code: 'WH001',
    name: 'Main Warehouse',
    address: '123 Street',
    isActive: true,
    deletedAt: null,
  };

  const mockStockBalance = {
    id: 'balance-1',
    tenantId: mockTenantId,
    productId: mockProductId,
    warehouseId: mockWarehouseId,
    quantity: 100,
    reservedQuantity: 0,
    availableQuantity: 100,
    averageCost: 100000,
    totalValue: 10000000,
  };

  const mockTransaction = {
    id: 'trans-1',
    tenantId: mockTenantId,
    code: 'ST-001',
    type: StockTransactionType.IN,
    warehouseId: mockWarehouseId,
    date: new Date(),
    status: 'draft',
    notes: 'Test transaction',
    items: [],
  };

  const mockBatch = {
    id: 'batch-1',
    tenantId: mockTenantId,
    batchNumber: 'BATCH-001',
    productId: mockProductId,
    warehouseId: mockWarehouseId,
    quantity: 100,
    unitCost: 100000,
    totalCost: 10000000,
    status: 'available',
    createdAt: new Date(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Warehouse),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductBatch),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockTransaction),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockTransactionItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockBalance),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    warehouseRepository = module.get<Repository<Warehouse>>(
      getRepositoryToken(Warehouse),
    );
    batchRepository = module.get<Repository<ProductBatch>>(
      getRepositoryToken(ProductBatch),
    );
    transactionRepository = module.get<Repository<StockTransaction>>(
      getRepositoryToken(StockTransaction),
    );
    transactionItemRepository = module.get<Repository<StockTransactionItem>>(
      getRepositoryToken(StockTransactionItem),
    );
    balanceRepository = module.get<Repository<StockBalance>>(
      getRepositoryToken(StockBalance),
    );
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== WAREHOUSES (4 tests) ====================
  describe('Warehouses', () => {
    it('should find all warehouses for tenant', async () => {
      jest.spyOn(warehouseRepository, 'find').mockResolvedValue([mockWarehouse] as any);

      const result = await service.findAllWarehouses(mockTenantId);

      expect(result).toHaveLength(1);
      expect(warehouseRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, deletedAt: null },
        order: { code: 'ASC' },
      });
    });

    it('should find warehouse by id', async () => {
      jest.spyOn(warehouseRepository, 'findOne').mockResolvedValue(mockWarehouse as any);

      const result = await service.findWarehouse(mockWarehouseId, mockTenantId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockWarehouseId);
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      jest.spyOn(warehouseRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.findWarehouse('invalid-id', mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should order warehouses by code', async () => {
      const warehouses = [
        { ...mockWarehouse, code: 'WH002' },
        { ...mockWarehouse, code: 'WH001' },
      ];
      jest.spyOn(warehouseRepository, 'find').mockResolvedValue(warehouses as any);

      await service.findAllWarehouses(mockTenantId);

      expect(warehouseRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { code: 'ASC' },
        }),
      );
    });
  });

  // ==================== STOCK TRANSACTIONS (12 tests) ====================
  describe('Stock Transactions', () => {
    describe('Create Transaction', () => {
      it('should create IN transaction successfully', async () => {
        const createDto = {
          type: StockTransactionType.IN,
          warehouseId: mockWarehouseId,
          date: new Date(),
          items: [
            {
              productId: mockProductId,
              quantity: 100,
              unitCost: 100000,
            },
          ],
        };

        const savedTransaction = { ...mockTransaction, ...createDto };
        jest.spyOn(transactionRepository, 'create').mockReturnValue(savedTransaction as any);
        jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
        mockQueryRunner.manager.save.mockResolvedValue(savedTransaction);

        const result = await service.createStockTransaction(
          createDto as any,
          mockTenantId,
          mockUserId,
        );

        expect(result).toBeDefined();
        expect(mockQueryRunner.connect).toHaveBeenCalled();
        expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should create OUT transaction successfully', async () => {
        const createDto = {
          type: StockTransactionType.OUT,
          warehouseId: mockWarehouseId,
          date: new Date(),
          items: [
            {
              productId: mockProductId,
              quantity: 10,
              unitCost: 100000,
            },
          ],
        };

        const savedTransaction = { ...mockTransaction, type: StockTransactionType.OUT };
        jest.spyOn(transactionRepository, 'create').mockReturnValue(savedTransaction as any);
        jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
        mockQueryRunner.manager.save.mockResolvedValue(savedTransaction);

        const result = await service.createStockTransaction(
          createDto as any,
          mockTenantId,
          mockUserId,
        );

        expect(result).toBeDefined();
        expect(result.type).toBe(StockTransactionType.OUT);
      });

      it('should set transaction status to draft', async () => {
        const createDto = {
          type: StockTransactionType.IN,
          warehouseId: mockWarehouseId,
          items: [{ productId: mockProductId, quantity: 100, unitCost: 100000 }],
        };

        jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
        jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
        mockQueryRunner.manager.save.mockResolvedValue(mockTransaction);

        await service.createStockTransaction(createDto as any, mockTenantId, mockUserId);

        expect(transactionRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'draft',
            createdBy: mockUserId,
            tenantId: mockTenantId,
          }),
        );
      });

      it('should calculate total cost for items', async () => {
        const createDto = {
          type: StockTransactionType.IN,
          warehouseId: mockWarehouseId,
          items: [
            {
              productId: mockProductId,
              quantity: 100,
              unitCost: 100000,
            },
          ],
        };

        jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
        jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
        mockQueryRunner.manager.save.mockResolvedValue(mockTransaction);

        await service.createStockTransaction(createDto as any, mockTenantId, mockUserId);

        expect(transactionItemRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: 100,
            unitCost: 100000,
            totalCost: 10000000, // 100 * 100000
          }),
        );
      });

      it('should rollback transaction on error', async () => {
        const createDto = {
          type: StockTransactionType.IN,
          warehouseId: mockWarehouseId,
          items: [{ productId: mockProductId, quantity: 100, unitCost: 100000 }],
        };

        jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
        mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));

        await expect(
          service.createStockTransaction(createDto as any, mockTenantId, mockUserId),
        ).rejects.toThrow('Database error');

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should handle multiple items in transaction', async () => {
        const createDto = {
          type: StockTransactionType.IN,
          warehouseId: mockWarehouseId,
          items: [
            { productId: 'prod-1', quantity: 100, unitCost: 100000 },
            { productId: 'prod-2', quantity: 50, unitCost: 200000 },
            { productId: 'prod-3', quantity: 20, unitCost: 500000 },
          ],
        };

        jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
        jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
        mockQueryRunner.manager.save.mockResolvedValue(mockTransaction);

        await service.createStockTransaction(createDto as any, mockTenantId, mockUserId);

        expect(transactionItemRepository.create).toHaveBeenCalledTimes(3);
      });
    });

    describe('Confirm Transaction', () => {
      it('should confirm draft transaction', async () => {
        const transaction = {
          ...mockTransaction,
          status: 'draft',
          items: [
            { productId: mockProductId, quantity: 100, unitCost: 100000 },
          ],
        };

        jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(transaction as any);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockStockBalance);
        mockQueryRunner.manager.save.mockResolvedValue(transaction);

        const result = await service.confirmStockTransaction(
          transaction.id,
          mockTenantId,
          mockUserId,
        );

        expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      });

      it('should throw error when transaction not found', async () => {
        jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

        await expect(
          service.confirmStockTransaction('invalid-id', mockTenantId, mockUserId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should reject confirming non-draft transaction', async () => {
        const transaction = { ...mockTransaction, status: 'confirmed' };
        jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(transaction as any);

        await expect(
          service.confirmStockTransaction(transaction.id, mockTenantId, mockUserId),
        ).rejects.toThrow(BadRequestException);
      });

      it('should set confirmedBy and confirmedAt', async () => {
        const transaction = {
          ...mockTransaction,
          status: 'draft',
          items: [{ productId: mockProductId, quantity: 100, unitCost: 100000 }],
        };

        jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(transaction as any);
        mockQueryRunner.manager.findOne.mockResolvedValue(mockStockBalance);
        mockQueryRunner.manager.save.mockResolvedValue({
          ...transaction,
          status: 'confirmed',
          confirmedBy: mockUserId,
          confirmedAt: expect.any(Date),
        });

        const result = await service.confirmStockTransaction(
          transaction.id,
          mockTenantId,
          mockUserId,
        );

        expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'confirmed',
            confirmedBy: mockUserId,
          }),
        );
      });
    });

    describe('Find Transactions', () => {
      it('should find all transactions for tenant', async () => {
        jest.spyOn(transactionRepository, 'find').mockResolvedValue([mockTransaction] as any);

        const result = await service.findAllTransactions(mockTenantId);

        expect(result).toHaveLength(1);
        expect(transactionRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { tenantId: mockTenantId },
            order: { createdAt: 'DESC' },
          }),
        );
      });

      it('should find transaction by id with relations', async () => {
        jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction as any);

        const result = await service.findOneTransaction(mockTransaction.id, mockTenantId);

        expect(result).toBeDefined();
        expect(transactionRepository.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            relations: ['warehouse', 'items', 'items.product', 'items.batch'],
          }),
        );
      });
    });
  });

  // ==================== STOCK BALANCES (6 tests) ====================
  describe('Stock Balances', () => {
    it('should get stock balance', async () => {
      jest.spyOn(balanceRepository, 'findOne').mockResolvedValue(mockStockBalance as any);

      const result = await service.getStockBalance(
        mockTenantId,
        mockProductId,
        mockWarehouseId,
      );

      expect(result).toBeDefined();
      expect(result.productId).toBe(mockProductId);
      expect(result.warehouseId).toBe(mockWarehouseId);
    });

    it('should create new balance if not exists', async () => {
      jest.spyOn(balanceRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(balanceRepository, 'create').mockReturnValue(mockStockBalance as any);
      jest.spyOn(balanceRepository, 'save').mockResolvedValue(mockStockBalance as any);

      const result = await service.getStockBalance(
        mockTenantId,
        mockProductId,
        mockWarehouseId,
      );

      expect(balanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          productId: mockProductId,
          warehouseId: mockWarehouseId,
          quantity: 0,
          availableQuantity: 0,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should get all stock balances for tenant', async () => {
      jest.spyOn(balanceRepository, 'find').mockResolvedValue([mockStockBalance] as any);

      const result = await service.getAllStockBalances(mockTenantId);

      expect(result).toHaveLength(1);
      expect(balanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId },
        }),
      );
    });

    it('should filter balances by warehouse', async () => {
      jest.spyOn(balanceRepository, 'find').mockResolvedValue([mockStockBalance] as any);

      await service.getAllStockBalances(mockTenantId, mockWarehouseId);

      expect(balanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: mockTenantId, warehouseId: mockWarehouseId },
        }),
      );
    });

    it('should include product and warehouse relations', async () => {
      jest.spyOn(balanceRepository, 'find').mockResolvedValue([mockStockBalance] as any);

      await service.getAllStockBalances(mockTenantId);

      expect(balanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['product', 'warehouse'],
        }),
      );
    });

    it('should order balances by warehouse and product', async () => {
      jest.spyOn(balanceRepository, 'find').mockResolvedValue([mockStockBalance] as any);

      await service.getAllStockBalances(mockTenantId);

      expect(balanceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { warehouseId: 'ASC', productId: 'ASC' },
        }),
      );
    });
  });

  // ==================== ERROR HANDLING (4 tests) ====================
  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      jest.spyOn(warehouseRepository, 'find').mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.findAllWarehouses(mockTenantId)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle null/undefined inputs gracefully', async () => {
      jest.spyOn(warehouseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findWarehouse(null, mockTenantId)).rejects.toThrow();
    });

    it('should handle transaction rollback on error', async () => {
      const createDto = {
        type: StockTransactionType.IN,
        warehouseId: mockWarehouseId,
        items: [{ productId: mockProductId, quantity: 100, unitCost: 100000 }],
      };

      jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        service.createStockTransaction(createDto as any, mockTenantId, mockUserId),
      ).rejects.toThrow();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should handle empty results gracefully', async () => {
      jest.spyOn(balanceRepository, 'find').mockResolvedValue([]);

      const result = await service.getAllStockBalances(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  // ==================== EDGE CASES (4 tests) ====================
  describe('Edge Cases', () => {
    it('should handle zero quantity transactions', async () => {
      const createDto = {
        type: StockTransactionType.IN,
        warehouseId: mockWarehouseId,
        items: [
          {
            productId: mockProductId,
            quantity: 0,
            unitCost: 100000,
          },
        ],
      };

      jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
      jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
      mockQueryRunner.manager.save.mockResolvedValue(mockTransaction);

      await service.createStockTransaction(createDto as any, mockTenantId, mockUserId);

      expect(transactionItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 0,
          totalCost: 0,
        }),
      );
    });

    it('should handle large quantities (999999)', async () => {
      const createDto = {
        type: StockTransactionType.IN,
        warehouseId: mockWarehouseId,
        items: [
          {
            productId: mockProductId,
            quantity: 999999,
            unitCost: 1000,
          },
        ],
      };

      jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
      jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
      mockQueryRunner.manager.save.mockResolvedValue(mockTransaction);

      await service.createStockTransaction(createDto as any, mockTenantId, mockUserId);

      expect(transactionItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 999999,
          totalCost: 999999000,
        }),
      );
    });

    it('should handle missing unitCost (default to 0)', async () => {
      const createDto = {
        type: StockTransactionType.OUT,
        warehouseId: mockWarehouseId,
        items: [
          {
            productId: mockProductId,
            quantity: 10,
          },
        ],
      };

      jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
      jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
      mockQueryRunner.manager.save.mockResolvedValue(mockTransaction);

      await service.createStockTransaction(createDto as any, mockTenantId, mockUserId);

      expect(transactionItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unitCost: 0,
          totalCost: 0,
        }),
      );
    });

    it('should handle concurrent transaction creation', async () => {
      const createDto = {
        type: StockTransactionType.IN,
        warehouseId: mockWarehouseId,
        items: [{ productId: mockProductId, quantity: 100, unitCost: 100000 }],
      };

      jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
      jest.spyOn(transactionItemRepository, 'create').mockReturnValue({} as any);
      mockQueryRunner.manager.save.mockResolvedValue(mockTransaction);

      const promise1 = service.createStockTransaction(
        createDto as any,
        mockTenantId,
        mockUserId,
      );
      const promise2 = service.createStockTransaction(
        createDto as any,
        mockTenantId,
        mockUserId,
      );

      await Promise.all([promise1, promise2]);

      expect(mockQueryRunner.connect).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(2);
    });
  });
});
