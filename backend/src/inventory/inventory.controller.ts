import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== WAREHOUSES ====================
  @Get('warehouses')
  findAllWarehouses(@Request() req) {
    return this.inventoryService.findAllWarehouses(req.user.tenantId);
  }

  @Get('warehouses/:id')
  findWarehouse(@Param('id') id: string, @Request() req) {
    return this.inventoryService.findWarehouse(id, req.user.tenantId);
  }

  // ==================== STOCK TRANSACTIONS ====================
  @Post('transactions')
  createTransaction(
    @Body() createDto: CreateStockTransactionDto,
    @Request() req,
  ) {
    return this.inventoryService.createStockTransaction(
      createDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get('transactions')
  findAllTransactions(@Request() req) {
    return this.inventoryService.findAllTransactions(req.user.tenantId);
  }

  @Get('transactions/:id')
  findOneTransaction(@Param('id') id: string, @Request() req) {
    return this.inventoryService.findOneTransaction(id, req.user.tenantId);
  }

  @Post('transactions/:id/confirm')
  confirmTransaction(@Param('id') id: string, @Request() req) {
    return this.inventoryService.confirmStockTransaction(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  // ==================== STOCK BALANCES ====================
  @Get('balances')
  getAllBalances(
    @Request() req,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getAllStockBalances(
      req.user.tenantId,
      warehouseId,
    );
  }

  @Get('balances/:productId/:warehouseId')
  getBalance(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
    @Request() req,
  ) {
    return this.inventoryService.getStockBalance(
      req.user.tenantId,
      productId,
      warehouseId,
    );
  }
}
