import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto, UpdateQuotationStatusDto } from './dto/update-quotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  create(@Body() createQuotationDto: CreateQuotationDto, @Request() req) {
    return this.quotationsService.create(
      createQuotationDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.quotationsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.quotationsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateQuotationDto: UpdateQuotationDto,
    @Request() req,
  ) {
    return this.quotationsService.update(
      id,
      updateQuotationDto,
      req.user.tenantId,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateQuotationStatusDto,
    @Request() req,
  ) {
    return this.quotationsService.updateStatus(
      id,
      updateStatusDto.status,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.quotationsService.remove(id, req.user.tenantId);
  }

  @Post('check-expired')
  checkExpired(@Request() req) {
    return this.quotationsService.checkExpiredQuotations(req.user.tenantId);
  }
}
