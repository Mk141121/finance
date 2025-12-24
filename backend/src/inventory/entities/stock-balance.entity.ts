import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from './warehouse.entity';

@Entity('stock_balances')
export class StockBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  quantity: number;

  @Column({ name: 'reserved_quantity', type: 'decimal', precision: 18, scale: 4, default: 0 })
  reservedQuantity: number;

  @Column({ name: 'available_quantity', type: 'decimal', precision: 18, scale: 4, default: 0 })
  availableQuantity: number;

  @Column({ name: 'average_cost', type: 'decimal', precision: 18, scale: 2, default: 0 })
  averageCost: number;

  @Column({ name: 'total_value', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalValue: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;
}
