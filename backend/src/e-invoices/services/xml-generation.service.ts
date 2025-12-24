import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { EInvoice } from '../entities/e-invoice.entity';

/**
 * XML Generation Service for Vietnamese E-Invoice
 * Follows TCVN (Tiêu chuẩn Việt Nam) format for electronic invoices
 * Compliant with Decree 123/2020/NĐ-CP
 */
@Injectable()
export class XmlGenerationService {
  /**
   * Generate XML invoice following TCVN format
   */
  generateInvoiceXml(invoice: EInvoice): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('HDon', {
        'xmlns': 'http://khoabac.gdt.gov.vn/TKhac/TDTu/HDDT',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      });

    // Invoice header (DLHDon)
    const dlhdon = doc.ele('DLHDon');
    
    // TTChung - General information
    const ttchung = dlhdon.ele('TTChung');
    ttchung.ele('PBan').txt('2.0.0'); // Phiên bản
    ttchung.ele('THDon').txt(this.getInvoiceTypeCode(invoice.invoiceType)); // Loại hóa đơn
    ttchung.ele('KHMSHDon').txt(invoice.templateCode); // Ký hiệu mẫu số
    ttchung.ele('KHHDon').txt(invoice.invoiceSeries); // Ký hiệu hóa đơn
    ttchung.ele('SHDon').txt(invoice.invoiceNumber); // Số hóa đơn
    ttchung.ele('NLap').txt(this.formatDate(invoice.invoiceDate)); // Ngày lập
    ttchung.ele('DVTTe').txt(invoice.currencyCode || 'VND'); // Đơn vị tiền tệ
    if (invoice.exchangeRate && invoice.exchangeRate !== 1) {
      ttchung.ele('TGia').txt(invoice.exchangeRate.toString()); // Tỷ giá
    }

    // TTKhac - Other information
    if (invoice.notes || invoice.lookupCode) {
      const ttkhac = dlhdon.ele('TTKhac');
      if (invoice.lookupCode) {
        ttkhac.ele('TTin').ele('TTruong').txt('Mã tra cứu');
        ttkhac.ele('KDLieu').txt('string');
        ttkhac.ele('DLieu').txt(invoice.lookupCode);
      }
      if (invoice.notes) {
        ttkhac.ele('TTin').ele('TTruong').txt('Ghi chú');
        ttkhac.ele('KDLieu').txt('string');
        ttkhac.ele('DLieu').txt(invoice.notes);
      }
    }

    // NDHDon - Invoice content
    const ndhdon = dlhdon.ele('NDHDon');

    // NBan - Seller information
    const nban = ndhdon.ele('NBan');
    nban.ele('Ten').txt('Công ty TNHH ABC'); // TODO: Get from company settings
    nban.ele('MST').txt('0123456789'); // TODO: Get from company settings
    nban.ele('DChi').txt('Địa chỉ công ty'); // TODO: Get from company settings

    // NMua - Buyer information
    const nmua = ndhdon.ele('NMua');
    nmua.ele('Ten').txt(invoice.customerName);
    if (invoice.customerTaxCode) {
      nmua.ele('MST').txt(invoice.customerTaxCode);
    }
    if (invoice.customerAddress) {
      nmua.ele('DChi').txt(invoice.customerAddress);
    }
    if (invoice.buyerName) {
      nmua.ele('HVTNMHang').txt(invoice.buyerName); // Họ và tên người mua hàng
    }
    if (invoice.customerEmail) {
      nmua.ele('DCTDTu').txt(invoice.customerEmail);
    }

    // DSHHDVu - List of goods/services
    const dshhd = ndhdon.ele('DSHHDVu');
    
    invoice.items.forEach((item, index) => {
      const hhdvu = dshhd.ele('HHDVu');
      hhdvu.ele('STT').txt((index + 1).toString()); // Line number
      if (item.productCode) {
        hhdvu.ele('MHHDVu').txt(item.productCode); // Product code
      }
      hhdvu.ele('THHDVu').txt(item.productName); // Product name
      if (item.unit) {
        hhdvu.ele('DVTinh').txt(item.unit); // Unit
      }
      hhdvu.ele('SLuong').txt(item.quantity.toString()); // Quantity
      hhdvu.ele('DGia').txt(item.unitPrice.toString()); // Unit price
      hhdvu.ele('TLCKhau').txt(item.discountRate?.toString() || '0'); // Discount rate
      hhdvu.ele('STCKhau').txt(item.discountAmount?.toString() || '0'); // Discount amount
      hhdvu.ele('ThTien').txt(item.lineAmount.toString()); // Line amount
      hhdvu.ele('TSuat').txt(this.formatTaxRate(item.taxRate)); // Tax rate
      hhdvu.ele('TThue').txt(item.taxAmount.toString()); // Tax amount
    });

