import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SalesOrder } from '../sales-orders/sales-order.entity';
import { EInvoice } from '../e-invoices/entities/e-invoice.entity';
import { Product } from '../products/entities/product.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(EInvoice)
    private readonly eInvoiceRepository: Repository<EInvoice>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getStats(tenantId: string) {
    const now = new Date();
    const thisMonthStart = dayjs(now).startOf('month').toDate();
    const lastMonthStart = dayjs(now).subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs(now).subtract(1, 'month').endOf('month').toDate();

    // Current month data
    const [
      thisMonthOrders,
      thisMonthInvoices,
      thisMonthRevenue,
      lastMonthOrders,
      lastMonthInvoices,
      lastMonthRevenue,
    ] = await Promise.all([
      this.salesOrderRepository.count({
        where: { tenantId, createdAt: MoreThan(thisMonthStart) },
      }),
      this.eInvoiceRepository.count({
        where: { tenantId, createdAt: MoreThan(thisMonthStart) },
      }),
      this.salesOrderRepository
        .createQueryBuilder('so')
        .select('SUM(so.total)', 'total')
        .where('so.tenantId = :tenantId', { tenantId })
        .andWhere('so.createdAt >= :start', { start: thisMonthStart })
        .getRawOne(),
      this.salesOrderRepository.count({
        where: {
          tenantId,
          createdAt: MoreThan(lastMonthStart),
        },
      }),
      this.eInvoiceRepository.count({
        where: {
          tenantId,
          createdAt: MoreThan(lastMonthStart),
        },
      }),
      this.salesOrderRepository
        .createQueryBuilder('so')
        .select('SUM(so.total)', 'total')
        .where('so.tenantId = :tenantId', { tenantId })
        .andWhere('so.createdAt BETWEEN :start AND :end', {
          start: lastMonthStart,
          end: lastMonthEnd,
        })
        .getRawOne(),
    ]);

    // Total inventory
    const totalInventory = await this.productRepository.count({
      where: { tenantId } as any,
    });

    // Calculate growth percentages
    const ordersGrowth = this.calculateGrowth(thisMonthOrders, lastMonthOrders);
    const invoicesGrowth = this.calculateGrowth(thisMonthInvoices, lastMonthInvoices);
    const revenueGrowth = this.calculateGrowth(
      parseFloat(thisMonthRevenue?.total || '0'),
      parseFloat(lastMonthRevenue?.total || '0'),
    );

    return {
      totalOrders: thisMonthOrders,
      ordersGrowth,
      totalInvoices: thisMonthInvoices,
      invoicesGrowth,
      totalInventory,
      inventoryGrowth: 0, // Can calculate based on stock changes
      totalRevenue: parseFloat(thisMonthRevenue?.total || '0'),
      revenueGrowth,
    };
  }

  async getRecentActivities(tenantId: string) {
    // Get last 10 activities (orders, invoices, payments)
    const recentOrders = await this.salesOrderRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['customer'],
    });

    const recentInvoices = await this.eInvoiceRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const activities = [
      ...recentOrders.map((order) => ({
        id: order.id,
        type: 'order',
        title: `Đơn hàng ${order.code}`,
        description: `Khách hàng: ${order.customer?.name || 'N/A'}`,
        amount: order.total,
        createdAt: order.createdAt,
      })),
      ...recentInvoices.map((invoice) => ({
        id: invoice.id,
        type: 'invoice',
        title: `Hóa đơn ${invoice.invoiceNumber}`,
        description: `Trạng thái: ${invoice.invoiceStatus}`,
        amount: invoice.totalAmount,
        createdAt: invoice.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  async getRevenueChart(tenantId: string) {
    const data = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = dayjs(now).subtract(i, 'month').startOf('month').toDate();
      const monthEnd = dayjs(now).subtract(i, 'month').endOf('month').toDate();

      const revenue = await this.salesOrderRepository
        .createQueryBuilder('so')
        .select('SUM(so.total)', 'total')
        .where('so.tenantId = :tenantId', { tenantId })
        .andWhere('so.createdAt BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getRawOne();

      data.push({
        month: dayjs(monthStart).format('MM/YYYY'),
        revenue: parseFloat(revenue?.total || '0'),
      });
    }

    return data;
  }

  async getTopProducts(tenantId: string) {
    // Get top 10 bestselling products from sales orders
    const topProducts = await this.salesOrderRepository
      .createQueryBuilder('so')
      .leftJoin('so.items', 'item')
      .leftJoin('item.product', 'product')
      .select('product.name', 'productName')
      .addSelect('SUM(item.quantityOrdered)', 'quantity')
      .where('so.tenantId = :tenantId', { tenantId })
      .groupBy('product.name')
      .orderBy('quantity', 'DESC')
      .limit(10)
      .getRawMany();

    return topProducts.map((p) => ({
      productName: p.productName,
      quantity: parseFloat(p.quantity) || 0,
    }));
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }
}
