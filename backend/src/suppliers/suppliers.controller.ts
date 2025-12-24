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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách nhà cung cấp' })
  async findAll(@Query() query: any) {
    const data = await this.suppliersService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết nhà cung cấp' })
  async findOne(@Param('id') id: string) {
    const data = await this.suppliersService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo nhà cung cấp mới' })
  async create(@Body() body: any, @Request() req) {
    const data = await this.suppliersService.create(body, req.user.userId);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật nhà cung cấp' })
  async update(@Param('id') id: string, @Body() body: any, @Request() req) {
    const data = await this.suppliersService.update(id, body, req.user.userId);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa nhà cung cấp' })
  async remove(@Param('id') id: string) {
    const data = await this.suppliersService.remove(id);
    return { success: true, data };
  }
}
