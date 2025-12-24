import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    const result = await this.tenantsService.findAll(page, limit);
    return {
      success: true,
      data: result.data,
      metadata: result.metadata,
    };
  }

  @Get('my-tenants')
  async getMyTenants(@Request() req) {
    const tenants = await this.tenantsService.getUserTenants(req.user.userId);
    return {
      success: true,
      data: tenants,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantsService.findOne(id);
    return {
      success: true,
      data: tenant,
    };
  }

  @Post()
  async create(@Body() createTenantDto: CreateTenantDto, @Request() req) {
    const tenant = await this.tenantsService.create(createTenantDto, req.user.userId);
    return {
      success: true,
      data: tenant,
      message: 'Tạo công ty thành công',
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    const tenant = await this.tenantsService.update(id, updateTenantDto);
    return {
      success: true,
      data: tenant,
      message: 'Cập nhật công ty thành công',
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tenantsService.remove(id);
    return {
      success: true,
      message: 'Xóa công ty thành công',
    };
  }

  @Post(':tenantId/set-default')
  async setDefault(@Param('tenantId') tenantId: string, @Request() req) {
    await this.tenantsService.setDefaultTenant(req.user.userId, tenantId);
    return {
      success: true,
      message: 'Đã đặt làm công ty mặc định',
    };
  }
}
