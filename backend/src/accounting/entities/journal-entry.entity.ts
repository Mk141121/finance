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
import { JournalEntryLine } from './journal-entry-line.entity';

export enum JournalEntryType {
  MANUAL = 'manual',
  AUTO_SALES = 'auto_sales',
  AUTO_PURCHASE = 'auto_purchase',
  AUTO_INVENTORY = 'auto_inventory',
  AUTO_PAYMENT = 'auto_payment',
  OPENING = 'opening',
  CLOSING = 'closing',
}

export enum JournalEntryStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
  REVERSED = 'reversed',
}

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'entry_number', length: 50 })
  entryNumber: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: Date;

  @Column({
    type: 'enum',
    enum: JournalEntryType,
    default: JournalEntryType.MANUAL,
  })
  type: JournalEntryType;

  @Column({
    type: 'enum',
    enum: JournalEntryStatus,
    default: JournalEntryStatus.DRAFT,
  })
  status: JournalEntryStatus;

  @Column({ name: 'fiscal_period_id', type: 'uuid', nullable: true })
  fiscalPeriodId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'reference_type', length: 50, nullable: true })
  referenceType: string; // sales_order, purchase_order, stock_transaction

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ name: 'total_debit', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalDebit: number;

  @Column({ name: 'total_credit', type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalCredit: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'posted_by', type: 'uuid', nullable: true })
  postedBy: string;

  @Column({ name: 'posted_at', type: 'timestamp', nullable: true })
  postedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => JournalEntryLine, (line) => line.journalEntry, { cascade: true })
  lines: JournalEntryLine[];
}
