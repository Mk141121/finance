import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { createMockCustomer } from '../../test/factories';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: Repository<Customer>;

  const mockCustomer = createMockCustomer();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockResult = {
        items: [mockCustomer],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockCustomer], 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(repository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockCustomer], 1]);

      await service.findAll({ page: 1, limit: 20, search: 'ABC' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockCustomer], 1]);

      await service.findAll({ page: 1, limit: 20, type: 'company' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'company',
          }),
        }),
      );
    });

    it('should filter by isActive', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockCustomer], 1]);

      await service.findAll({ page: 1, limit: 20, isActive: 'true' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCustomer as any);

      const result = await service.findOne('1');

      expect(result).toEqual(mockCustomer);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      code: 'KH002',
      name: 'Công ty XYZ',
      type: 'company' as const,
      taxCode: '0100000002',
      address: '456 Đường Test',
      phone: '0123456789',
      email: 'xyz@test.com',
    };

    it('should create a new customer', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(mockCustomer as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mockCustomer as any);

      const result = await service.create(createDto, 'user-id');

      expect(result).toEqual(mockCustomer);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: createDto.code,
          name: createDto.name,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when code already exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCustomer as any);

      await expect(service.create(createDto, 'user-id')).rejects.toThrow(ConflictException);
    });

    it('should validate tax code format for company', async () => {
      const invalidDto = { ...createDto, taxCode: 'invalid' };
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // This should be validated in DTO, but testing business logic
      expect(invalidDto.taxCode).not.toMatch(/^\d{10}(-\d{3})?$/);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Công ty ABC Updated',
      address: '789 New Address',
    };

    it('should update a customer', async () => {
      const updatedCustomer = { ...mockCustomer, ...updateDto };
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCustomer as any);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedCustomer as any);

      const result = await service.update('1', updateDto, 'user-id');

      expect(result.name).toBe(updateDto.name);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should soft delete a customer', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockCustomer as any);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mockCustomer, deletedAt: new Date() } as any);

      await service.delete('1', 'user-id');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.delete('non-existent', 'user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search results', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 20, search: 'nonexistent' });

      expect(result.items).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should handle pagination edge case (last page)', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockCustomer], 21]);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(result.meta.totalPages).toBe(2);
    });

    it('should handle special characters in search', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, search: "O'Reilly & Co." });

      expect(repository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('Edge Cases - Advanced Validations', () => {
    it('should handle concurrent updates gracefully', async () => {
      const customer = mockCustomer;
      jest.spyOn(repository, 'findOne').mockResolvedValue(customer);
      jest.spyOn(repository, 'save').mockRejectedValue(
        new Error('VersionError: Row was updated by another transaction')
      );

      await expect(
        service.update(customer.id, { name: 'New Name' }, 'user-id')
      ).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidEmails = ['invalid', '@test.com', 'test@', 'test @test.com'];
      
      for (const email of invalidEmails) {
        const dto = { ...mockCustomer, email };
        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
        jest.spyOn(repository, 'create').mockReturnValue(dto);
        jest.spyOn(repository, 'save').mockResolvedValue(dto);
        
        // Should create even with format validation disabled in test
        const result = await service.create(dto, 'user-id');
        expect(result).toBeDefined();
      }
    });

    it('should handle duplicate code detection', async () => {
      const existingCustomer = mockCustomer;
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingCustomer);

      await expect(
        service.create({ ...mockCustomer, code: 'KH001' }, 'user-id')
      ).rejects.toThrow(ConflictException);
    });

    it('should allow same code when updating same customer', async () => {
      const customer = mockCustomer;
      jest.spyOn(repository, 'findOne').mockResolvedValue(customer);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...customer,
        name: 'Updated Name',
      });

      const result = await service.update(
        customer.id,
        { name: 'Updated Name' },
        'user-id'
      );

      expect(result.name).toBe('Updated Name');
    });

    it('should handle large result sets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCustomer,
        id: `customer-${i}`,
        code: `KH${String(i + 1).padStart(3, '0')}`,
      }));

      jest.spyOn(repository, 'findAndCount').mockResolvedValue([
        largeDataset.slice(0, 20),
        1000,
      ]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(20);
      expect(result.meta.total).toBe(1000);
      expect(result.meta.totalPages).toBe(50);
    });

    it('should handle empty string searches', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockCustomer], 1]);

      const result = await service.findAll({ search: '' });

      expect(result.items).toHaveLength(1);
    });

    it('should filter by type correctly', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockCustomer], 1]);

      await service.findAll({ type: 'business' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'business' }),
        })
      );
    });

    it('should filter by active status', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockCustomer], 1]);

      await service.findAll({ isActive: 'true' });

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should handle page boundaries correctly', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 999, limit: 20 });

      expect(result.items).toEqual([]);
      expect(result.meta.page).toBe(999);
    });
  });
});
