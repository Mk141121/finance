import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto, UpdateSettingDto } from './dto/setting.dto';

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
}
