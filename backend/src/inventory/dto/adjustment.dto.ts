import { IsString, IsEnum, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum AdjustmentReason {
  DAMAGE = 'damage',
  LOSS = 'loss',
  FOUND = 'found',
  EXPIRED = 'expired',
  COUNTING = 'counting',
  OTHER = 'other',
}

class AdjustmentItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  warehouseId: string;

  @ApiProperty()
  @IsNumber()
  currentQuantity: number;

  @ApiProperty()
  @IsNumber()
  adjustedQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAdjustmentDto {
  @ApiProperty()
  @IsDateString()
  adjustmentDate: string;

  @ApiProperty({ enum: AdjustmentReason })
  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;

  @ApiProperty({ type: [AdjustmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjustmentItemDto)
  items: AdjustmentItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
