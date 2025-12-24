import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { StockTransactionItem } from './stock-transaction-item.entity';

export enum StockTransactionType {
  IN = 'in',           // Nhập kho
  OUT = 'out',         // Xuất kho
  ADJUSTMENT = 'adjustment', // Điều chỉnh
  TRANSFER = 'transfer',    // Chuyển kho
  RETURN = 'return',        // Trả hàng
}

export enum StockTransactionSource {
  PURCHASE = 'purchase',        // Từ đơn mua
  SALES = 'sales',              // Từ đơn bán
  PRODUCTION = 'production',    // Từ sản xuất
  ADJUSTMENT = 'adjustment',    // Điều chỉnh thủ công
  TRANSFER = 'transfer',        // Chuyển kho
  RETURN = 'return',           // Trả hàng
}

@Entity('stock_transactions')
export class StockTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 50 })
  code: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: StockTransactionType,
  })
  type: StockTransactionType;

  @Column({
    type: 'enum',
    enum: StockTransactionSource,
  })
  source: StockTransactionSource;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ name: 'reference_type', length: 50, nullable: true })
  referenceType: string; // sales_order, purchase_order, etc.

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 50, default: 'draft' })
  status: string; // draft, confirmed, cancelled

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
  confirmedBy: string;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => StockTransactionItem, (item) => item.transaction, { cascade: true })
  items: StockTransactionItem[];
}
