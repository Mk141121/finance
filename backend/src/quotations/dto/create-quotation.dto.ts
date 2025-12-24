import { IsString, IsDateString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationStatus } from '../quotation.entity';

export class CreateQuotationItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateQuotationDto {
  @IsString()
  code: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];
}