    // TToan - Payment information
    const ttoan = ndhdon.ele('TToan');
    ttoan.ele('THTTLTSuat'); // Tax breakdown by rates
    
    // Group items by tax rate
    const taxGroups = this.groupItemsByTaxRate(invoice.items);
    taxGroups.forEach(group => {
      const ltsuat = ttoan.ele('LTSuat');
      ltsuat.ele('TSuat').txt(this.formatTaxRate(group.taxRate));
      ltsuat.ele('ThTien').txt(group.lineAmount.toString());
      ltsuat.ele('TThue').txt(group.taxAmount.toString());
    });

    // Total amounts
    ttoan.ele('TgTCThue').txt(invoice.subtotal.toString()); // Total before tax
    ttoan.ele('TgTThue').txt(invoice.taxAmount.toString()); // Total tax
    if (invoice.discountAmount > 0) {
      ttoan.ele('TgTCKTMai').txt(invoice.discountAmount.toString()); // Total discount
    }
    ttoan.ele('TgTTTBSo').txt(invoice.totalAmount.toString()); // Total amount (number)
    if (invoice.amountInWords) {
      ttoan.ele('TgTTTBChu').txt(invoice.amountInWords); // Total amount (words)
    }

    // Payment method
    ttoan.ele('HTThToan').txt(this.getPaymentMethodName(invoice.paymentMethod));
    if (invoice.bankAccount) {
      ttoan.ele('STKNHang').txt(invoice.bankAccount);
      if (invoice.bankName) {
        ttoan.ele('TNHang').txt(invoice.bankName);
      }
    }

    return doc.end({ prettyPrint: true });
  }

  /**
   * Get invoice type code for XML
   */
  private getInvoiceTypeCode(type: string): string {
    const typeMap = {
      vat_invoice: '01GTKT', // Hóa đơn GTGT
      sales_invoice: '02GTTT', // Hóa đơn bán hàng
      export_invoice: '04HGDL', // Hóa đơn xuất khẩu
      adjustment_invoice: '05ĐCHĐ', // Hóa đơn điều chỉnh
      replacement_invoice: '06TTHĐ', // Hóa đơn thay thế
    };
    return typeMap[type] || '01GTKT';
  }

  /**
   * Format date to DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format tax rate for XML (0%, 5%, 8%, 10%, KCT, KKKNT)
   */
  private formatTaxRate(rate: number): string {
    if (rate === 0) return 'KCT'; // Không chịu thuế
    if (rate === -1) return 'KKKNT'; // Không kê khai không nộp thuế
    return `${rate}%`;
  }

  /**
   * Group invoice items by tax rate
   */
  private groupItemsByTaxRate(items: any[]): Array<{ taxRate: number; lineAmount: number; taxAmount: number }> {
    const groups = new Map<number, { lineAmount: number; taxAmount: number }>();
    
    items.forEach(item => {
      const existing = groups.get(item.taxRate) || { lineAmount: 0, taxAmount: 0 };
      existing.lineAmount += parseFloat(item.lineAmount.toString());
      existing.taxAmount += parseFloat(item.taxAmount.toString());
      groups.set(item.taxRate, existing);
    });

    return Array.from(groups.entries()).map(([taxRate, values]) => ({
      taxRate,
      ...values,
    }));
  }

  /**
   * Get payment method name in Vietnamese
   */
  private getPaymentMethodName(method: string): string {
    const methodMap = {
      cash: 'Tiền mặt',
      bank_transfer: 'Chuyển khoản',
      credit_card: 'Thẻ tín dụng',
      cod: 'Thu hộ (COD)',
      other: 'Khác',
    };
    return methodMap[method] || 'Tiền mặt';
  }
}
