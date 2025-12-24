import { PartialType } from '@nestjs/mapped-types';
import { CreateQuotationDto } from './create-quotation.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { QuotationStatus } from '../quotation.entity';

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {}

export class UpdateQuotationStatusDto {
  @IsEnum(QuotationStatus)
  status: QuotationStatus;
}
