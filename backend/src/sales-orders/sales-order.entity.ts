import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Quotation } from '../quotations/quotation.entity';
import { SalesOrderItem } from './sales-order-item.entity';

export enum SalesOrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'quotation_id', type: 'uuid', nullable: true })
  quotationId: string;

  @ManyToOne(() => Quotation, { nullable: true })
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.DRAFT,
  })
  status: SalesOrderStatus;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: Date;

  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'discount_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 10 })
  taxRate: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'payment_method', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ name: 'payment_status', length: 50, default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => SalesOrderItem, (item) => item.salesOrder, { cascade: true })
  items: SalesOrderItem[];
}
