import { IsString, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StockTransactionType, StockTransactionSource } from '../entities/stock-transaction.entity';

export class CreateStockTransactionItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateStockTransactionDto {
  @IsString()
  code: string;

  @IsDateString()
  date: string;

  @IsEnum(StockTransactionType)
  type: StockTransactionType;

  @IsEnum(StockTransactionSource)
  source: StockTransactionSource;

  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransactionItemDto)
  items: CreateStockTransactionItemDto[];
}
