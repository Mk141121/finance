import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'KH001' })
  @IsString()
  @IsNotEmpty({ message: 'Mã khách hàng không được để trống' })
  code: string;

  @ApiProperty({ example: 'Công ty TNHH XYZ' })
  @IsString()
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  name: string;

  @ApiProperty({ example: 'company', enum: ['individual', 'company'] })
  @IsString()
  @IsIn(['individual', 'company'])
  type: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  taxCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ default: '131' })
  @IsString()
  @IsOptional()
  receivableAccount?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsIn(['individual', 'company'])
  @IsOptional()
  type?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  taxCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  receivableAccount?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;
}
