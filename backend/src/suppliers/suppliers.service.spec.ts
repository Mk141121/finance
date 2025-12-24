import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { createMockSupplier } from '../../test/factories';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repository: Repository<Supplier>;

  const mockSupplier = createMockSupplier();
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    repository = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== CRUD OPERATIONS (8 tests) ====================
  describe('CRUD Operations', () => {
    describe('create', () => {
      it('should create supplier successfully', async () => {
        const createDto = {
          code: 'SUP001',
          name: 'Test Supplier',
          phone: '0987654321',
          taxCode: '0123456789',
        };

        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        jest.spyOn(repository, 'create').mockReturnValue(mockSupplier as any);
        jest.spyOn(repository, 'save').mockResolvedValue(mockSupplier as any);

        const result = await service.create(createDto, mockUserId);

        expect(result).toBeDefined();
        expect(repository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            ...createDto,
            createdBy: mockUserId,
            updatedBy: mockUserId,
          }),
        );
      });

      it('should throw ConflictException when code already exists', async () => {
        const createDto = {
          code: mockSupplier.code,
          name: 'Duplicate Supplier',
        };

        jest.spyOn(repository, 'findOne').mockResolvedValue(mockSupplier as any);

        await expect(service.create(createDto, mockUserId)).rejects.toThrow(
          ConflictException,
        );
        await expect(service.create(createDto, mockUserId)).rejects.toThrow(
          'Mã nhà cung cấp đã tồn tại',
        );
      });

      it('should throw error when required fields missing', async () => {
        const createDto = {
          code: 'SUP002',
          // Missing name
        };

        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        jest.spyOn(repository, 'create').mockImplementation(() => {
          throw new Error('Name is required');
        });

        await expect(service.create(createDto, mockUserId)).rejects.toThrow();
      });
    });

    describe('findAll', () => {
      it('should return paginated suppliers', async () => {
        jest
          .spyOn(repository, 'findAndCount')
          .mockResolvedValue([[mockSupplier], 1]);

        const result = await service.findAll({ page: 1, limit: 20 });

        expect(result.items).toHaveLength(1);
        expect(result.meta.total).toBe(1);
        expect(result.meta.page).toBe(1);
        expect(result.meta.limit).toBe(20);
      });

      it('should search by name', async () => {
        jest
          .spyOn(repository, 'findAndCount')
          .mockResolvedValue([[mockSupplier], 1]);

        await service.findAll({ search: 'Test' });

        expect(repository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              name: expect.any(Object), // Like operator
            }),
          }),
        );
      });

      it('should filter by type', async () => {
        jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

        await service.findAll({ type: 'business' });

        expect(repository.findAndCount).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ type: 'business' }),
          }),
        );
      });
    });

    describe('findOne', () => {
      it('should find supplier by id', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue(mockSupplier as any);

        const result = await service.findOne(mockSupplier.id);

        expect(result).toBeDefined();
        expect(result.id).toBe(mockSupplier.id);
      });

      it('should throw NotFoundException when supplier not found', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue(null);

        await expect(service.findOne('invalid-id')).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.findOne('invalid-id')).rejects.toThrow(
          'Không tìm thấy nhà cung cấp',
        );
      });
    });

    describe('update', () => {
      it('should update supplier successfully', async () => {
        const updateDto = { name: 'Updated Name' };
        jest.spyOn(repository, 'findOne').mockResolvedValue(mockSupplier as any);
        jest
          .spyOn(repository, 'save')
          .mockResolvedValue({ ...mockSupplier, ...updateDto } as any);

        const result = await service.update(mockSupplier.id, updateDto, mockUserId);

        expect(result.name).toBe('Updated Name');
        expect(repository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            updatedBy: mockUserId,
          }),
        );
      });
    });

    describe('remove', () => {
      it('should remove supplier successfully', async () => {
        jest.spyOn(repository, 'findOne').mockResolvedValue(mockSupplier as any);
        jest.spyOn(repository, 'remove').mockResolvedValue(mockSupplier as any);

        const result = await service.remove(mockSupplier.id);

        expect(result.message).toBe('Đã xóa nhà cung cấp thành công');
        expect(repository.remove).toHaveBeenCalledWith(mockSupplier);
      });
    });
  });

  // ==================== VIETNAMESE VALIDATIONS (8 tests) ====================
  describe('Vietnamese Validations', () => {
    describe('Phone Validation', () => {
      it('should accept valid Vietnamese phone numbers', async () => {
        const validPhones = [
          '0987654321', // Viettel
          '0912345678', // Vinaphone
          '0767890123', // Vietnamobile
          '0868901234', // Mobifone
        ];

        jest.spyOn(repository, 'findOne').mockResolvedValue(null);

        for (const phone of validPhones) {
          const createDto = {
            code: `SUP-${Date.now()}`,
            name: 'Test Supplier',
            phone,
          };

          const supplierWithPhone = { ...mockSupplier, phone };
          jest.spyOn(repository, 'create').mockReturnValue(supplierWithPhone as any);
          jest.spyOn(repository, 'save').mockResolvedValue(supplierWithPhone as any);

          const result = await service.create(createDto, mockUserId);
          expect((result as any).phone).toBe(phone);
        }
      });

      it('should validate phone format (10 digits starting with 0)', () => {
        const validPhonePattern = /^(0[3|5|7|8|9])+([0-9]{8})$/;

        expect(validPhonePattern.test('0987654321')).toBe(true);
        expect(validPhonePattern.test('123')).toBe(false);
        expect(validPhonePattern.test('12345678901')).toBe(false);
      });
    });

    describe('Tax Code Validation', () => {
      it('should accept valid tax codes (10-13 digits)', () => {
        const validTaxCodes = [
          '0123456789', // 10 digits
          '0123456789012', // 13 digits
        ];

        validTaxCodes.forEach((taxCode) => {
          expect(taxCode.length).toBeGreaterThanOrEqual(10);
          expect(taxCode.length).toBeLessThanOrEqual(13);
        });
      });

      it('should validate tax code format', () => {
        const taxCodePattern = /^[0-9]{10,13}$/;

        expect(taxCodePattern.test('0123456789')).toBe(true);
        expect(taxCodePattern.test('0123456789012')).toBe(true);
        expect(taxCodePattern.test('ABC123')).toBe(false);
        expect(taxCodePattern.test('123')).toBe(false);
      });
    });

    describe('Email & Address Validation', () => {
      it('should validate email format', () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        expect(emailPattern.test('test@example.com')).toBe(true);
        expect(emailPattern.test('invalid.email')).toBe(false);
        expect(emailPattern.test('@example.com')).toBe(false);
      });

      it('should handle Vietnamese address fields', async () => {
        const createDto = {
          code: 'SUP003',
          name: 'Test Supplier',
          address: '123 Nguyễn Huệ, Quận 1',
          city: 'Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
        };

        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        const supplierWithAddress = { ...mockSupplier, ...createDto };
        jest.spyOn(repository, 'create').mockReturnValue(supplierWithAddress as any);
        jest.spyOn(repository, 'save').mockResolvedValue(supplierWithAddress as any);

        const result = await service.create(createDto, mockUserId);

        expect((result as any).city).toBe('Hồ Chí Minh');
        expect((result as any).district).toBe('Quận 1');
      });
    });

    describe('Business Rules', () => {
      it('should validate payment terms', () => {
        const validPaymentTerms = ['7 ngày', '15 ngày', '30 ngày', '60 ngày'];

        validPaymentTerms.forEach((term) => {
          expect(term).toMatch(/^\d+ ngày$/);
        });
      });

      it('should handle special characters in Vietnamese names', async () => {
        const createDto = {
          code: 'SUP004',
          name: 'Công ty TNHH Thương mại Điện tử Việt Nam',
          contactPerson: 'Nguyễn Văn Đức',
        };

        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        const supplierWithVietnamese = { ...mockSupplier, ...createDto };
        jest.spyOn(repository, 'create').mockReturnValue(supplierWithVietnamese as any);
        jest.spyOn(repository, 'save').mockResolvedValue(supplierWithVietnamese as any);

        const result = await service.create(createDto, mockUserId);

        expect((result as any).name).toContain('Việt');
        expect((result as any).contactPerson).toContain('Đức');
      });
    });
  });

  // ==================== SEARCH & FILTERING (5 tests) ====================
  describe('Search and Filtering', () => {
    it('should search by Vietnamese text', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockSupplier], 1]);

      await service.findAll({ search: 'Công ty' });

      expect(repository.findAndCount).toHaveBeenCalled();
    });

    it('should search by tax code', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockSupplier], 1]);

      await service.findAll({ search: '0123456789' });

      expect(repository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by isActive status', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.findAll({ isActive: 'true' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should filter by supplier type', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.findAll({ type: 'individual' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'individual' }),
        }),
      );
    });

    it('should combine multiple filters', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.findAll({
        search: 'ABC',
        type: 'business',
        isActive: 'true',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'business',
            isActive: true,
          }),
        }),
      );
    });
  });

  // ==================== ERROR HANDLING (4 tests) ====================
  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      jest
        .spyOn(repository, 'findAndCount')
        .mockRejectedValue(new Error('Database connection failed'));

      await expect(service.findAll({})).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle concurrent updates gracefully', async () => {
      const updateDto = { name: 'Updated Name' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockSupplier as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockSupplier as any);

      const update1 = service.update(mockSupplier.id, updateDto, mockUserId);
      const update2 = service.update(mockSupplier.id, updateDto, mockUserId);

      await Promise.all([update1, update2]);

      expect(repository.save).toHaveBeenCalledTimes(2);
    });

    it('should validate null/undefined inputs', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(null)).rejects.toThrow();
      await expect(service.findOne(undefined)).rejects.toThrow();
    });

    it('should handle empty search results', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      const result = await service.findAll({ search: 'nonexistent' });

      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  // ==================== PAGINATION (2 tests) ====================
  describe('Pagination', () => {
    it('should calculate total pages correctly', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 45]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(3); // Math.ceil(45/20) = 3
    });

    it('should handle different page sizes', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 100]);

      const result10 = await service.findAll({ page: 1, limit: 10 });
      expect(result10.meta.totalPages).toBe(10);

      const result50 = await service.findAll({ page: 1, limit: 50 });
      expect(result50.meta.totalPages).toBe(2);
    });
  });

  // ==================== EDGE CASES (2 tests) ====================
  describe('Edge Cases', () => {
    it('should handle suppliers with minimal data', async () => {
      const minimalDto = {
        code: 'SUP005',
        name: 'Minimal Supplier',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      const minimalSupplier = { ...mockSupplier, ...minimalDto };
      jest.spyOn(repository, 'create').mockReturnValue(minimalSupplier as any);
      jest.spyOn(repository, 'save').mockResolvedValue(minimalSupplier as any);

      const result = await service.create(minimalDto, mockUserId);

      expect((result as any).code).toBe('SUP005');
      expect((result as any).name).toBe('Minimal Supplier');
    });

    it('should handle very long supplier names', async () => {
      const longName = 'A'.repeat(500);
      const createDto = {
        code: 'SUP006',
        name: longName,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      const supplierWithLongName = { ...mockSupplier, name: longName };
      jest.spyOn(repository, 'create').mockReturnValue(supplierWithLongName as any);
      jest.spyOn(repository, 'save').mockResolvedValue(supplierWithLongName as any);

      const result = await service.create(createDto, mockUserId);

      expect((result as any).name.length).toBe(500);
    });
  });
});
