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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả cài đặt' })
  @ApiQuery({ name: 'category', required: false })
  async findAll(@Query('category') category?: string) {
    const data = await this.settingsService.findAll(category);
    return {
      success: true,
      data,
    };
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
