import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockTransaction } from './stock-transaction.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductBatch } from './product-batch.entity';

@Entity('stock_transaction_items')
export class StockTransactionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId: string;

  @ManyToOne(() => StockTransaction, (transaction) => transaction.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: StockTransaction;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId: string;

  @ManyToOne(() => ProductBatch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch: ProductBatch;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 18, scale: 2, nullable: true })
  unitCost: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalCost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
