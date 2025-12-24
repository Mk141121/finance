import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  type: string; // individual, company

  @Column({ name: 'tax_code', nullable: true })
  taxCode: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  address: string;

  @Column({ name: 'receivable_account', default: '131' })
  receivableAccount: string;

  @Column({ name: 'payment_terms', nullable: true })
  paymentTerms: string;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 18, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}
