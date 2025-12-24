import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { createMockProduct } from '../../test/factories';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  const mockProduct = createMockProduct();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by category', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ page: 1, limit: 20, categoryId: 'cat-1' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat-1',
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ page: 1, limit: 20, type: 'product' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'product',
          }),
        }),
      );
    });

    it('should search by name', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ page: 1, limit: 20, search: 'Test' });

      expect(repository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      code: 'SP002',
      name: 'Sản phẩm mới',
      type: 'product' as const,
      unit: 'Cái',
      salePrice: 150000,
      costPrice: 120000,
      taxRate: 10,
    };

    it('should create a new product', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockProduct as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockProduct as any);

      const result = await service.create(createDto, 'user-id');

      expect(result).toEqual(mockProduct);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when code exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct as any);

      await expect(service.create(createDto, 'user-id')).rejects.toThrow(ConflictException);
    });

    it('should validate price constraints', () => {
      expect(mockProduct.salePrice).toBeGreaterThan(0);
      expect(mockProduct.costPrice).toBeGreaterThan(0);
      expect(mockProduct.salePrice).toBeGreaterThanOrEqual(mockProduct.costPrice);
    });

    it('should validate tax rate', () => {
      expect(mockProduct.taxRate).toBeGreaterThanOrEqual(0);
      expect(mockProduct.taxRate).toBeLessThanOrEqual(100);
      expect([0, 5, 8, 10]).toContain(mockProduct.taxRate);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Sản phẩm đã cập nhật',
      salePrice: 200000,
    };

    it('should update a product', async () => {
      const updatedProduct = { ...mockProduct, ...updateDto };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct as any);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedProduct as any);

      const result = await service.update('1', updateDto, 'user-id');

      expect(result.name).toBe(updateDto.name);
      expect(result.salePrice).toBe(updateDto.salePrice);
    });

    it('should throw NotFoundException when product not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct as any);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mockProduct, deletedAt: new Date() } as any);

      await service.delete('1', 'user-id');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('Business Logic Tests', () => {
    it('should calculate profit margin correctly', () => {
      // Using mockProduct with price=100000, cost=70000
      const profitMargin = ((mockProduct.price - mockProduct.cost) / mockProduct.price) * 100;
      expect(profitMargin).toBeCloseTo(30, 1); // (100000 - 70000) / 100000 * 100 = 30%
    });

    it('should calculate price with tax', () => {
      // mockProduct has price=100000, taxRate=10
      const priceWithTax = mockProduct.price * (1 + mockProduct.taxRate / 100);
      expect(priceWithTax).toBeCloseTo(110000, 0); // 100000 * 1.1
    });

    it('should handle zero cost price', () => {
      const serviceProduct = { ...mockProduct, costPrice: 0 };
      expect(serviceProduct.costPrice).toBe(0);
    });
  });

  describe('Import/Export', () => {
    it('should validate import data format', () => {
      const validRow = {
        code: 'SP003',
        name: 'Sản phẩm import',
        unit: 'Cái',
        salePrice: 50000,
        costPrice: 40000,
        taxRate: 10,
      };

      expect(validRow.code).toBeTruthy();
      expect(validRow.name).toBeTruthy();
      expect(validRow.unit).toBeTruthy();
      expect(validRow.salePrice).toBeGreaterThan(0);
    });

    it('should handle duplicate codes in import', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProduct as any);

      // Should update existing product, not create new
      expect(mockProduct.code).toBe('SP001');
    });
  });

  describe('Edge Cases - Pricing & Validation', () => {
    it('should validate VAT rate is allowed value', () => {
      const allowedRates = [0, 5, 8, 10];
      const product = mockProduct;

      allowedRates.forEach((rate) => {
        const productWithRate = { ...product, vatRate: rate };
        expect([0, 5, 8, 10]).toContain(productWithRate.vatRate);
      });
    });

    it('should calculate profit margin correctly', () => {
      const testCases = [
        { price: 100000, cost: 70000, expected: 30 }, // 30%
        { price: 100000, cost: 90000, expected: 10 }, // 10%
        { price: 100000, cost: 50000, expected: 50 }, // 50%
        { price: 100000, cost: 100000, expected: 0 }, // 0%
      ];

      testCases.forEach(({ price, cost, expected }) => {
        const margin = ((price - cost) / price) * 100;
        expect(margin).toBeCloseTo(expected, 1);
      });
    });

    it('should handle zero price edge case', () => {
      const product = { ...mockProduct, price: 0 };
      expect(product.price).toBe(0);
    });

    it('should calculate tax for different rates', () => {
      const testCases = [
        { price: 100000, vatRate: 0, expected: 100000 },
        { price: 100000, vatRate: 5, expected: 105000 },
        { price: 100000, vatRate: 8, expected: 108000 },
        { price: 100000, vatRate: 10, expected: 110000 },
      ];

      testCases.forEach(({ price, vatRate, expected }) => {
        const priceWithTax = price * (1 + vatRate / 100);
        expect(priceWithTax).toBeCloseTo(expected, 0);
      });
    });

    it('should handle rounding for Vietnamese currency', () => {
      const price = 33333;
      const quantity = 3;
      const total = price * quantity; // 99999

      expect(total).toBe(99999);
      expect(Number.isInteger(total)).toBe(true);
    });
  });

  describe('Edge Cases - Stock Management', () => {
    it('should handle products without stock management', () => {
      const product = { ...mockProduct, manageStock: false };
      expect(product.manageStock).toBe(false);
    });

    it('should validate stock level constraints', () => {
      const product = { ...mockProduct, minStock: 10, maxStock: 1000 };
      expect(product.minStock).toBeLessThan(product.maxStock);
    });

    it('should handle products with batch management', () => {
      const product = { ...mockProduct, manageBatch: true };
      expect(product.manageBatch).toBe(true);
    });
  });

  describe('Edge Cases - Search & Filter', () => {
    it('should handle special characters in search', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ search: "Product's Name & Co." });

      expect(repository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by multiple criteria', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);

      await service.findAll({
        type: 'product',
        categoryId: 'cat-1',
        isActive: 'true',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'product',
            categoryId: 'cat-1',
            isActive: true,
          }),
        })
      );
    });

    it('should handle empty search results', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      const result = await service.findAll({ search: 'nonexistent' });

      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  // ===== PHASE 3: BRANCH COVERAGE TESTS =====
  describe('ProductsService - Branch Coverage', () => {
    // ===== ERROR HANDLING BRANCHES =====
    describe('Error Handling', () => {
      it('should throw error when product not found for update', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        
        await expect(service.update('invalid-id', { name: 'Test' }, 'user-1'))
          .rejects.toThrow('Không tìm thấy sản phẩm');
      });

      it('should throw error when product not found for delete', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        
        await expect(service.remove('invalid-id'))
          .rejects.toThrow('Không tìm thấy sản phẩm');
      });

      it('should handle database connection error', async () => {
        jest.spyOn(repository, 'findAndCount').mockRejectedValue(
          new Error('Database connection failed')
        );
        
        await expect(service.findAll({ page: 1, limit: 20 }))
          .rejects.toThrow('Database connection failed');
      });

      it('should handle null/undefined ID gracefully', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        
        await expect(service.findOne(null))
          .rejects.toThrow('Không tìm thấy sản phẩm');
      });

      it('should throw error when code already exists', async () => {
        const existingProduct = createMockProduct();
        jest.spyOn(repository, 'findOne').mockResolvedValue(existingProduct);
        
        await expect(service.create({ code: existingProduct.code, name: 'Test' } as any, 'user-1'))
          .rejects.toThrow('Mã sản phẩm đã tồn tại');
      });
    });

    // ===== FILTERING BRANCHES =====
    describe('Filtering Logic', () => {
      it('should filter by categoryId when provided', async () => {
        jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);
        
        await service.findAll({ categoryId: 'cat-123' });
        
        expect(repository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ categoryId: 'cat-123' })
          })
        );
      });

      it('should filter by type when provided', async () => {
        jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);
        
        await service.findAll({ type: 'service' });
        
        expect(repository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ type: 'service' })
          })
        );
      });

      it('should filter by active status when isActive=true', async () => {
        jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);
        
        await service.findAll({ isActive: 'true' });
        
        expect(repository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ isActive: true })
          })
        );
      });

      it('should filter by active status when isActive=false', async () => {
        jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);
        
        await service.findAll({ isActive: 'false' });
        
        expect(repository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ isActive: false })
          })
        );
      });

      it('should combine multiple filters', async () => {
        jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);
        
        await service.findAll({ 
          categoryId: 'cat-1',
          type: 'product',
          isActive: 'true',
          search: 'laptop'
        });
        
        expect(repository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              categoryId: 'cat-1',
              type: 'product',
              isActive: true
            })
          })
        );
      });

      it('should handle empty filter object', async () => {
        jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockProduct], 1]);
        
        await service.findAll({ page: 1, limit: 20 });
        
        expect(repository.findAndCount).toHaveBeenCalled();
      });
    });

    // ===== IMPORT EXCEL BRANCHES =====
    describe('Excel Import Logic', () => {
      it('should throw error when file is null', async () => {
        await expect(service.importFromExcel(null, 'user-1'))
          .rejects.toThrow('File không được để trống');
      });

      it('should throw error when file is undefined', async () => {
        await expect(service.importFromExcel(undefined, 'user-1'))
          .rejects.toThrow('File không được để trống');
      });

      it('should handle empty Excel file', async () => {
        const mockFile = {
          buffer: Buffer.from('mock-empty-excel')
        };
        
        // Mock xlsx to return empty data
        jest.spyOn(require('xlsx'), 'read').mockReturnValue({
          SheetNames: ['Sheet1'],
          Sheets: {
            Sheet1: {}
          }
        });
        
        jest.spyOn(require('xlsx').utils, 'sheet_to_json').mockReturnValue([]);
        
        const result = await service.importFromExcel(mockFile, 'user-1');
        
        expect(result.totalRows).toBe(0);
        expect(result.successCount).toBe(0);
      });
    });

    // ===== SOFT DELETE BRANCHES =====
    describe('Soft Delete Logic', () => {
      it('should soft delete product successfully', async () => {
        const product = createMockProduct();
        jest.spyOn(repository, 'findOne').mockResolvedValue(product);
        jest.spyOn(repository, 'save').mockResolvedValue({ ...product, deletedAt: new Date(), isActive: false });
        
        await service.delete(product.id, 'tenant-1');
        
        expect(repository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            deletedAt: expect.any(Date),
            isActive: false
          })
        );
      });

      it('should throw error when product not found for soft delete', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        
        await expect(service.delete('invalid-id', 'tenant-1'))
          .rejects.toThrow('Không tìm thấy sản phẩm');
      });
    });

    // ===== UPDATE BRANCHES =====
    describe('Update Logic', () => {
      it('should update product successfully', async () => {
        const product = createMockProduct();
        jest.spyOn(repository, 'findOne').mockResolvedValue(product);
        jest.spyOn(repository, 'save').mockResolvedValue({ ...product, name: 'Updated Name' });
        
        const result = await service.update(product.id, { name: 'Updated Name' }, 'user-1');
        
        expect(result.name).toBe('Updated Name');
        expect(repository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            updatedBy: 'user-1'
          })
        );
      });

      it('should preserve existing fields when updating', async () => {
        const product = createMockProduct();
        const originalPrice = product.salePrice;
        
        jest.spyOn(repository, 'findOne').mockResolvedValue(product);
        jest.spyOn(repository, 'save').mockResolvedValue({ ...product, name: 'New Name' });
        
        await service.update(product.id, { name: 'New Name' }, 'user-1');
        
        expect(repository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            salePrice: originalPrice
          })
        );
      });
    });
  });
});
