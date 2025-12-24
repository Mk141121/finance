import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('accounting')
@ApiBearerAuth()
@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ==================== CHART OF ACCOUNTS ====================
  @Get('chart-of-accounts')
  @ApiOperation({ summary: 'Lấy hệ thống tài khoản dạng cây (TT133/2016)' })
  getChartOfAccounts(@Request() req) {
    return this.accountingService.getChartOfAccounts(req.user.tenantId);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Lấy danh sách tài khoản' })
  findAllAccounts(@Request() req) {
    return this.accountingService.findAllAccounts(req.user.tenantId);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết tài khoản' })
  getAccount(@Param('id') id: string, @Request() req) {
    return this.accountingService.getAccount(id, req.user.tenantId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Tạo tài khoản kế toán mới' })
  createAccount(@Body() dto: CreateAccountDto, @Request() req) {
    return this.accountingService.createAccount(dto, req.user.tenantId, req.user.userId);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Cập nhật tài khoản kế toán' })
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto, @Request() req) {
    return this.accountingService.updateAccount(id, dto, req.user.tenantId, req.user.userId);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Xóa tài khoản kế toán' })
  deleteAccount(@Param('id') id: string, @Request() req) {
    return this.accountingService.deleteAccount(id, req.user.tenantId);
  }

  @Get('accounts/:code/by-code')
  @ApiOperation({ summary: 'Lấy tài khoản theo mã' })
  findAccountByCode(@Param('code') code: string, @Request() req) {
    return this.accountingService.findAccountByCode(req.user.tenantId, code);
  }

  // ==================== JOURNAL ENTRIES ====================
  @Post('journal-entries')
  @ApiOperation({ summary: 'Tạo bút toán kế toán' })
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
  @ApiOperation({ summary: 'Lấy danh sách bút toán' })
  findAllJournalEntries(@Request() req) {
    return this.accountingService.findAllJournalEntries(req.user.tenantId);
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Lấy chi tiết bút toán' })
  findOneJournalEntry(@Param('id') id: string, @Request() req) {
    return this.accountingService.findOneJournalEntry(id, req.user.tenantId);
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Ghi sổ bút toán' })
  postJournalEntry(@Param('id') id: string, @Request() req) {
    return this.accountingService.postJournalEntry(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete('journal-entries/:id')
  @ApiOperation({ summary: 'Xóa bút toán' })
  deleteJournalEntry(@Param('id') id: string, @Request() req) {
    return this.accountingService.deleteJournalEntry(id, req.user.tenantId);
  }
}
