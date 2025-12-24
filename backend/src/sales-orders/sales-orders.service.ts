import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './sales-order.entity';
import { SalesOrderItem } from './sales-order-item.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectRepository(SalesOrder)
    private salesOrdersRepository: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private salesOrderItemsRepository: Repository<SalesOrderItem>,
    private accountingService: AccountingService,
  ) {}

  async create(
    createSalesOrderDto: CreateSalesOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<SalesOrder> {
    const { items, ...orderData } = createSalesOrderDto;

    // Calculate totals
    let subtotal = 0;
    const orderItems: SalesOrderItem[] = [];

    items.forEach((item, index) => {
      const quantity = Number(item.quantityOrdered);
      const unitPrice = Number(item.unitPrice);
      const discountRate = Number(item.discountRate || 0);
      const taxRate = Number(item.taxRate || orderData.taxRate || 10);

      const lineSubtotal = quantity * unitPrice;
      const discountAmount = (lineSubtotal * discountRate) / 100;
      const lineAfterDiscount = lineSubtotal - discountAmount;
      const taxAmount = (lineAfterDiscount * taxRate) / 100;
      const lineTotal = lineAfterDiscount + taxAmount;

      subtotal += lineSubtotal;

      const orderItem = this.salesOrderItemsRepository.create({
        ...item,
        tenantId,
        lineNumber: index + 1,
        quantityOrdered: quantity,
        unitPrice,
        discountRate,
        discountAmount,
        taxRate,
        taxAmount,
        lineTotal,
      });

      orderItems.push(orderItem);
    });

    // Calculate order totals
    const discountRate = Number(orderData.discountRate || 0);
    const discountAmount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxRate = Number(orderData.taxRate || 10);
    const taxAmount = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmount;

    const salesOrder = this.salesOrdersRepository.create({
      ...orderData,
      tenantId,
      createdBy: userId,
      subtotal,
      discountRate,
      discountAmount,
      taxRate,
      taxAmount,
      total,
      items: orderItems,
    });

    return await this.salesOrdersRepository.save(salesOrder);
  }

  async findAll(tenantId: string): Promise<SalesOrder[]> {
    return await this.salesOrdersRepository.find({
      where: { tenantId, deletedAt: null },
      relations: ['customer', 'quotation', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<SalesOrder> {
    const salesOrder = await this.salesOrdersRepository.findOne({
      where: { id, tenantId, deletedAt: null },
      relations: ['customer', 'quotation', 'items', 'items.product'],
    });

    if (!salesOrder) {
      throw new NotFoundException(`Sales Order with ID ${id} not found`);
    }

    return salesOrder;
  }

  async update(
    id: string,
    updateSalesOrderDto: UpdateSalesOrderDto,
    tenantId: string,
  ): Promise<SalesOrder> {
    const salesOrder = await this.findOne(id, tenantId);

    if (
      salesOrder.status !== SalesOrderStatus.DRAFT &&
      salesOrder.status !== SalesOrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Only draft or confirmed orders can be updated',
      );
    }

    const { items, ...orderData } = updateSalesOrderDto;

    // If items are provided, recalculate
    if (items) {
      // Delete old items
      await this.salesOrderItemsRepository.delete({
        salesOrderId: id,
        tenantId,
      });

      // Calculate new totals
      let subtotal = 0;
      const orderItems: SalesOrderItem[] = [];

      items.forEach((item, index) => {
        const quantity = Number(item.quantityOrdered);
        const unitPrice = Number(item.unitPrice);
        const discountRate = Number(item.discountRate || 0);
        const taxRate = Number(item.taxRate || orderData.taxRate || 10);

        const lineSubtotal = quantity * unitPrice;
        const discountAmount = (lineSubtotal * discountRate) / 100;
        const lineAfterDiscount = lineSubtotal - discountAmount;
        const taxAmount = (lineAfterDiscount * taxRate) / 100;
        const lineTotal = lineAfterDiscount + taxAmount;

        subtotal += lineSubtotal;

        const orderItem = this.salesOrderItemsRepository.create({
          ...item,
          salesOrderId: id,
          tenantId,
          lineNumber: index + 1,
          quantityOrdered: quantity,
          unitPrice,
          discountRate,
          discountAmount,
          taxRate,
          taxAmount,
          lineTotal,
        });

        orderItems.push(orderItem);
      });

      const discountRate = Number(orderData.discountRate || 0);
      const discountAmount = (subtotal * discountRate) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxRate = Number(orderData.taxRate || 10);
      const taxAmount = (afterDiscount * taxRate) / 100;
      const total = afterDiscount + taxAmount;

      Object.assign(salesOrder, {
        ...orderData,
        subtotal,
        discountRate,
        discountAmount,
        taxRate,
        taxAmount,
        total,
      });

      salesOrder.items = orderItems;
    } else {
      Object.assign(salesOrder, orderData);
    }

    return await this.salesOrdersRepository.save(salesOrder);
  }

  async updateStatus(
    id: string,
    status: SalesOrderStatus,
    tenantId: string,
    userId: string,
  ): Promise<SalesOrder> {
    const salesOrder = await this.findOne(id, tenantId);

    // Validate status transitions
    const validTransitions = {
      [SalesOrderStatus.DRAFT]: [
        SalesOrderStatus.CONFIRMED,
        SalesOrderStatus.CANCELLED,
      ],
      [SalesOrderStatus.CONFIRMED]: [
        SalesOrderStatus.PROCESSING,
        SalesOrderStatus.CANCELLED,
      ],
      [SalesOrderStatus.PROCESSING]: [
        SalesOrderStatus.COMPLETED,
        SalesOrderStatus.CANCELLED,
      ],
      [SalesOrderStatus.COMPLETED]: [],
      [SalesOrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[salesOrder.status].includes(status)) {
      throw new BadRequestException(
        `Cannot change status from ${salesOrder.status} to ${status}`,
      );
    }

    salesOrder.status = status;
    if (status === SalesOrderStatus.CONFIRMED) {
      salesOrder.approvedBy = userId;
      salesOrder.approvedAt = new Date();
    }

    const savedOrder = await this.salesOrdersRepository.save(salesOrder);

    // Auto-generate journal entry when order is completed
    if (status === SalesOrderStatus.COMPLETED) {
      try {
        await this.accountingService.createJournalEntryFromSalesOrder(
          tenantId,
          userId,
          salesOrder.id,
          {
            code: salesOrder.code,
            date: salesOrder.date,
            customerId: salesOrder.customerId,
            total: Number(salesOrder.total),
            subtotal: Number(salesOrder.subtotal),
            discountAmount: Number(salesOrder.discountAmount),
            taxAmount: Number(salesOrder.taxAmount),
            items: salesOrder.items.map((item) => ({
              quantity: Number(item.quantityOrdered),
              unitCost: 0, // TODO: Get from product or inventory
            })),
          },
        );
      } catch (error) {
        console.error('Failed to create journal entry for sales order:', error);
        // Don't fail the order completion if journal entry fails
      }
    }

    return savedOrder;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const salesOrder = await this.findOne(id, tenantId);
    salesOrder.deletedAt = new Date();
    await this.salesOrdersRepository.save(salesOrder);
  }
}
