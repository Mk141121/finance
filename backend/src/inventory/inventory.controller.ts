import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { CreateAdjustmentDto } from './dto/adjustment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==================== WAREHOUSES ====================
  @Get('warehouses')
  @ApiOperation({ summary: 'Get all warehouses' })
  findAllWarehouses(@Request() req) {
    return this.inventoryService.findAllWarehouses(req.user.tenantId);
  }

  @Get('warehouses/:id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  findWarehouse(@Param('id') id: string, @Request() req) {
    return this.inventoryService.findWarehouse(id, req.user.tenantId);
  }

  @Post('warehouses')
  @ApiOperation({ summary: 'Create warehouse' })
  createWarehouse(@Body() createDto: CreateWarehouseDto, @Request() req) {
    return this.inventoryService.createWarehouse(
      createDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Put('warehouses/:id')
  @ApiOperation({ summary: 'Update warehouse' })
  updateWarehouse(
    @Param('id') id: string,
    @Body() updateDto: UpdateWarehouseDto,
    @Request() req,
  ) {
    return this.inventoryService.updateWarehouse(
      id,
      updateDto,
      req.user.tenantId,
      req.user.userId,
    );
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
  @ApiOperation({ summary: 'Get all stock balances' })
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
  @ApiOperation({ summary: 'Get stock balance for specific product and warehouse' })
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

  // ==================== ADJUSTMENTS ====================
  @Post('adjustments')
  @ApiOperation({ summary: 'Create stock adjustment' })
  createAdjustment(@Body() createDto: CreateAdjustmentDto, @Request() req) {
    return this.inventoryService.createAdjustment(
      createDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post('adjustments/:id/approve')
  @ApiOperation({ summary: 'Approve stock adjustment' })
  approveAdjustment(@Param('id') id: string, @Request() req) {
    return this.inventoryService.approveAdjustment(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post('adjustments/:id/reject')
  @ApiOperation({ summary: 'Reject stock adjustment' })
  rejectAdjustment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.inventoryService.rejectAdjustment(
      id,
      reason,
      req.user.tenantId,
      req.user.userId,
    );
  }
}
