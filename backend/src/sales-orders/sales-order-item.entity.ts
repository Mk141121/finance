import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { Product } from '../products/entities/product.entity';

@Entity('sales_order_items')
export class SalesOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'sales_order_id', type: 'uuid' })
  salesOrderId: string;

  @ManyToOne(() => SalesOrder, (salesOrder) => salesOrder.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder: SalesOrder;

  @Column({ name: 'line_number', type: 'int' })
  lineNumber: number;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'quantity_ordered', type: 'decimal', precision: 18, scale: 4 })
  quantityOrdered: number;

  @Column({ name: 'quantity_delivered', type: 'decimal', precision: 18, scale: 4, default: 0 })
  quantityDelivered: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 18, scale: 2 })
  unitPrice: number;

  @Column({ name: 'discount_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 10 })
  taxRate: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ name: 'line_total', type: 'decimal', precision: 18, scale: 2 })
  lineTotal: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
