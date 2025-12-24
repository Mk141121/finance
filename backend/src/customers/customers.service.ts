import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, search, type, isActive } = query;

    const where: any = {};

    if (search) {
      where.name = Like(`%${search}%`);
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [items, total] = await this.customerRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto, userId: string) {
    const existing = await this.customerRepository.findOne({
      where: { code: createCustomerDto.code },
    });

    if (existing) {
      throw new ConflictException('Mã khách hàng đã tồn tại');
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.customerRepository.save(customer);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, userId: string) {
    const customer = await this.findOne(id);

    Object.assign(customer, updateCustomerDto, { updatedBy: userId });
    return await this.customerRepository.save(customer);
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
    return { message: 'Đã xóa khách hàng thành công' };
  }

  /**
   * Soft delete customer (alias for backward compatibility)
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    // Soft delete by updating deletedAt
    customer.deletedAt = new Date();
    customer.isActive = false;
    await this.customerRepository.save(customer);
  }
}
