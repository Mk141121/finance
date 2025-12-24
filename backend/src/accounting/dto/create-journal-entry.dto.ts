import { IsString, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JournalEntryType } from '../entities/journal-entry.entity';

export class CreateJournalEntryLineDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0)
  debitAmount: number;

  @IsNumber()
  @Min(0)
  creditAmount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  partnerType?: string;

  @IsOptional()
  @IsUUID()
  partnerId?: string;
}

export class CreateJournalEntryDto {
  @IsString()
  entryNumber: string;

  @IsDateString()
  entryDate: string;

  @IsOptional()
  @IsEnum(JournalEntryType)
  type?: JournalEntryType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalEntryLineDto)
  lines: CreateJournalEntryLineDto[];
}
