import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EInvoicesService } from './services/e-invoices.service';
import {
  CreateEInvoiceDto,
  UpdateEInvoiceDto,
  IssueEInvoiceDto,
  ReplaceEInvoiceDto,
  CancelEInvoiceDto,
} from './dto/create-e-invoice.dto';

@Controller('e-invoices')
@UseGuards(JwtAuthGuard)
export class EInvoicesController {
  constructor(private readonly invoicesService: EInvoicesService) {}

  /**
   * Create a new draft e-invoice
   * POST /api/v1/e-invoices
   */
  @Post()
  async create(@Req() req, @Body() dto: CreateEInvoiceDto) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.create(tenantId, dto);
  }

  /**
   * Get all e-invoices
   * GET /api/v1/e-invoices
   */
  @Get()
  async findAll(@Req() req) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.findAll(tenantId);
  }

  /**
   * Get one e-invoice by ID
   * GET /api/v1/e-invoices/:id
   */
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.findOne(tenantId, id);
  }

  /**
   * Update draft e-invoice
   * PUT /api/v1/e-invoices/:id
   */
  @Put(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateEInvoiceDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.update(tenantId, id, dto);
  }

  /**
   * Issue e-invoice (generate XML and sign)
   * POST /api/v1/e-invoices/:id/issue
   */
  @Post(':id/issue')
  async issue(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: IssueEInvoiceDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.issue(tenantId, id, dto);
  }

  /**
   * Send e-invoice to customer
   * POST /api/v1/e-invoices/:id/send
   */
  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  async send(@Req() req, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.send(tenantId, id);
  }

  /**
   * Cancel e-invoice
   * POST /api/v1/e-invoices/:id/cancel
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: CancelEInvoiceDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.cancel(tenantId, id, dto);
  }

  /**
   * Replace e-invoice
   * POST /api/v1/e-invoices/:id/replace
   */
  @Post(':id/replace')
  async replace(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: ReplaceEInvoiceDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.replace(tenantId, id, dto);
  }

  /**
   * Delete draft e-invoice
   * DELETE /api/v1/e-invoices/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    await this.invoicesService.remove(tenantId, id);
  }

  /**
   * Download XML file
   * GET /api/v1/e-invoices/:id/xml
   */
  @Get(':id/xml')
  @Header('Content-Type', 'application/xml')
  async downloadXml(@Req() req, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.downloadXml(tenantId, id, false);
  }

  /**
   * Download signed XML file
   * GET /api/v1/e-invoices/:id/xml/signed
   */
  @Get(':id/xml/signed')
  @Header('Content-Type', 'application/xml')
  async downloadSignedXml(@Req() req, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.invoicesService.downloadXml(tenantId, id, true);
  }
}
