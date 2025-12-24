import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

@Entity('chart_of_accounts')
export class ChartOfAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'account_code', length: 50 })
  accountCode: string;

  @Column({ name: 'account_name', length: 255 })
  accountName: string;

  @Column({ name: 'account_name_en', length: 255, nullable: true })
  accountNameEn: string;

  @Column({
    name: 'account_type',
    type: 'enum',
    enum: AccountType,
  })
  accountType: AccountType;

  @Column({ name: 'account_category', length: 50, nullable: true })
  accountCategory: string;

  @Column({ type: 'int' })
  level: number;

  @Column({ name: 'parent_code', length: 20, nullable: true })
  parentCode: string;

  @Column({ name: 'is_detail', default: false })
  isDetail: boolean;

  @Column({ name: 'normal_balance', length: 10, default: 'debit' })
  normalBalance: string; // debit, credit

  @Column({ name: 'accounting_standard', length: 20, default: 'both' })
  accountingStandard: string; // TT133, TT200, both

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
