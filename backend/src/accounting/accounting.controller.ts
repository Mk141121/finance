import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ==================== CHART OF ACCOUNTS ====================
  @Get('accounts')
  findAllAccounts(@Request() req) {
    return this.accountingService.findAllAccounts(req.user.tenantId);
  }

  @Get('accounts/:code')
  findAccountByCode(@Param('code') code: string, @Request() req) {
    return this.accountingService.findAccountByCode(req.user.tenantId, code);
  }

  // ==================== JOURNAL ENTRIES ====================
  @Post('journal-entries')
  createJournalEntry(
    @Body() createDto: CreateJournalEntryDto,
    @Request() req,
  ) {
    return this.accountingService.createJournalEntry(
      createDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get('journal-entries')
  findAllJournalEntries(@Request() req) {
    return this.accountingService.findAllJournalEntries(req.user.tenantId);
  }

  @Get('journal-entries/:id')
  findOneJournalEntry(@Param('id') id: string, @Request() req) {
    return this.accountingService.findOneJournalEntry(id, req.user.tenantId);
  }

  @Post('journal-entries/:id/post')
  postJournalEntry(@Param('id') id: string, @Request() req) {
    return this.accountingService.postJournalEntry(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete('journal-entries/:id')
  deleteJournalEntry(@Param('id') id: string, @Request() req) {
    return this.accountingService.deleteJournalEntry(id, req.user.tenantId);
  }
}
