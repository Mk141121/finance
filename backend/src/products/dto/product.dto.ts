import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'SP001' })
  @IsString()
  @IsNotEmpty({ message: 'Mã sản phẩm không được để trống' })
  code: string;

  @ApiProperty({ example: 'Laptop Dell XPS 13' })
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name: string;

  @ApiProperty({ example: 'product', enum: ['product', 'service', 'material'] })
  @IsString()
  @IsIn(['product', 'service', 'material'], {
    message: 'Loại phải là: product, service, hoặc material',
  })
  type: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ example: 25000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiProperty({ example: 20000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  vatRate?: number;

  @ApiProperty({ example: '511' })
  @IsString()
  @IsOptional()
  revenueAccount?: string;

  @ApiProperty({ example: '632' })
  @IsString()
  @IsOptional()
  cogsAccount?: string;

  @ApiProperty({ example: '156' })
  @IsString()
  @IsOptional()
  inventoryAccount?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  manageInventory?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'Laptop Dell XPS 13' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'product', enum: ['product', 'service', 'material'] })
  @IsString()
  @IsIn(['product', 'service', 'material'])
  @IsOptional()
  type?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ example: 25000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiProperty({ example: 20000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  vatRate?: number;

  @ApiProperty({ example: '511' })
  @IsString()
  @IsOptional()
  revenueAccount?: string;

  @ApiProperty({ example: '632' })
  @IsString()
  @IsOptional()
  cogsAccount?: string;

  @ApiProperty({ example: '156' })
  @IsString()
  @IsOptional()
  inventoryAccount?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  manageInventory?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  isActive?: string;
}
