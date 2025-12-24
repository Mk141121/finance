import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EInvoice } from './e-invoice.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('e_invoice_items')
export class EInvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => EInvoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: EInvoice;

  @Column({ name: 'line_number', type: 'int' })
  lineNumber: number; // Số thứ tự dòng

  // Product information
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_code', type: 'varchar', length: 50, nullable: true })
  productCode: string; // Mã hàng

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName: string; // Tên hàng hóa, dịch vụ

  @Column({ name: 'unit', type: 'varchar', length: 50, nullable: true })
  unit: string; // Đơn vị tính

  @Column({ name: 'quantity', type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantity: number; // Số lượng

  @Column({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitPrice: number; // Đơn giá

  @Column({ name: 'line_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  lineAmount: number; // Thành tiền (chưa VAT)

  @Column({ name: 'discount_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number; // % Chiết khấu

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number; // Tiền chiết khấu

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number; // Thuế suất VAT (0%, 5%, 8%, 10%)

  @Column({ name: 'tax_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number; // Tiền thuế

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number; // Tổng cộng

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string; // Ghi chú

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
