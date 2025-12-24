import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './purchase-order.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrdersRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemsRepository: Repository<PurchaseOrderItem>,
    private accountingService: AccountingService,
  ) {}

  async create(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrder> {
    const { items, ...orderData } = createPurchaseOrderDto;

    // Calculate totals
    let subtotal = 0;
    const orderItems: PurchaseOrderItem[] = [];

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

      const orderItem = this.purchaseOrderItemsRepository.create({
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

    const purchaseOrder = this.purchaseOrdersRepository.create({
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

    return await this.purchaseOrdersRepository.save(purchaseOrder);
  }

  async findAll(tenantId: string): Promise<PurchaseOrder[]> {
    return await this.purchaseOrdersRepository.find({
      where: { tenantId, deletedAt: null },
      relations: ['supplier', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrdersRepository.findOne({
      where: { id, tenantId, deletedAt: null },
      relations: ['supplier', 'items', 'items.product'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found`);
    }

    return purchaseOrder;
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    tenantId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id, tenantId);

    if (
      purchaseOrder.status !== PurchaseOrderStatus.DRAFT &&
      purchaseOrder.status !== PurchaseOrderStatus.SENT
    ) {
      throw new BadRequestException(
        'Only draft or sent orders can be updated',
      );
    }

    const { items, ...orderData } = updatePurchaseOrderDto;

    // If items are provided, recalculate
    if (items) {
      await this.purchaseOrderItemsRepository.delete({
        purchaseOrderId: id,
        tenantId,
      });

      let subtotal = 0;
      const orderItems: PurchaseOrderItem[] = [];

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

        const orderItem = this.purchaseOrderItemsRepository.create({
          ...item,
          purchaseOrderId: id,
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

      Object.assign(purchaseOrder, {
        ...orderData,
        subtotal,
        discountRate,
        discountAmount,
        taxRate,
        taxAmount,
        total,
      });

      purchaseOrder.items = orderItems;
    } else {
      Object.assign(purchaseOrder, orderData);
    }

    return await this.purchaseOrdersRepository.save(purchaseOrder);
  }

  async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id, tenantId);

    const validTransitions = {
      [PurchaseOrderStatus.DRAFT]: [
        PurchaseOrderStatus.SENT,
        PurchaseOrderStatus.CANCELLED,
      ],
      [PurchaseOrderStatus.SENT]: [
        PurchaseOrderStatus.CONFIRMED,
        PurchaseOrderStatus.CANCELLED,
      ],
      [PurchaseOrderStatus.CONFIRMED]: [
        PurchaseOrderStatus.RECEIVED,
        PurchaseOrderStatus.CANCELLED,
      ],
      [PurchaseOrderStatus.RECEIVED]: [],
      [PurchaseOrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[purchaseOrder.status].includes(status)) {
      throw new BadRequestException(
        `Cannot change status from ${purchaseOrder.status} to ${status}`,
      );
    }

    purchaseOrder.status = status;
    if (status === PurchaseOrderStatus.CONFIRMED) {
      purchaseOrder.approvedBy = userId;
      purchaseOrder.approvedAt = new Date();
    }

    const savedOrder = await this.purchaseOrdersRepository.save(purchaseOrder);

    // Auto-generate journal entry when order is received
    if (status === PurchaseOrderStatus.RECEIVED) {
      try {
        await this.accountingService.createJournalEntryFromPurchaseOrder(
          tenantId,
          userId,
          purchaseOrder.id,
          {
            code: purchaseOrder.code,
            date: purchaseOrder.date,
            supplierId: purchaseOrder.supplierId,
            total: Number(purchaseOrder.total),
            subtotal: Number(purchaseOrder.subtotal),
            discountAmount: Number(purchaseOrder.discountAmount),
            taxAmount: Number(purchaseOrder.taxAmount),
          },
        );
      } catch (error) {
        console.error('Failed to create journal entry for purchase order:', error);
        // Don't fail the order if journal entry fails
      }
    }

    return savedOrder;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const purchaseOrder = await this.findOne(id, tenantId);
    purchaseOrder.deletedAt = new Date();
    await this.purchaseOrdersRepository.save(purchaseOrder);
  }

  /**
   * Send purchase order to supplier
   * Change status from draft to sent
   */
  async send(id: string, tenantId: string, userId: string): Promise<PurchaseOrder> {
    const purchaseOrder = await this.findOne(id, tenantId);

    // Validate status
    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ có thể gửi đơn mua hàng ở trạng thái Dự thảo'
      );
    }

    // Validate items
    if (!purchaseOrder.items || purchaseOrder.items.length === 0) {
      throw new BadRequestException(
        'Đơn mua hàng phải có ít nhất 1 sản phẩm'
      );
    }

    // Update status
    purchaseOrder.status = PurchaseOrderStatus.SENT;
    purchaseOrder.sentAt = new Date();

    return await this.purchaseOrdersRepository.save(purchaseOrder);
  }
}
