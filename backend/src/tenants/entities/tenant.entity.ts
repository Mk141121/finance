import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { UserTenant } from './user-tenant.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'company_name_short', nullable: true })
  companyNameShort: string;

  @Column({ name: 'tax_code', unique: true })
  taxCode: string;

  @Column({ unique: true, nullable: true })
  subdomain: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  representative: string;

  // Subscription
  @Column({ name: 'subscription_plan', default: 'trial' })
  subscriptionPlan: string;

  @Column({ name: 'subscription_status', default: 'active' })
  subscriptionStatus: string;

  @Column({ name: 'subscription_started_at', type: 'timestamp', nullable: true })
  subscriptionStartedAt: Date;

  @Column({ name: 'subscription_ends_at', type: 'timestamp', nullable: true })
  subscriptionEndsAt: Date;

  // Limits
  @Column({ name: 'max_users', default: 5 })
  maxUsers: number;

  @Column({ name: 'max_products', default: 1000 })
  maxProducts: number;

  @Column({ name: 'max_transactions_per_month', default: 1000 })
  maxTransactionsPerMonth: number;

  // Settings
  @Column({ name: 'accounting_standard', default: 'TT133' })
  accountingStandard: string;

  @Column({ name: 'fiscal_year_start_month', default: 1 })
  fiscalYearStartMonth: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  // Status
  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => UserTenant, (userTenant) => userTenant.tenant)
  userTenants: UserTenant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
