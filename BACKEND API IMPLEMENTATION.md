# 🚀 BACKEND API IMPLEMENTATION - PRIORITY #1

**Ngày tạo**: 2025-12-24  
**Ưu tiên**: 🔴 **CRITICAL - BLOCKING ISSUE**  
**Thời gian**: 2-3 ngày  
**Trạng thái**: Frontend đã sẵn sàng nhưng thiếu Backend APIs

---

## 📊 TỔNG QUAN

### Tình Trạng Hiện Tại

```
┌─────────────────────────────┬──────────┬──────────┬────────────┐
│ API Endpoint Group          │ Frontend │ Backend  │ Priority   │
├─────────────────────────────┼──────────┼──────────┼────────────┤
│ Dashboard Stats & Charts    │ ✅ Ready │ ❌ NONE  │ 🔴 P0      │
│ Inventory Management        │ ✅ Ready │ ⚠️ Part  │ 🔴 P0      │
│ Chart of Accounts           │ ✅ Ready │ ⚠️ Part  │ 🔴 P0      │
│ Settings (4 tabs)           │ ✅ Ready │ ❌ NONE  │ 🔴 P0      │
│ Reports & Analytics         │ ✅ Ready │ ❌ NONE  │ 🟡 P1      │
│ User Profile                │ ✅ Ready │ ⚠️ Part  │ 🟡 P1      │
└─────────────────────────────┴──────────┴──────────┴────────────┘
```

**Impact**:
- Frontend: **7,000+ lines** code đã implement
- Backend APIs: **~60% thiếu**
- Users: **Không thể sử dụng** nhiều tính năng

---

## 🎯 MỤC TIÊU

### Day 1: Dashboard & Inventory APIs
- ✅ Dashboard statistics
- ✅ Dashboard charts data
- ✅ Warehouses CRUD
- ✅ Stock adjustments workflow

### Day 2: Chart of Accounts & Settings
- ✅ Chart of Accounts tree view
- ✅ Company settings
- ✅ Tax settings
- ✅ Invoice settings

### Day 3: Reports & User Profile
- ✅ Sales/Purchase/Inventory reports
- ✅ Export to Excel/PDF
- ✅ User profile management
- ✅ Testing & documentation

---

## 🔴 DAY 1: DASHBOARD & INVENTORY APIs

### API Group 1: Dashboard Statistics

**Endpoint**:  `GET /api/v1/dashboard/stats`

**Response**:
```json
{
  "totalOrders": 125,
  "ordersGrowth": 15. 5,
  "totalInvoices": 98,
  "invoicesGrowth": 8.2,
  "totalInventory": 1250,
  "inventoryGrowth": -2.3,
  "totalRevenue": 1250000000,
  "revenueGrowth": 12.8
}
```

**Implementation**: 

