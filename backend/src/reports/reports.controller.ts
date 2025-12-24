import { Controller, Get, Query, Res, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Báo cáo bán hàng' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSalesReport(@Request() req, @Query() query: any) {
    const data = await this.reportsService.getSalesReport(req.user.tenantId, query);
    return { success: true, data };
  }

  @Get('purchases')
  @ApiOperation({ summary: 'Báo cáo mua hàng' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getPurchaseReport(@Request() req, @Query() query: any) {
    const data = await this.reportsService.getPurchaseReport(req.user.tenantId, query);
    return { success: true, data };
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Báo cáo tồn kho' })
  async getInventoryReport(@Request() req) {
    const data = await this.reportsService.getInventoryReport(req.user.tenantId);
    return { success: true, data };
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Xuất báo cáo Excel' })
  @ApiQuery({ name: 'type', enum: ['sales', 'purchases', 'inventory'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportExcel(
    @Request() req,
    @Query('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.reportsService.exportToExcel(
      req.user.tenantId,
      type,
      { startDate, endDate },
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${type}-${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Xuất báo cáo PDF' })
  @ApiQuery({ name: 'type', enum: ['sales', 'purchases', 'inventory'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportPdf(
    @Request() req,
    @Query('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.reportsService.exportToPdf(
      req.user.tenantId,
      type,
      { startDate, endDate },
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${type}-${Date.now()}.pdf`,
    );
    res.send(buffer);
  }
}
