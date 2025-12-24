import { IsString, IsDateString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SalesOrderStatus } from '../sales-order.entity';

export class CreateSalesOrderItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  quantityOrdered: number;

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

export class CreateSalesOrderDto {
  @IsString()
  code: string;

  @IsDateString()
  date: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

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
  paymentMethod?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items: CreateSalesOrderItemDto[];
}
