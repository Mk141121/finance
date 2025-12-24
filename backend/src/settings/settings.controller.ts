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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto } from './dto/setting.dto';
import {
  UpdateCompanySettingsDto,
  UpdateTaxSettingsDto,
  UpdateInvoiceSettingsDto,
  UpdateSystemSettingsDto,
} from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả cài đặt (grouped by category)' })
  @ApiQuery({ name: 'category', required: false })
  async findAll(@Request() req, @Query('category') category?: string) {
    if (category) {
      const data = await this.settingsService.findAll(category);
      return { success: true, data };
    }
    // Return all settings grouped by category
    const data = await this.settingsService.getAllSettings(req.user.tenantId);
    return { success: true, data };
  }

  @Put('company')
  @ApiOperation({ summary: 'Cập nhật thông tin công ty' })
  async updateCompanySettings(@Request() req, @Body() dto: UpdateCompanySettingsDto) {
    const data = await this.settingsService.updateCompanySettings(
      dto,
      req.user.tenantId,
      req.user.userId,
    );
    return { success: true, data };
  }

  @Put('tax')
  @ApiOperation({ summary: 'Cập nhật cài đặt thuế' })
  async updateTaxSettings(@Request() req, @Body() dto: UpdateTaxSettingsDto) {
    const data = await this.settingsService.updateTaxSettings(
      dto,
      req.user.tenantId,
      req.user.userId,
    );
    return { success: true, data };
  }

  @Put('invoice')
  @ApiOperation({ summary: 'Cập nhật cài đặt hóa đơn' })
  async updateInvoiceSettings(@Request() req, @Body() dto: UpdateInvoiceSettingsDto) {
    const data = await this.settingsService.updateInvoiceSettings(
      dto,
      req.user.tenantId,
      req.user.userId,
    );
    return { success: true, data };
  }

  @Put('system')
  @ApiOperation({ summary: 'Cập nhật cài đặt hệ thống' })
  async updateSystemSettings(@Request() req, @Body() dto: UpdateSystemSettingsDto) {
    const data = await this.settingsService.updateSystemSettings(
      dto,
      req.user.tenantId,
      req.user.userId,
    );
    return { success: true, data };
  }

  @Get(':category/:key')
  @ApiOperation({ summary: 'Lấy một cài đặt cụ thể' })
  async findOne(@Param('category') category: string, @Param('key') key: string) {
    const data = await this.settingsService.findOne(category, key);
    return {
      success: true,
      data,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo cài đặt mới' })
  async create(@Body() createSettingDto: CreateSettingDto, @Request() req) {
    const data = await this.settingsService.create(
      createSettingDto,
      req.user.userId,
    );
    return {
      success: true,
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật cài đặt theo ID' })
  async update(
    @Param('id') id: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Request() req,
  ) {
    const data = await this.settingsService.update(
      id,
      updateSettingDto,
      req.user.userId,
    );
    return {
      success: true,
      data,
    };
  }

  @Put(':category/:key')
  @ApiOperation({ summary: 'Cập nhật cài đặt theo category và key' })
  async updateByKey(
    @Param('category') category: string,
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Request() req,
  ) {
    const data = await this.settingsService.updateByKey(
      category,
      key,
      updateSettingDto,
      req.user.userId,
    );
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cài đặt' })
  async remove(@Param('id') id: string) {
    const data = await this.settingsService.remove(id);
    return {
      success: true,
      data,
    };
  }
}
