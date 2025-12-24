import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from './warehouse.entity';

@Entity('product_batches')
export class ProductBatch {
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

  @Column({ name: 'batch_number', length: 100 })
  batchNumber: string;

  @Column({ name: 'lot_number', length: 100, nullable: true })
  lotNumber: string;

  @Column({ type: 'date', nullable: true })
  manufactured_date: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 18, scale: 2 })
  unitCost: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 18, scale: 2 })
  totalCost: number;

  @Column({ length: 50, default: 'available' })
  status: string; // available, reserved, expired, damaged

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
