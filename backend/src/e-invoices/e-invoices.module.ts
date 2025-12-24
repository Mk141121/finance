import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EInvoice } from './entities/e-invoice.entity';
import { EInvoiceItem } from './entities/e-invoice-item.entity';
import { EInvoicesController } from './e-invoices.controller';
import { EInvoicesService } from './services/e-invoices.service';
import { XmlGenerationService } from './services/xml-generation.service';
import { DigitalSignatureService } from './services/digital-signature.service';

@Module({
  imports: [TypeOrmModule.forFeature([EInvoice, EInvoiceItem])],
  controllers: [EInvoicesController],
  providers: [
    EInvoicesService,
    XmlGenerationService,
    DigitalSignatureService,
  ],
  exports: [EInvoicesService],
})
export class EInvoicesModule {}
