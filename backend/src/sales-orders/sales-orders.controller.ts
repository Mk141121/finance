import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto, UpdateSalesOrderStatusDto } from './dto/update-sales-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales-orders')
@UseGuards(JwtAuthGuard)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Post()
  create(@Body() createSalesOrderDto: CreateSalesOrderDto, @Request() req) {
    return this.salesOrdersService.create(
      createSalesOrderDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.salesOrdersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.salesOrdersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSalesOrderDto: UpdateSalesOrderDto,
    @Request() req,
  ) {
    return this.salesOrdersService.update(
      id,
      updateSalesOrderDto,
      req.user.tenantId,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateSalesOrderStatusDto,
    @Request() req,
  ) {
    return this.salesOrdersService.updateStatus(
      id,
      updateStatusDto.status,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.salesOrdersService.remove(id, req.user.tenantId);
  }
}
