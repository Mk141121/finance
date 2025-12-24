import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto, UpdateSettingDto } from './dto/setting.dto';
import {
  UpdateCompanySettingsDto,
  UpdateTaxSettingsDto,
  UpdateInvoiceSettingsDto,
  UpdateSystemSettingsDto,
} from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async findAll(category?: string) {
    const where = category ? { category } : {};
    return await this.settingRepository.find({ where });
  }

  async findOne(category: string, key: string) {
    const setting = await this.settingRepository.findOne({
      where: { category, key },
    });

    if (!setting) {
      throw new NotFoundException('Không tìm thấy cài đặt');
    }

    return setting;
  }

  async create(createSettingDto: CreateSettingDto, userId: string) {
    // Check if setting already exists
    const existing = await this.settingRepository.findOne({
      where: {
        category: createSettingDto.category,
        key: createSettingDto.key,
      },
    });

    if (existing) {
      throw new ConflictException('Cài đặt này đã tồn tại');
    }

    const setting = this.settingRepository.create({
      ...createSettingDto,
      updatedBy: userId,
    });

    return await this.settingRepository.save(setting);
  }

  async update(id: string, updateSettingDto: UpdateSettingDto, userId: string) {
    const setting = await this.settingRepository.findOne({ where: { id } });

    if (!setting) {
      throw new NotFoundException('Không tìm thấy cài đặt');
    }

    Object.assign(setting, updateSettingDto, { updatedBy: userId });
    return await this.settingRepository.save(setting);
  }

  async updateByKey(
    category: string,
    key: string,
    updateSettingDto: UpdateSettingDto,
    userId: string,
  ) {
    const setting = await this.settingRepository.findOne({
      where: { category, key },
    });

    if (!setting) {
      throw new NotFoundException('Không tìm thấy cài đặt');
    }

    Object.assign(setting, updateSettingDto, { updatedBy: userId });
    return await this.settingRepository.save(setting);
  }

  async remove(id: string) {
    const setting = await this.settingRepository.findOne({ where: { id } });

    if (!setting) {
      throw new NotFoundException('Không tìm thấy cài đặt');
    }

    await this.settingRepository.remove(setting);
    return { message: 'Đã xóa cài đặt thành công' };
  }

  // ==================== NEW GROUPED SETTINGS METHODS ====================
  async getAllSettings(tenantId: string) {
    const settings = await this.settingRepository.find({
      where: { tenantId },
    });

    // Group by category
    const grouped: any = {
      company: {},
      tax: {},
      invoice: {},
      system: {},
    };

    settings.forEach((setting) => {
      if (grouped[setting.category]) {
        grouped[setting.category][setting.key] = setting.value;
      }
    });

    return grouped;
  }

  async updateCompanySettings(
    dto: UpdateCompanySettingsDto,
    tenantId: string,
    userId: string,
  ) {
    return this.updateSettings('company', dto, tenantId, userId);
  }

  async updateTaxSettings(dto: UpdateTaxSettingsDto, tenantId: string, userId: string) {
    return this.updateSettings('tax', dto, tenantId, userId);
  }

  async updateInvoiceSettings(
    dto: UpdateInvoiceSettingsDto,
    tenantId: string,
    userId: string,
  ) {
    return this.updateSettings('invoice', dto, tenantId, userId);
  }

  async updateSystemSettings(
    dto: UpdateSystemSettingsDto,
    tenantId: string,
    userId: string,
  ) {
    return this.updateSettings('system', dto, tenantId, userId);
  }

  private async updateSettings(
    category: string,
    dto: any,
    tenantId: string,
    userId: string,
  ) {
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        let setting = await this.settingRepository.findOne({
          where: { category, key, tenantId },
        });

        if (setting) {
          setting.value = String(value);
          setting.updatedBy = userId;
        } else {
          setting = this.settingRepository.create({
            category,
            key,
            value: String(value),
            tenantId,
            updatedBy: userId,
          });
        }

        await this.settingRepository.save(setting);
      }
    }

    return this.getAllSettings(tenantId);
  }
}
