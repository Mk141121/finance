import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { ChartOfAccount } from './chart-of-account.entity';

@Entity('journal_entry_lines')
export class JournalEntryLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'journal_entry_id', type: 'uuid' })
  journalEntryId: string;

  @ManyToOne(() => JournalEntry, (entry) => entry.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry: JournalEntry;

  @Column({ name: 'line_number', type: 'int' })
  lineNumber: number;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @ManyToOne(() => ChartOfAccount)
  @JoinColumn({ name: 'account_id' })
  account: ChartOfAccount;

  @Column({ name: 'debit_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  debitAmount: number;

  @Column({ name: 'credit_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  creditAmount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'partner_type', length: 50, nullable: true })
  partnerType: string; // customer, supplier

  @Column({ name: 'partner_id', type: 'uuid', nullable: true })
  partnerId: string;
}
