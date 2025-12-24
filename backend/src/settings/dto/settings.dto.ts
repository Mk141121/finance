import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({ example: 'Công ty TNHH ABC', description: 'Tên công ty' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: '0123456789', description: 'Mã số thuế' })
  @IsOptional()
  @IsString()
  taxCode?: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Huệ, Q1, TP.HCM', description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Hồ Chí Minh', description: 'Thành phố' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '0987654321', description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@company.vn', description: 'Email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'https://company.vn', description: 'Website' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Người đại diện pháp luật' })
  @IsOptional()
  @IsString()
  legalRepresentative?: string;

  @ApiPropertyOptional({ description: 'Logo công ty (URL hoặc base64)' })
  @IsOptional()
  @IsString()
  logo?: string;
}

export class UpdateTaxSettingsDto {
  @ApiPropertyOptional({ example: 10, description: 'Thuế suất VAT mặc định (%)' })
  @IsOptional()
  @IsNumber()
  defaultVatRate?: number;

  @ApiPropertyOptional({ example: 'deduction', description: 'Phương pháp tính thuế: deduction/direct' })
  @IsOptional()
  @IsString()
  vatMethod?: string;

  @ApiPropertyOptional({ example: true, description: 'Bật hóa đơn điện tử' })
  @IsOptional()
  @IsBoolean()
  eInvoiceEnabled?: boolean;

  @ApiPropertyOptional({ example: 'VNPT', description: 'Nhà cung cấp hóa đơn điện tử' })
  @IsOptional()
  @IsString()
  eInvoiceProvider?: string;

  @ApiPropertyOptional({ description: 'Tên đăng nhập nhà cung cấp' })
  @IsOptional()
  @IsString()
  providerUsername?: string;

  @ApiPropertyOptional({ description: 'Mật khẩu nhà cung cấp' })
  @IsOptional()
  @IsString()
  providerPassword?: string;

  @ApiPropertyOptional({ example: 'C24TAA', description: 'Ký hiệu hóa đơn' })
  @IsOptional()
  @IsString()
  invoiceSeries?: string;

  @ApiPropertyOptional({ example: '01GTKT0/001', description: 'Mẫu số hóa đơn' })
  @IsOptional()
  @IsString()
  templateCode?: string;
}

export class UpdateInvoiceSettingsDto {
  @ApiPropertyOptional({ example: 'template1', description: 'Mẫu hóa đơn' })
  @IsOptional()
  @IsString()
  invoiceTemplate?: string;

  @ApiPropertyOptional({ example: 'INV', description: 'Tiền tố số hóa đơn' })
  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @ApiPropertyOptional({ example: 1, description: 'Số hóa đơn bắt đầu' })
  @IsOptional()
  @IsNumber()
  invoiceStartNumber?: number;

  @ApiPropertyOptional({ example: true, description: 'Tự động gửi email' })
  @IsOptional()
  @IsBoolean()
  autoSendEmail?: boolean;

  @ApiPropertyOptional({ description: 'Chữ ký (URL hoặc base64)' })
  @IsOptional()
  @IsString()
  signatureImage?: string;

  @ApiPropertyOptional({ example: 30, description: 'Số ngày thanh toán mặc định' })
  @IsOptional()
  @IsNumber()
  defaultPaymentDays?: number;
}

export class UpdateSystemSettingsDto {
  @ApiPropertyOptional({ example: 'VND', description: 'Đơn vị tiền tệ' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'vi', description: 'Ngôn ngữ: vi/en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'DD/MM/YYYY', description: 'Định dạng ngày' })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({ example: 1, description: 'Tháng bắt đầu năm tài chính (1-12)' })
  @IsOptional()
  @IsNumber()
  fiscalYearStart?: number;

  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh', description: 'Múi giờ' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 2, description: 'Số chữ số thập phân' })
  @IsOptional()
  @IsNumber()
  decimalPlaces?: number;

  @ApiPropertyOptional({ example: true, description: 'Bật chế độ sao lưu tự động' })
  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;
}
