import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  type: string; // product, service, material

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ name: 'unit_id', nullable: true })
  unitId: string;

  @Column({ name: 'sale_price', type: 'decimal', precision: 18, scale: 2, default: 0 })
  salePrice: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 18, scale: 2, default: 0 })
  costPrice: number;

  @Column({ name: 'vat_rate', type: 'decimal', precision: 5, scale: 2, default: 10 })
  vatRate: number;

  @Column({ name: 'revenue_account', nullable: true })
  revenueAccount: string;

  @Column({ name: 'cogs_account', nullable: true })
  cogsAccount: string;

  @Column({ name: 'inventory_account', nullable: true })
  inventoryAccount: string;

  @Column({ name: 'manage_inventory', default: true })
  manageInventory: boolean;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}
