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
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @Request() req) {
    return this.purchaseOrdersService.create(
      createPurchaseOrderDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.purchaseOrdersService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.purchaseOrdersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @Request() req,
  ) {
    return this.purchaseOrdersService.update(
      id,
      updatePurchaseOrderDto,
      req.user.tenantId,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePurchaseOrderStatusDto,
    @Request() req,
  ) {
    return this.purchaseOrdersService.updateStatus(
      id,
      updateStatusDto.status,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.purchaseOrdersService.remove(id, req.user.tenantId);
  }
}
