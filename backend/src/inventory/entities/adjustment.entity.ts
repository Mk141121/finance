import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

export enum AdjustmentStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AdjustmentReason {
  DAMAGE = 'damage',
  LOSS = 'loss',
  FOUND = 'found',
  EXPIRED = 'expired',
  COUNTING = 'counting',
  OTHER = 'other',
}

@Entity('adjustments')
export class Adjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'adjustment_date', type: 'date' })
  adjustmentDate: Date;

  @Column({
    type: 'enum',
    enum: AdjustmentReason,
    default: AdjustmentReason.OTHER,
  })
  reason: AdjustmentReason;

  @Column({
    type: 'enum',
    enum: AdjustmentStatus,
    default: AdjustmentStatus.DRAFT,
  })
  status: AdjustmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'rejected_by', nullable: true })
  rejectedBy: string;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @OneToMany(() => AdjustmentItem, (item) => item.adjustment, {
    cascade: true,
  })
  items: AdjustmentItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('adjustment_items')
export class AdjustmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'adjustment_id' })
  adjustmentId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({ name: 'current_quantity', type: 'decimal', precision: 10, scale: 2 })
  currentQuantity: number;

  @Column({ name: 'adjusted_quantity', type: 'decimal', precision: 10, scale: 2 })
  adjustedQuantity: number;

  @Column({ name: 'batch_number', nullable: true })
  batchNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Adjustment, (adjustment) => adjustment.items)
  @JoinColumn({ name: 'adjustment_id' })
  adjustment: Adjustment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
