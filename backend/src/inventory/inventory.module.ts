import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Warehouse } from './entities/warehouse.entity';
import { ProductBatch } from './entities/product-batch.entity';
import { StockTransaction } from './entities/stock-transaction.entity';
import { StockTransactionItem } from './entities/stock-transaction-item.entity';
import { StockBalance } from './entities/stock-balance.entity';
import { Adjustment, AdjustmentItem } from './entities/adjustment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Warehouse,
      ProductBatch,
      StockTransaction,
      StockTransactionItem,
      StockBalance,
      Adjustment,
      AdjustmentItem,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
