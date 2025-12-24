import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsUUID, IsArray, ValidateNested, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType, PaymentMethod } from '../entities/e-invoice.entity';

export class CreateEInvoiceItemDto {
  @IsNumber()
  lineNumber: number;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  lineAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateEInvoiceDto {
  @IsString()
  invoiceSeries: string; // e.g., "C24TAA"

  @IsString()
  templateCode: string; // e.g., "01GTKT0/001"

  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @IsDateString()
  invoiceDate: string; // YYYY-MM-DD

  @IsUUID()
  customerId: string;

  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerTaxCode?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  buyerName?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  exchangeRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEInvoiceItemDto)
  items: CreateEInvoiceItemDto[];
}

export class UpdateEInvoiceDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerTaxCode?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  buyerName?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEInvoiceItemDto)
  items?: CreateEInvoiceItemDto[];
}

export class IssueEInvoiceDto {
  @IsString()
  signerName: string; // Người ký

  @IsOptional()
  @IsString()
  lookupCode?: string; // Mã tra cứu (nếu có)
}

export class ReplaceEInvoiceDto {
  @IsUUID()
  originalInvoiceId: string;

  @IsString()
  replacementReason: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEInvoiceItemDto)
  items: CreateEInvoiceItemDto[];
}

export class CancelEInvoiceDto {
  @IsString()
  reason: string; // Lý do hủy
}
