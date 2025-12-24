import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export class CreateAccountDto {
  @ApiProperty({ example: '1111', description: 'Mã tài khoản theo TT133/2016' })
  @IsString()
  accountCode: string;

  @ApiProperty({ example: 'Tiền mặt', description: 'Tên tài khoản' })
  @IsString()
  accountName: string;

  @ApiProperty({ enum: AccountType, example: 'ASSET', description: 'Loại tài khoản' })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional({ example: '111', description: 'Mã tài khoản cha' })
  @IsOptional()
  @IsString()
  parentAccountCode?: string;

  @ApiPropertyOptional({ example: false, description: 'Có phải tài khoản tổng hợp không' })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Cấp độ tài khoản' })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiPropertyOptional({ description: 'Mô tả tài khoản' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAccountDto extends CreateAccountDto {}
