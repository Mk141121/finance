import { IsNotEmpty, IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  @IsString()
  @MaxLength(255)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyNameShort?: string;

  @IsNotEmpty({ message: 'Mã số thuế không được để trống' })
  @IsString()
  @MaxLength(20)
  taxCode: string;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  representative?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyNameShort?: string;

  @IsOptional()
  @IsString()
  taxCode?: string;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  representative?: string;

  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @IsOptional()
  @IsString()
  accountingStandard?: string;
}
