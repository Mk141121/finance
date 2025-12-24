import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
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

    const [items, total] = await this.supplierRepository.findAndCount({
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
    const supplier = await this.supplierRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp');
    }

    return supplier;
  }

  async create(createSupplierDto: any, userId: string) {
    const existing = await this.supplierRepository.findOne({
      where: { code: createSupplierDto.code },
    });

    if (existing) {
      throw new ConflictException('Mã nhà cung cấp đã tồn tại');
    }

    const supplier = this.supplierRepository.create({
      ...createSupplierDto,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.supplierRepository.save(supplier);
  }

  async update(id: string, updateSupplierDto: any, userId: string) {
    const supplier = await this.findOne(id);

    Object.assign(supplier, updateSupplierDto, { updatedBy: userId });
    return await this.supplierRepository.save(supplier);
  }

  async remove(id: string) {
    const supplier = await this.findOne(id);
    await this.supplierRepository.remove(supplier);
    return { message: 'Đã xóa nhà cung cấp thành công' };
  }
}
