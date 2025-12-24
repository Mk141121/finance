import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ example: 'company' })
  @IsString()
  @IsNotEmpty({ message: 'Category không được để trống' })
  category: string;

  @ApiProperty({ example: 'info' })
  @IsString()
  @IsNotEmpty({ message: 'Key không được để trống' })
  key: string;

  @ApiProperty({
    example: {
      name: 'Công ty TNHH ABC',
      tax_code: '0123456789',
      address: '123 Đường ABC',
    },
  })
  @IsObject()
  @IsNotEmpty({ message: 'Value không được để trống' })
  value: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSettingDto {
  @ApiProperty()
  @IsObject()
  @IsNotEmpty({ message: 'Value không được để trống' })
  value: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
