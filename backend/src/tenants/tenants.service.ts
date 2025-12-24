import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { UserTenant } from './entities/user-tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
  ) {}

  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await this.tenantRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      where: { deletedAt: null },
    });

    return {
      data,
      metadata: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy công ty');
    }

    return tenant;
  }

  async findByTaxCode(taxCode: string) {
    return await this.tenantRepository.findOne({
      where: { taxCode, deletedAt: null },
    });
  }

  async create(createTenantDto: CreateTenantDto, userId: string) {
    // Check if tax code already exists
    const existingTenant = await this.findByTaxCode(createTenantDto.taxCode);
    if (existingTenant) {
      throw new ConflictException('Mã số thuế đã được sử dụng');
    }

    // Create tenant
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      subscriptionStatus: 'active',
      subscriptionStartedAt: new Date(),
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Add creator as owner
    await this.addUserToTenant(savedTenant.id, userId, null, true, true);

    return savedTenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findOne(id);

    // Check tax code uniqueness
    if (updateTenantDto.taxCode && updateTenantDto.taxCode !== tenant.taxCode) {
      const existing = await this.findByTaxCode(updateTenantDto.taxCode);
      if (existing) {
        throw new ConflictException('Mã số thuế đã được sử dụng');
      }
    }

    Object.assign(tenant, updateTenantDto);
    return await this.tenantRepository.save(tenant);
  }

  async remove(id: string) {
    const tenant = await this.findOne(id);
    tenant.deletedAt = new Date();
    await this.tenantRepository.save(tenant);
    return { message: 'Xóa công ty thành công' };
  }

  async getUserTenants(userId: string) {
    const userTenants = await this.userTenantRepository.find({
      where: { userId },
      relations: ['tenant', 'role'],
      order: { isDefault: 'DESC', lastAccessedAt: 'DESC' },
    });

    return userTenants.map((ut) => ({
      tenant: ut.tenant,
      role: ut.role,
      isDefault: ut.isDefault,
      isOwner: ut.isOwner,
      joinedAt: ut.joinedAt,
      lastAccessedAt: ut.lastAccessedAt,
    }));
  }

  async addUserToTenant(
    tenantId: string,
    userId: string,
    roleId: string | null,
    isDefault: boolean = false,
    isOwner: boolean = false,
  ) {
    const userTenant = this.userTenantRepository.create({
      userId,
      tenantId,
      roleId,
      isDefault,
      isOwner,
    });

    return await this.userTenantRepository.save(userTenant);
  }

  async setDefaultTenant(userId: string, tenantId: string) {
    // Reset all defaults
    await this.userTenantRepository.update(
      { userId },
      { isDefault: false },
    );

    // Set new default
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId, tenantId },
    });

    if (!userTenant) {
      throw new NotFoundException('Không tìm thấy quyền truy cập');
    }

    userTenant.isDefault = true;
    userTenant.lastAccessedAt = new Date();
    return await this.userTenantRepository.save(userTenant);
  }

  async updateLastAccessed(userId: string, tenantId: string) {
    await this.userTenantRepository.update(
      { userId, tenantId },
      { lastAccessedAt: new Date() },
    );
  }
}
