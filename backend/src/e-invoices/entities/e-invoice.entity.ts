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
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { SalesOrder } from '../../sales-orders/sales-order.entity';
import { EInvoiceItem } from './e-invoice-item.entity';

export enum InvoiceType {
  VAT_INVOICE = 'vat_invoice', // Hóa đơn GTGT
  SALES_INVOICE = 'sales_invoice', // Hóa đơn bán hàng
  EXPORT_INVOICE = 'export_invoice', // Hóa đơn xuất khẩu
  ADJUSTMENT_INVOICE = 'adjustment_invoice', // Hóa đơn điều chỉnh
  REPLACEMENT_INVOICE = 'replacement_invoice', // Hóa đơn thay thế
}

export enum InvoiceStatus {
  DRAFT = 'draft', // Nháp
  ISSUED = 'issued', // Đã phát hành
  SENT = 'sent', // Đã gửi khách hàng
  SIGNED = 'signed', // Đã ký số
  CANCELLED = 'cancelled', // Đã hủy
  REPLACED = 'replaced', // Đã thay thế
}

export enum PaymentMethod {
  CASH = 'cash', // Tiền mặt
  BANK_TRANSFER = 'bank_transfer', // Chuyển khoản
  CREDIT_CARD = 'credit_card', // Thẻ tín dụng
  COD = 'cod', // Thu hộ (COD)
  OTHER = 'other', // Khác
}

@Entity('e_invoices')
export class EInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Invoice identification
  @Column({ name: 'invoice_number', type: 'varchar', length: 50 })
  invoiceNumber: string; // Số hóa đơn: 0000001, 0000002...

  @Column({ name: 'invoice_series', type: 'varchar', length: 20 })
  invoiceSeries: string; // Ký hiệu hóa đơn: C24TAA

  @Column({ name: 'template_code', type: 'varchar', length: 20 })
  templateCode: string; // Mẫu số: 01GTKT0/001

  @Column({ name: 'invoice_type', type: 'varchar', length: 30 })
  invoiceType: InvoiceType;

  @Column({ name: 'invoice_status', type: 'varchar', length: 20, default: InvoiceStatus.DRAFT })
  invoiceStatus: InvoiceStatus;

  // Dates
  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: Date; // Ngày hóa đơn

  @Column({ name: 'issue_date', type: 'timestamp', nullable: true })
  issueDate: Date; // Ngày phát hành

  @Column({ name: 'signed_date', type: 'timestamp', nullable: true })
  signedDate: Date; // Ngày ký số

  // Customer information
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_name', type: 'varchar', length: 255 })
  customerName: string; // Tên người mua

  @Column({ name: 'customer_tax_code', type: 'varchar', length: 20, nullable: true })
  customerTaxCode: string; // Mã số thuế

  @Column({ name: 'customer_address', type: 'text', nullable: true })
  customerAddress: string;

  @Column({ name: 'customer_email', type: 'varchar', length: 255, nullable: true })
  customerEmail: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 20, nullable: true })
  customerPhone: string;

  // Buyer information (if different from customer)
  @Column({ name: 'buyer_name', type: 'varchar', length: 255, nullable: true })
  buyerName: string; // Người mua hàng

  // Payment information
  @Column({ name: 'payment_method', type: 'varchar', length: 20, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Column({ name: 'bank_account', type: 'varchar', length: 50, nullable: true })
  bankAccount: string; // Số tài khoản ngân hàng

  @Column({ name: 'bank_name', type: 'varchar', length: 255, nullable: true })
  bankName: string; // Tên ngân hàng

  // Amounts
  @Column({ name: 'subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number; // Tổng tiền hàng (chưa VAT)

  @Column({ name: 'discount_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number; // Chiết khấu

  @Column({ name: 'tax_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount: number; // Tiền thuế GTGT

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number; // Tổng tiền thanh toán

  @Column({ name: 'amount_in_words', type: 'varchar', length: 500, nullable: true })
  amountInWords: string; // Số tiền bằng chữ

  // Currency
  @Column({ name: 'currency_code', type: 'varchar', length: 3, default: 'VND' })
  currencyCode: string;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 15, scale: 6, default: 1 })
  exchangeRate: number;

  // Notes
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string; // Ghi chú

  // Digital signature
  @Column({ name: 'xml_file_path', type: 'varchar', length: 500, nullable: true })
  xmlFilePath: string; // Đường dẫn file XML

  @Column({ name: 'signed_xml_file_path', type: 'varchar', length: 500, nullable: true })
  signedXmlFilePath: string; // Đường dẫn file XML đã ký

  @Column({ name: 'signature', type: 'text', nullable: true })
  signature: string; // Chữ ký số

  @Column({ name: 'signer_name', type: 'varchar', length: 255, nullable: true })
  signerName: string; // Người ký

  @Column({ name: 'lookup_code', type: 'varchar', length: 100, nullable: true })
  lookupCode: string; // Mã tra cứu hóa đơn

  // Source reference
  @Column({ name: 'sales_order_id', type: 'uuid', nullable: true })
  salesOrderId: string;

  @ManyToOne(() => SalesOrder, { nullable: true })
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder: SalesOrder;

  // Replacement/Adjustment references
  @Column({ name: 'original_invoice_id', type: 'uuid', nullable: true })
  originalInvoiceId: string; // ID hóa đơn gốc (nếu là hóa đơn thay thế/điều chỉnh)

  @ManyToOne(() => EInvoice, { nullable: true })
  @JoinColumn({ name: 'original_invoice_id' })
  originalInvoice: EInvoice;

  @Column({ name: 'replacement_reason', type: 'text', nullable: true })
  replacementReason: string; // Lý do thay thế/điều chỉnh

  // Items
  @OneToMany(() => EInvoiceItem, (item) => item.invoice, { cascade: true })
  items: EInvoiceItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
