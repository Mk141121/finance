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
import { Supplier } from '../suppliers/entities/supplier.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  CONFIRMED = 'confirmed',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Column({ name: 'expected_delivery_date', type: 'date', nullable: true })
  expectedDeliveryDate: Date;

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

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'received_at', type: 'timestamp', nullable: true })
  receivedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];
}
