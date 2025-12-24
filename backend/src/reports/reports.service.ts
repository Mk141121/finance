import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { PurchaseOrder } from '../purchase-orders/purchase-order.entity';
import { Product } from '../products/entities/product.entity';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getSalesReport(tenantId: string, query: any) {
    const { startDate, endDate } = query;

    const qb = this.salesOrderRepository
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('so.customer', 'customer')
      .where('so.tenantId = :tenantId', { tenantId })
      .orderBy('so.date', 'DESC');

    if (startDate && endDate) {
      qb.andWhere('so.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const orders = await qb.getMany();

    // Calculate summary
    const summary = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalOrders: orders.length,
      averageOrderValue: 0,
    };

    const details = orders.map((order) => {
      const cost = (order.items || []).reduce(
        (sum, item) => sum + (item.product?.costPrice || 0) * (item.quantityOrdered || 0),
        0,
      );
      const revenue = Number(order.total) || 0;
      const profit = revenue - cost;

      summary.totalRevenue += revenue;
      summary.totalCost += cost;
      summary.totalProfit += profit;

      return {
        orderNumber: order.code,
        orderDate: order.date,
        customerName: order.customer?.name || 'N/A',
        totalAmount: revenue,
        cost,
        profit,
        profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(2) + '%' : '0%',
        status: order.status,
      };
    });

    summary.averageOrderValue =
      orders.length > 0 ? summary.totalRevenue / orders.length : 0;

    return { summary, details };
  }

  async getPurchaseReport(tenantId: string, query: any) {
    const { startDate, endDate } = query;

    const qb = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.tenantId = :tenantId', { tenantId })
      .orderBy('po.date', 'DESC');

    if (startDate && endDate) {
      qb.andWhere('po.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const orders = await qb.getMany();

    const summary = {
      totalPurchaseValue: 0,
      totalOrders: orders.length,
      averageOrderValue: 0,
      supplierCount: new Set(orders.map((o) => o.supplierId)).size,
    };

    const details = orders.map((order) => {
      const totalAmount = Number(order.total) || 0;
      summary.totalPurchaseValue += totalAmount;

      return {
        orderNumber: order.code,
        orderDate: order.date,
        supplierName: order.supplier?.name || 'N/A',
        totalAmount,
        status: order.status,
      };
    });

    summary.averageOrderValue =
      orders.length > 0 ? summary.totalPurchaseValue / orders.length : 0;

    return { summary, details };
  }

  async getInventoryReport(tenantId: string) {
    const products = await this.productRepository
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .orderBy('p.name', 'ASC')
      .getMany();

    const summary = {
      totalValue: 0,
      totalItems: products.length,
      activeItems: 0,
      inactiveItems: 0,
    };

    const details = products.map((product) => {
      const costPrice = Number(product.costPrice) || 0;
      const salePrice = Number(product.salePrice) || 0;

      if (product.isActive) {
        summary.activeItems++;
      } else {
        summary.inactiveItems++;
      }

      return {
        productCode: product.code,
        productName: product.name,
        type: product.type,
        costPrice,
        salePrice,
        margin: salePrice > 0 ? ((salePrice - costPrice) / salePrice * 100).toFixed(2) + '%' : '0%',
        status: product.isActive ? 'Đang bán' : 'Ngừng bán',
      };
    });

    return { summary, details };
  }

  async exportToExcel(
    tenantId: string,
    type: string,
    query: any,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo');

    let data;
    switch (type) {
      case 'sales':
        data = await this.getSalesReport(tenantId, query);
        worksheet.columns = [
          { header: 'Số đơn hàng', key: 'orderNumber', width: 15 },
          { header: 'Ngày', key: 'orderDate', width: 12 },
          { header: 'Khách hàng', key: 'customerName', width: 25 },
          { header: 'Doanh thu', key: 'totalAmount', width: 15 },
          { header: 'Chi phí', key: 'cost', width: 15 },
          { header: 'Lợi nhuận', key: 'profit', width: 15 },
          { header: 'Tỷ suất LN', key: 'profitMargin', width: 12 },
          { header: 'Trạng thái', key: 'status', width: 12 },
        ];
        worksheet.addRows(data.details);
        break;

      case 'purchases':
        data = await this.getPurchaseReport(tenantId, query);
        worksheet.columns = [
          { header: 'Số đơn hàng', key: 'orderNumber', width: 15 },
          { header: 'Ngày', key: 'orderDate', width: 12 },
          { header: 'Nhà cung cấp', key: 'supplierName', width: 25 },
          { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
          { header: 'Trạng thái', key: 'status', width: 12 },
        ];
        worksheet.addRows(data.details);
        break;

      case 'inventory':
        data = await this.getInventoryReport(tenantId);
        worksheet.columns = [
          { header: 'Mã SP', key: 'productCode', width: 12 },
          { header: 'Tên sản phẩm', key: 'productName', width: 30 },
          { header: 'Loại', key: 'type', width: 12 },
          { header: 'Giá vốn', key: 'costPrice', width: 15 },
          { header: 'Giá bán', key: 'salePrice', width: 15 },
          { header: 'Biên lợi nhuận', key: 'margin', width: 15 },
          { header: 'Trạng thái', key: 'status', width: 15 },
        ];
        worksheet.addRows(data.details);
        break;

      default:
        throw new Error('Invalid report type');
    }

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportToPdf(
    tenantId: string,
    type: string,
    query: any,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Title
        doc.fontSize(20).text('BÁO CÁO', { align: 'center' });
        doc.moveDown();

        let data;
        switch (type) {
          case 'sales':
            data = await this.getSalesReport(tenantId, query);
            doc.fontSize(16).text('Báo cáo bán hàng', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Tổng doanh thu: ${data.summary.totalRevenue.toLocaleString('vi-VN')} VNĐ`);
            doc.text(`Tổng chi phí: ${data.summary.totalCost.toLocaleString('vi-VN')} VNĐ`);
            doc.text(`Tổng lợi nhuận: ${data.summary.totalProfit.toLocaleString('vi-VN')} VNĐ`);
            doc.text(`Số đơn hàng: ${data.summary.totalOrders}`);
            doc.moveDown();
            break;

          case 'purchases':
            data = await this.getPurchaseReport(tenantId, query);
            doc.fontSize(16).text('Báo cáo mua hàng', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Tổng giá trị mua: ${data.summary.totalPurchaseValue.toLocaleString('vi-VN')} VNĐ`);
            doc.text(`Số đơn hàng: ${data.summary.totalOrders}`);
            doc.text(`Số nhà cung cấp: ${data.summary.supplierCount}`);
            doc.moveDown();
            break;

          case 'inventory':
            data = await this.getInventoryReport(tenantId);
            doc.fontSize(16).text('Báo cáo sản phẩm', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Tổng sản phẩm: ${data.summary.totalItems}`);
            doc.text(`Sản phẩm đang bán: ${data.summary.activeItems}`);
            doc.text(`Sản phẩm ngừng bán: ${data.summary.inactiveItems}`);
            doc.moveDown();
            break;

          default:
            throw new Error('Invalid report type');
        }

        doc.fontSize(10).text('Chi tiết:', { underline: true });
        doc.moveDown(0.5);

        // Add table data (simplified)
        data.details.slice(0, 20).forEach((item: any, index: number) => {
          const line = type === 'sales' 
            ? `${index + 1}. ${item.orderNumber} - ${item.customerName} - ${item.totalAmount.toLocaleString('vi-VN')} VNĐ`
            : type === 'purchases'
            ? `${index + 1}. ${item.orderNumber} - ${item.supplierName} - ${item.totalAmount.toLocaleString('vi-VN')} VNĐ`
            : `${index + 1}. ${item.productCode} - ${item.productName} - ${item.salePrice.toLocaleString('vi-VN')} VNĐ`;
          doc.fontSize(9).text(line);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
