import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserTenant } from '../../tenants/entities/user-tenant.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(UserTenant)
    private readonly userTenantRepository: Repository<UserTenant>,
    private readonly dataSource: DataSource,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip for auth routes
    if (req.path.includes('/auth/')) {
      return next();
    }

    const user = req['user'] as any;
    if (!user || !user.sub) {
      return next();
    }

    const userId = user.sub;

    // Get tenantId from header or use default
    let tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      // Get default tenant
      const userTenant = await this.userTenantRepository.findOne({
        where: { userId, isDefault: true },
      });

      if (!userTenant) {
        // Get first tenant
        const firstTenant = await this.userTenantRepository.findOne({
          where: { userId },
        });

        if (!firstTenant) {
          throw new UnauthorizedException('Người dùng chưa thuộc công ty nào');
        }

        tenantId = firstTenant.tenantId;
      } else {
        tenantId = userTenant.tenantId;
      }
    }

    // Verify user has access to this tenant
    const userTenant = await this.userTenantRepository.findOne({
      where: { userId, tenantId },
      relations: ['role'],
    });

    if (!userTenant) {
      throw new UnauthorizedException('Không có quyền truy cập công ty này');
    }

    // Set tenantId to request
    req['tenantId'] = tenantId;
    req['userTenant'] = userTenant;

    // Set PostgreSQL session variable for RLS
    await this.dataSource.query(`SET app.current_tenant_id = '${tenantId}'`);

    // Update last accessed
    userTenant.lastAccessedAt = new Date();
    await this.userTenantRepository.save(userTenant);

    next();
  }
}