**File**: `backend/src/dashboard/dashboard.controller.ts`

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard. service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan dashboard' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getStats(@Req() req) {
    const tenantId = req.user.tenantId;
    return this. dashboardService.getStats(tenantId);
  }

  @Get('recent-activities')
  @ApiOperation({ summary: 'Lấy hoạt động gần đây' })
  async getRecentActivities(@Req() req) {
    const tenantId = req.user.tenantId;
    return this. dashboardService.getRecentActivities(tenantId);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Lấy dữ liệu biểu đồ doanh thu 12 tháng' })
  async getRevenueChart(@Req() req) {
    const tenantId = req.user.tenantId;
    return this.dashboardService.getRevenueChart(tenantId);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm bán chạy' })
  async getTopProducts(@Req() req) {
    const tenantId = req.user.tenantId;
    return this.dashboardService.getTopProducts(tenantId);
  }
}
```

**File**: `backend/src/dashboard/dashboard.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { EInvoice } from '../e-invoices/entities/e-invoice.entity';
import { Product } from '../products/entities/product.entity';
import { StockTransaction } from '../inventory/entities/stock-transaction.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(EInvoice)
    private readonly eInvoiceRepository:  Repository<EInvoice>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StockTransaction)
    private readonly stockTransactionRepository: Repository<StockTransaction>,
  ) {}

  async getStats(tenantId: string) {
    const now = new Date();
    const thisMonthStart = dayjs(now).startOf('month').toDate();
    const lastMonthStart = dayjs(now).subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs(now).subtract(1, 'month').endOf('month').toDate();

    // Current month data
    const [
      thisMonthOrders,
      thisMonthInvoices,
      thisMonthRevenue,
      lastMonthOrders,
      lastMonthInvoices,
      lastMonthRevenue,
    ] = await Promise.all([
      this.salesOrderRepository.count({
        where: { tenantId, createdAt:  MoreThan(thisMonthStart) },
      }),
      this.eInvoiceRepository. count({
        where: { tenantId, createdAt: MoreThan(thisMonthStart) },
      }),
      this.salesOrderRepository
        .createQueryBuilder('so')
        .select('SUM(so.totalAmount)', 'total')
        .where('so.tenantId = :tenantId', { tenantId })
        .andWhere('so.createdAt >= :start', { start: thisMonthStart })
        .getRawOne(),
      this.salesOrderRepository. count({
        where: {
          tenantId,
          createdAt: MoreThan(lastMonthStart),
        },
      }),
      this.eInvoiceRepository.count({
        where: {
          tenantId,
          createdAt: MoreThan(lastMonthStart),
        },
      }),
      this.salesOrderRepository
        . createQueryBuilder('so')
        .select('SUM(so. totalAmount)', 'total')
        .where('so.tenantId = :tenantId', { tenantId })
        .andWhere('so.createdAt BETWEEN :start AND :end', {
          start: lastMonthStart,
          end:  lastMonthEnd,
        })
        .getRawOne(),
    ]);

    // Total inventory
    const totalInventory = await this.productRepository.count({
      where: { tenantId },
    });

    // Calculate growth percentages
    const ordersGrowth = this.calculateGrowth(thisMonthOrders, lastMonthOrders);
    const invoicesGrowth = this.calculateGrowth(thisMonthInvoices, lastMonthInvoices);
    const revenueGrowth = this.calculateGrowth(
      parseFloat(thisMonthRevenue?. total || '0'),
      parseFloat(lastMonthRevenue?.total || '0'),
    );

    return {
      totalOrders:  thisMonthOrders,
      ordersGrowth,
      totalInvoices: thisMonthInvoices,
      invoicesGrowth,
      totalInventory,
      inventoryGrowth: 0, // Can calculate based on stock changes
      totalRevenue: parseFloat(thisMonthRevenue?. total || '0'),
      revenueGrowth,
    };
  }

  async getRecentActivities(tenantId: string) {
    // Get last 10 activities (orders, invoices, payments)
    const recentOrders = await this.salesOrderRepository. find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take:  5,
      relations: ['customer'],
    });

    const recentInvoices = await this.eInvoiceRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const activities = [
      ...recentOrders. map((order) => ({
        id: order.id,
        type: 'order',
        title: `Đơn hàng ${order.orderNumber}`,
        description: `Khách hàng: ${order. customerName}`,
        amount: order.totalAmount,
        createdAt: order.createdAt,
      })),
      ...recentInvoices.map((invoice) => ({
        id: invoice.id,
        type: 'invoice',
        title: `Hóa đơn ${invoice. invoiceNumber}`,
        description: `Trạng thái: ${invoice. status}`,
        amount: invoice.totalAmount,
        createdAt: invoice.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => b.createdAt. getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  async getRevenueChart(tenantId: string) {
    const data = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = dayjs(now).subtract(i, 'month').startOf('month').toDate();
      const monthEnd = dayjs(now).subtract(i, 'month').endOf('month').toDate();

      const revenue = await this.salesOrderRepository
        .createQueryBuilder('so')
        .select('SUM(so.totalAmount)', 'total')
        .where('so. tenantId = :tenantId', { tenantId })
        .andWhere('so.createdAt BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getRawOne();

      data.push({
        month: dayjs(monthStart).format('MM/YYYY'),
        revenue: parseFloat(revenue?.total || '0'),
      });
    }

    return data;
  }

  async getTopProducts(tenantId: string) {
    // Get top 10 bestselling products from sales orders
    const topProducts = await this.salesOrderRepository
      . createQueryBuilder('so')
      .leftJoin('so.items', 'item')
      .select('item.productName', 'productName')
      .addSelect('SUM(item.quantity)', 'quantity')
      .where('so.tenantId = : tenantId', { tenantId })
      .groupBy('item.productName')
      .orderBy('quantity', 'DESC')
      .limit(10)
      .getRawMany();

    return topProducts.map((p) => ({
      productName:  p.productName,
      quantity: parseInt(p.quantity, 10),
    }));
  }

  private calculateGrowth(current: number, previous:  number): number {
    if (previous === 0) return current > 0 ? 100 :  0;
    return ((current - previous) / previous) * 100;
  }
}
```

**File**: `backend/src/dashboard/dashboard.module. ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard. controller';
import { DashboardService } from './dashboard.service';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { EInvoice } from '../e-invoices/entities/e-invoice. entity';
import { Product } from '../products/entities/product.entity';
import { StockTransaction } from '../inventory/entities/stock-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder, EInvoice, Product, StockTransaction]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
```

**Update `app.module.ts`**:

```typescript
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // ... existing modules
    DashboardModule, // Add this
  ],
})
export class AppModule {}
```

#### 📋 Checklist Day 1 - Part 1

```bash
- [ ] Create backend/src/dashboard/ directory
- [ ] Create dashboard.controller.ts
- [ ] Create dashboard.service.ts
- [ ] Create dashboard.module.ts
- [ ] Update app.module.ts to import DashboardModule
- [ ] Test:  npm run start:dev
- [ ] Verify:  GET http://localhost:3000/api/v1/dashboard/stats
- [ ] Verify:  Swagger docs at http://localhost:3000/api/docs
- [ ] Commit: "feat(api): implement Dashboard statistics APIs"
```

---

### API Group 2: Inventory Management

**Endpoints**:
- `POST /api/v1/warehouses` - Create warehouse
- `PUT /api/v1/warehouses/:id` - Update warehouse
- `POST /api/v1/inventory/adjustments` - Create adjustment
- `POST /api/v1/inventory/adjustments/:id/approve` - Approve adjustment

**File**: `backend/src/inventory/inventory.controller.ts` (Add missing endpoints)

```typescript
import { Controller, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { CreateAdjustmentDto } from './dto/adjustment.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // Warehouse endpoints
  @Post('warehouses')
  @ApiOperation({ summary: 'Tạo kho mới' })
  async createWarehouse(@Req() req, @Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto, req.user.tenantId, req.user.userId);
  }

  @Put('warehouses/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin kho' })
  async updateWarehouse(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.inventoryService.updateWarehouse(
      id,
      dto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  // Stock adjustment endpoints
  @Post('adjustments')
  @ApiOperation({ summary: 'Tạo phiếu điều chỉnh kho' })
  async createAdjustment(@Req() req, @Body() dto: CreateAdjustmentDto) {
    return this.inventoryService.createAdjustment(
      dto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post('adjustments/:id/approve')
  @ApiOperation({ summary:  'Phê duyệt phiếu điều chỉnh kho' })
  async approveAdjustment(@Req() req, @Param('id') id: string) {
    return this.inventoryService.approveAdjustment(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post('adjustments/:id/reject')
  @ApiOperation({ summary: 'Từ chối phiếu điều chỉnh kho' })
  async rejectAdjustment(
    @Req() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.inventoryService.rejectAdjustment(
      id,
      reason,
      req.user.tenantId,
      req.user.userId,
    );
  }
}
```

**File**: `backend/src/inventory/dto/warehouse.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'WH001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Kho trung tâm' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Huệ, Q1, TP. HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWarehouseDto extends CreateWarehouseDto {}
```

**File**: `backend/src/inventory/dto/adjustment.dto.ts`

```typescript
import { IsString, IsEnum, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum AdjustmentReason {
  DAMAGE = 'damage',
  LOSS = 'loss',
  FOUND = 'found',
  EXPIRED = 'expired',
  COUNTING = 'counting',
  OTHER = 'other',
}

class AdjustmentItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiProperty()
  @IsNumber()
  currentQuantity: number;

  @ApiProperty()
  @IsNumber()
  adjustedQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAdjustmentDto {
  @ApiProperty()
  @IsString()
  adjustmentDate: string;

  @ApiProperty({ enum: AdjustmentReason })
  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;

  @ApiProperty({ type: [AdjustmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentItemDto)
  items: AdjustmentItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
```

**File**: `backend/src/inventory/inventory.service.ts` (Add missing methods)

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { StockTransaction } from './entities/stock-transaction.entity';
import { Product } from '../products/entities/product.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse. dto';
import { CreateAdjustmentDto } from './dto/adjustment.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(StockAdjustment)
    private readonly adjustmentRepository: Repository<StockAdjustment>,
    @InjectRepository(StockTransaction)
    private readonly transactionRepository: Repository<StockTransaction>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource:  DataSource,
  ) {}

  // Warehouse methods
  async createWarehouse(dto: CreateWarehouseDto, tenantId: string, userId: string) {
    // Check duplicate code
    const existing = await this.warehouseRepository.findOne({
      where: { code: dto.code, tenantId },
    });

    if (existing) {
      throw new BadRequestException('Mã kho đã tồn tại');
    }

    const warehouse = this.warehouseRepository.create({
      ... dto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.warehouseRepository.save(warehouse);
  }

  async updateWarehouse(
    id: string,
    dto: UpdateWarehouseDto,
    tenantId: string,
    userId: string,
  ) {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException('Không tìm thấy kho');
    }

    Object.assign(warehouse, dto, { updatedBy: userId });
    return await this.warehouseRepository.save(warehouse);
  }

  // Stock adjustment methods
  async createAdjustment(dto: CreateAdjustmentDto, tenantId: string, userId:  string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate adjustment number
      const count = await this.adjustmentRepository. count({ where: { tenantId } });
      const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

      // Create adjustment
      const adjustment = queryRunner.manager.create(StockAdjustment, {
        adjustmentNumber,
        adjustmentDate: new Date(dto.adjustmentDate),
        reason: dto.reason,
        status: 'draft',
        notes: dto.notes,
        tenantId,
        createdBy: userId,
        updatedBy: userId,
      });

      await queryRunner.manager. save(adjustment);

      // Create adjustment items
      for (const item of dto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId, tenantId },
        });

        if (!product) {
          throw new NotFoundException(`Không tìm thấy sản phẩm ${item.productId}`);
        }

        const adjustmentItem = queryRunner.manager. create('StockAdjustmentItem', {
          adjustmentId: adjustment.id,
          productId: item.productId,
          warehouseId: item.warehouseId,
          currentQuantity: item.currentQuantity,
          adjustedQuantity:  item.adjustedQuantity,
          differenceQuantity: item.adjustedQuantity - item.currentQuantity,
          batchNumber:  item.batchNumber,
          notes: item.notes,
        });

        await queryRunner.manager.save(adjustmentItem);
      }

      await queryRunner. commitTransaction();

      return await this.adjustmentRepository.findOne({
        where: { id:  adjustment.id },
        relations: ['items', 'items.product', 'items.warehouse'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approveAdjustment(id: string, tenantId: string, userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const adjustment = await queryRunner.manager.findOne(StockAdjustment, {
        where: { id, tenantId },
        relations: ['items'],
      });

      if (!adjustment) {
        throw new NotFoundException('Không tìm thấy phiếu điều chỉnh');
      }

      if (adjustment.status !== 'draft') {
        throw new BadRequestException('Phiếu điều chỉnh không ở trạng thái nháp');
      }

      // Update adjustment status
      adjustment.status = 'approved';
      adjustment.approvedBy = userId;
      adjustment.approvedAt = new Date();
      await queryRunner.manager.save(adjustment);

      // Create stock transactions and update product stock
      for (const item of adjustment.items) {
        const transaction = queryRunner.manager.create(StockTransaction, {
          transactionDate: adjustment.adjustmentDate,
          transactionType: item.differenceQuantity > 0 ?  'IN' : 'OUT',
          productId: item. productId,
          warehouseId: item.warehouseId,
          quantity: Math.abs(item.differenceQuantity),
          batchNumber: item.batchNumber,
          referenceType: 'ADJUSTMENT',
          referenceId:  adjustment.id,
          referenceNumber: adjustment.adjustmentNumber,
          notes: `Điều chỉnh kho:  ${adjustment.reason}`,
          tenantId,
          createdBy: userId,
        });

        await queryRunner.manager.save(transaction);

        // Update product current stock
        const product = await queryRunner.manager.findOne(Product, {
          where: { id:  item.productId },
        });

        if (product) {
          product.currentStock += item.differenceQuantity;
          await queryRunner.manager.save(product);
        }
      }

      await queryRunner.commitTransaction();

      return await this.adjustmentRepository.findOne({
        where: { id },
        relations: ['items', 'items.product', 'items.warehouse'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner. release();
    }
  }

  async rejectAdjustment(
    id: string,
    reason: string,
    tenantId: string,
    userId: string,
  ) {
    const adjustment = await this.adjustmentRepository. findOne({
      where: { id, tenantId },
    });

    if (!adjustment) {
      throw new NotFoundException('Không tìm thấy phiếu điều chỉnh');
    }

    if (adjustment.status !== 'draft') {
      throw new BadRequestException('Phiếu điều chỉnh không ở trạng thái nháp');
    }

    adjustment.status = 'rejected';
    adjustment.rejectionReason = reason;
    adjustment.updatedBy = userId;

    return await this.adjustmentRepository.save(adjustment);
  }

  // ...  existing methods
}
```

#### 📋 Checklist Day 1 - Part 2

```bash
- [ ] Create dto/warehouse.dto.ts
- [ ] Create dto/adjustment. dto.ts
- [ ] Update inventory.controller.ts with new endpoints
- [ ] Update inventory.service.ts with new methods
- [ ] Test:  POST http://localhost:3000/api/v1/inventory/warehouses
- [ ] Test: POST http://localhost:3000/api/v1/inventory/adjustments
- [ ] Test: POST http://localhost:3000/api/v1/inventory/adjustments/: id/approve
- [ ] Verify in Swagger docs
- [ ] Commit:  "feat(api): implement Inventory management APIs"
```

---

## 🟡 DAY 2: CHART OF ACCOUNTS & SETTINGS APIs

### API Group 3: Chart of Accounts

**Endpoints**:
- `GET /api/v1/accounting/chart-of-accounts` - Get tree view
- `POST /api/v1/accounting/accounts` - Create account
- `PUT /api/v1/accounting/accounts/:id` - Update account
- `DELETE /api/v1/accounting/accounts/:id` - Delete account

**File**: `backend/src/accounting/accounting.controller.ts` (Update)

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService:  AccountingService) {}

  // Chart of Accounts endpoints
  @Get('chart-of-accounts')
  @ApiOperation({ summary: 'Lấy hệ thống tài khoản dạng cây (TT133/2016)' })
  async getChartOfAccounts(@Req() req) {
    return this.accountingService.getChartOfAccounts(req. user.tenantId);
  }

  @Get('accounts/: id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết tài khoản' })
  async getAccount(@Req() req, @Param('id') id: string) {
    return this.accountingService.getAccount(id, req.user.tenantId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Tạo tài khoản kế toán mới' })
  async createAccount(@Req() req, @Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(dto, req.user.tenantId, req.user.userId);
  }

  @Put('accounts/: id')
  @ApiOperation({ summary: 'Cập nhật tài khoản kế toán' })
  async updateAccount(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountingService.updateAccount(
      id,
      dto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary:  'Xóa tài khoản kế toán' })
  async deleteAccount(@Req() req, @Param('id') id: string) {
    return this.accountingService.deleteAccount(id, req.user. tenantId);
  }

  // ...  existing journal entry endpoints
}
```

**File**: `backend/src/accounting/dto/account.dto.ts`

```typescript
import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export class CreateAccountDto {
  @ApiProperty({ example: '1111' })
  @IsString()
  accountCode: string;

  @ApiProperty({ example: 'Tiền mặt' })
  @IsString()
  accountName: string;

  @ApiProperty({ enum: AccountType, example: 'ASSET' })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional({ example: '111' })
  @IsOptional()
  @IsString()
  parentAccountCode?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAccountDto extends CreateAccountDto {}
```

**File**: `backend/src/accounting/accounting.service.ts` (Add methods)

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepository: Repository<JournalEntry>,
  ) {}

  async getChartOfAccounts(tenantId: string) {
    // Get all accounts
    const accounts = await this.accountRepository.find({
      where: { tenantId },
      order: { accountCode: 'ASC' },
    });

    // Build tree structure
    const accountMap = new Map();
    const rootAccounts = [];

    // First pass: create map
    accounts.forEach((account) => {
      accountMap.set(account.accountCode, {
        ... account,
        children: [],
      });
    });

    // Second pass: build tree
    accounts.forEach((account) => {
      const node = accountMap.get(account. accountCode);
      
      if (account.parentAccountCode) {
        const parent = accountMap.get(account.parentAccountCode);
        if (parent) {
          parent. children.push(node);
        } else {
          rootAccounts. push(node);
        }
      } else {
        rootAccounts. push(node);
      }
    });

    return rootAccounts;
  }

  async getAccount(id: string, tenantId: string) {
    const account = await this. accountRepository.findOne({
      where: { id, tenantId },
    });

    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    // Get account balance (sum of all journal entries)
    const balance = await this.journalEntryRepository
      .createQueryBuilder('je')
      .leftJoin('je.lines', 'line')
      .select('SUM(line.debit)', 'totalDebit')
      .addSelect('SUM(line.credit)', 'totalCredit')
      .where('line.accountCode = :code', { code: account.accountCode })
      .andWhere('je.tenantId = :tenantId', { tenantId })
      .andWhere('je.status = :status', { status: 'posted' })
      .getRawOne();

    const totalDebit = parseFloat(balance?. totalDebit || '0');
    const totalCredit = parseFloat(balance?.totalCredit || '0');
    const netBalance = totalDebit - totalCredit;

    return {
      ...account,
      balance: {
        debit: totalDebit,
        credit: totalCredit,
        net: netBalance,
      },
    };
  }

  async createAccount(dto: CreateAccountDto, tenantId: string, userId: string) {
    // Check duplicate code
    const existing = await this.accountRepository.findOne({
      where: { accountCode: dto.accountCode, tenantId },
    });

    if (existing) {
      throw new BadRequestException('Mã tài khoản đã tồn tại');
    }

    // Validate parent account if specified
    if (dto.parentAccountCode) {
      const parent = await this.accountRepository.findOne({
        where: { accountCode: dto.parentAccountCode, tenantId },
      });

      if (!parent) {
        throw new NotFoundException('Không tìm thấy tài khoản cha');
      }

      // Parent must be a group account
      if (!parent.isGroup) {
        throw new BadRequestException('Tài khoản cha phải là tài khoản tổng hợp');
      }
    }

    const account = this.accountRepository.create({
      ... dto,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.accountRepository.save(account);
  }

  async updateAccount(
    id: string,
    dto: UpdateAccountDto,
    tenantId: string,
    userId: string,
  ) {
    const account = await this.accountRepository.findOne({
      where: { id, tenantId },
    });

    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    // Check if account has been used in journal entries
    const usageCount = await this.journalEntryRepository
      .createQueryBuilder('je')
      .leftJoin('je.lines', 'line')
      .where('line.accountCode = :code', { code: account.accountCode })
      .andWhere('je.tenantId = :tenantId', { tenantId })
      .getCount();

    if (usageCount > 0) {
      // Only allow updating name, description, isActive
      account.accountName = dto.accountName;
      account.description = dto.description;
      account.isActive = dto.isActive ??  account.isActive;
    } else {
      Object.assign(account, dto);
    }

    account.updatedBy = userId;
    return await this.accountRepository.save(account);
  }

  async deleteAccount(id: string, tenantId: string) {
    const account = await this.accountRepository.findOne({
      where: { id, tenantId },
    });

    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    // Check if account has been used
    const usageCount = await this.journalEntryRepository
      .createQueryBuilder('je')
      .leftJoin('je. lines', 'line')
      .where('line.accountCode = :code', { code: account. accountCode })
      .andWhere('je.tenantId = :tenantId', { tenantId })
      .getCount();

    if (usageCount > 0) {
      throw new BadRequestException(
        'Không thể xóa tài khoản đã được sử dụng trong bút toán',
      );
    }

    // Check if account has children
    const childCount = await this.accountRepository. count({
      where: { parentAccountCode: account.accountCode, tenantId },
    });

    if (childCount > 0) {
      throw new BadRequestException('Không thể xóa tài khoản có tài khoản con');
    }

    await this.accountRepository.remove(account);
    return { message: 'Xóa tài khoản thành công' };
  }

  // ... existing journal entry methods
}
```

#### 📋 Checklist Day 2 - Part 1

```bash
- [ ] Create dto/account.dto.ts
- [ ] Update accounting.controller.ts with Chart of Accounts endpoints
- [ ] Update accounting.service.ts with account methods
- [ ] Test: GET http://localhost:3000/api/v1/accounting/chart-of-accounts
- [ ] Test: POST http://localhost:3000/api/v1/accounting/accounts
- [ ] Verify tree structure in response
- [ ] Commit: "feat(api): implement Chart of Accounts APIs"
```

---

### API Group 4: Settings Management

**Endpoints**:
- `GET /api/v1/settings` - Get all settings
- `PUT /api/v1/settings/company` - Update company settings
- `PUT /api/v1/settings/tax` - Update tax settings
- `PUT /api/v1/settings/invoice` - Update invoice settings
- `PUT /api/v1/settings/system` - Update system settings

**File**: `backend/src/settings/settings.controller.ts` (Update)

```typescript
import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import {
  UpdateCompanySettingsDto,
  UpdateTaxSettingsDto,
  UpdateInvoiceSettingsDto,
  UpdateSystemSettingsDto,
} from './dto/settings. dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả cài đặt' })
  async getAllSettings(@Req() req) {
    return this.settingsService.getAllSettings(req.user.tenantId);
  }

  @Put('company')
  @ApiOperation({ summary: 'Cập nhật thông tin công ty' })
  async updateCompanySettings(@Req() req, @Body() dto: UpdateCompanySettingsDto) {
    return this.settingsService.updateCompanySettings(
      dto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Put('tax')
  @ApiOperation({ summary:  'Cập nhật cài đặt thuế' })
  async updateTaxSettings(@Req() req, @Body() dto: UpdateTaxSettingsDto) {
    return this.settingsService.updateTaxSettings(dto, req.user.tenantId, req.user.userId);
  }

  @Put('invoice')
  @ApiOperation({ summary:  'Cập nhật cài đặt hóa đơn' })
  async updateInvoiceSettings(@Req() req, @Body() dto: UpdateInvoiceSettingsDto) {
    return this.settingsService.updateInvoiceSettings(
      dto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Put('system')
  @ApiOperation({ summary: 'Cập nhật cài đặt hệ thống' })
  async updateSystemSettings(@Req() req, @Body() dto: UpdateSystemSettingsDto) {
    return this.settingsService.updateSystemSettings(
      dto,
      req.user.tenantId,
      req.user.userId,
    );
  }
}
```

**File**: `backend/src/settings/dto/settings.dto.ts`

```typescript
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legalRepresentative?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;
}

export class UpdateTaxSettingsDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  defaultVatRate?: number;

  @ApiPropertyOptional({ example: 'deduction' })
  @IsOptional()
  @IsString()
  vatMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  eInvoiceEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eInvoiceProvider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerUsername?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerPassword?: string;
}

export class UpdateInvoiceSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceTemplate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  invoiceStartNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSendEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureImage?: string;
}

export class UpdateSystemSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fiscalYearStart?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  decimalPlaces?: number;
}
```

**File**: `backend/src/settings/settings.service.ts` (Update)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
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

  async getAllSettings(tenantId: string) {
    const settings = await this.settingRepository.find({
      where: { tenantId },
    });

    // Group by category
    const grouped = {
      company: {},
      tax: {},
      invoice: {},
      system: {},
    };

    settings.forEach((setting) => {
      if (grouped[setting.category]) {
        grouped[setting.category][setting.key] = setting. value;
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

  async updateTaxSettings(dto: UpdateTaxSettingsDto, tenantId: string, userId:  string) {
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
            value:  String(value),
            tenantId,
            updatedBy: userId,
          });
        }

        await this. settingRepository.save(setting);
      }
    }

    return this.getAllSettings(tenantId);
  }

  // ... existing methods
}
```

#### 📋 Checklist Day 2 - Part 2

```bash
- [ ] Create dto/settings.dto. ts
- [ ] Update settings. controller.ts with new endpoints
- [ ] Update settings. service.ts with update methods
- [ ] Test: GET http://localhost:3000/api/v1/settings
- [ ] Test: PUT http://localhost:3000/api/v1/settings/company
- [ ] Test: PUT http://localhost:3000/api/v1/settings/tax
- [ ] Commit: "feat(api): implement Settings management APIs"
```

---

## 🟠 DAY 3: REPORTS & USER PROFILE APIs

### API Group 5: Reports & Analytics

**Endpoints**:
- `GET /api/v1/reports/sales` - Sales report
- `GET /api/v1/reports/purchases` - Purchase report
- `GET /api/v1/reports/inventory` - Inventory report
- `GET /api/v1/reports/export/excel` - Export to Excel
- `GET /api/v1/reports/export/pdf` - Export to PDF

**File**: `backend/src/reports/reports.controller.ts`

```typescript
import { Controller, Get, Query, Res, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Báo cáo bán hàng' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSalesReport(@Req() req, @Query() query: any) {
    return this.reportsService.getSalesReport(req.user.tenantId, query);
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Báo cáo mua hàng' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getPurchaseReport(@Req() req, @Query() query: any) {
    return this.reportsService. getPurchaseReport(req.user.tenantId, query);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Báo cáo tồn kho' })
  async getInventoryReport(@Req() req) {
    return this.reportsService.getInventoryReport(req.user.tenantId);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Xuất báo cáo Excel' })
  @ApiQuery({ name: 'type', enum: ['sales', 'purchases', 'inventory'] })
  async exportExcel(@Req() req, @Query('type') type: string, @Res() res: Response) {
    const buffer = await this.reportsService. exportToExcel(req.user.tenantId, type);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.xlsx`);
    res.send(buffer);
  }

  @Get('export/pdf')
  @ApiOperation({ summary:  'Xuất báo cáo PDF' })
  @ApiQuery({ name: 'type', enum: ['sales', 'purchases', 'inventory'] })
  async exportPdf(@Req() req, @Query('type') type: string, @Res() res: Response) {
    const buffer = await this.reportsService.exportToPdf(req. user.tenantId, type);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.pdf`);
    res.send(buffer);
  }
}
```

**File**: `backend/src/reports/reports.service. ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { PurchaseOrder } from '../purchase-orders/purchase-order.entity';
import { Product } from '../products/entities/product.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getSalesReport(tenantId: string, query: any) {
    const { startDate, endDate } = query;
    
    const where:  any = { tenantId };
    
    if (startDate && endDate) {
      where.orderDate = Between(new Date(startDate), new Date(endDate));
    }

    const orders = await this.salesOrderRepository. find({
      where,
      relations: ['items'],
      order:  { orderDate: 'DESC' },
    });

    // Calculate summary
    const summary = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalOrders: orders.length,
      averageOrderValue: 0,
    };

    const details = orders.map((order) => {
      const cost = order.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0);
      const profit = order.totalAmount - cost;

      summary.totalRevenue += order.totalAmount;
      summary. totalCost += cost;
      summary.totalProfit += profit;

      return {
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        cost,
        profit,
        profitMargin: ((profit / order.totalAmount) * 100).toFixed(2) + '%',
      };
    });

    summary.averageOrderValue = orders.length > 0 ? summary.totalRevenue / orders.length : 0;

    return { summary, details };
  }

  async getPurchaseReport(tenantId: string, query: any) {
    const { startDate, endDate } = query;
    
    const where: any = { tenantId };
    
    if (startDate && endDate) {
      where.orderDate = Between(new Date(startDate), new Date(endDate));
    }

    const orders = await this.purchaseOrderRepository.find({
      where,
      relations: ['items'],
      order:  { orderDate: 'DESC' },
    });

    const summary = {
      totalPurchaseValue: 0,
      totalOrders: orders.length,
      averageOrderValue: 0,
      supplierCount: new Set(orders.map(o => o.supplierId)).size,
    };

    const details = orders.map((order) => {
      summary.totalPurchaseValue += order.totalAmount;

      return {
        orderNumber:  order.orderNumber,
        orderDate: order.orderDate,
        supplierName: order.supplierName,
        totalAmount: order. totalAmount,
        status: order.status,
      };
    });

    summary.averageOrderValue = orders.length > 0 ? summary.totalPurchaseValue / orders.length : 0;

    return { summary, details };
  }

  async getInventoryReport(tenantId: string) {
    const products = await this.productRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });

    const summary = {
      totalValue: 0,
      totalItems: products.length,
      lowStockItems: 0,
      outOfStockItems: 0,
    };

    const details = products. map((product) => {
      const value = product.currentStock * product.costPrice;
      summary.totalValue += value;

      if (product.currentStock === 0) {
        summary.outOfStockItems++;
      } else if (product.currentStock <= product.minStockLevel) {
        summary.lowStockItems++;
      }

      return {
        productCode: product.code,
        productName: product.name,
        currentStock: product.currentStock,
        costPrice: product.costPrice,
        value,
        status: product.currentStock === 0 ? 'Hết hàng' : 
                product.currentStock <= product.minStockLevel ? 'Tồn kho thấp' : 'Bình thường',
      };
    });

    return { summary, details };
  }

  async exportToExcel(tenantId:  string, type: string): Promise<Buffer> {
    const workbook = new ExcelJS. Workbook();
    const worksheet = workbook.addWorksheet('Report');

    let data;
    switch (type) {
      case 'sales':
        data = await this.getSalesReport(tenantId, {});
        worksheet.columns = [
          { header: 'Số đơn hàng', key: 'orderNumber', width: 15 },
          { header: 'Ngày', key: 'orderDate', width: 12 },
          { header: 'Khách hàng', key: 'customerName', width: 25 },
          { header: 'Doanh thu', key: 'totalAmount', width: 15 },
          { header: 'Chi phí', key: 'cost', width: 15 },
          { header: 'Lợi nhuận', key: 'profit', width: 15 },
          { header: 'Tỷ suất LN', key: 'profitMargin', width: 12 },
        ];
        worksheet.addRows(data.details);
        break;
      
      case 'purchases':
        data = await this.getPurchaseReport(tenantId, {});
        worksheet.columns = [
          { header: 'Số đơn hàng', key: 'orderNumber', width:  15 },
          { header: 'Ngày', key: 'orderDate', width:  12 },
          { header: 'Nhà cung cấp', key: 'supplierName', width: 25 },
          { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
          { header: 'Trạng thái', key: 'status', width: 12 },
        ];
        worksheet. addRows(data.details);
        break;