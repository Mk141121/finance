import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { ChartOfAccount } from './entities/chart-of-account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JournalEntry,
      JournalEntryLine,
      ChartOfAccount,
    ]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
