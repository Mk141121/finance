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
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách khách hàng' })
  async findAll(@Query() query: any) {
    const data = await this.customersService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết khách hàng' })
  async findOne(@Param('id') id: string) {
    const data = await this.customersService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  async create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    const data = await this.customersService.create(createCustomerDto, req.user.userId);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật khách hàng' })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req,
  ) {
    const data = await this.customersService.update(id, updateCustomerDto, req.user.userId);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khách hàng' })
  async remove(@Param('id') id: string) {
    const data = await this.customersService.remove(id);
    return { success: true, data };
  }
}
