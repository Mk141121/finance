import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { ProductBatch } from './entities/product-batch.entity';
import { StockTransaction, StockTransactionType } from './entities/stock-transaction.entity';
import { StockTransactionItem } from './entities/stock-transaction-item.entity';
import { StockBalance } from './entities/stock-balance.entity';
import { CreateStockTransactionDto } from './dto/create-stock-transaction.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Warehouse)
    private warehousesRepository: Repository<Warehouse>,
    @InjectRepository(ProductBatch)
    private batchesRepository: Repository<ProductBatch>,
    @InjectRepository(StockTransaction)
    private transactionsRepository: Repository<StockTransaction>,
    @InjectRepository(StockTransactionItem)
    private transactionItemsRepository: Repository<StockTransactionItem>,
    @InjectRepository(StockBalance)
    private balancesRepository: Repository<StockBalance>,
    private dataSource: DataSource,
  ) {}

  // ==================== WAREHOUSES ====================
  async findAllWarehouses(tenantId: string): Promise<Warehouse[]> {
    return await this.warehousesRepository.find({
      where: { tenantId, deletedAt: null },
      order: { code: 'ASC' },
    });
  }

  async findWarehouse(id: string, tenantId: string): Promise<Warehouse> {
    const warehouse = await this.warehousesRepository.findOne({
      where: { id, tenantId, deletedAt: null },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  // ==================== STOCK TRANSACTIONS ====================
  async createStockTransaction(
    createDto: CreateStockTransactionDto,
    tenantId: string,
    userId: string,
  ): Promise<StockTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { items, ...transactionData } = createDto;

      // Create transaction
      const transaction = this.transactionsRepository.create({
        ...transactionData,
        tenantId,
        createdBy: userId,
        status: 'draft',
      });

      // Create items
      const transactionItems: StockTransactionItem[] = [];
      for (const item of items) {
        const unitCost = Number(item.unitCost || 0);
        const quantity = Number(item.quantity);
        const totalCost = unitCost * quantity;

        const transactionItem = this.transactionItemsRepository.create({
          ...item,
          tenantId,
          quantity,
          unitCost,
          totalCost,
        });
        transactionItems.push(transactionItem);
      }

      transaction.items = transactionItems;

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmStockTransaction(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<StockTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await this.transactionsRepository.findOne({
        where: { id, tenantId },
        relations: ['items', 'items.product'],
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      if (transaction.status !== 'draft') {
        throw new BadRequestException('Only draft transactions can be confirmed');
      }

      // Update transaction status
      transaction.status = 'confirmed';
      transaction.confirmedBy = userId;
      transaction.confirmedAt = new Date();

      // Process each item - update stock balances
      for (const item of transaction.items) {
        await this.updateStockBalance(
          queryRunner,
          tenantId,
          item.productId,
          transaction.warehouseId,
          transaction.type === StockTransactionType.IN ? item.quantity : -item.quantity,
          item.unitCost || 0,
        );

        // For IN transactions, create batch if needed
        if (transaction.type === StockTransactionType.IN && item.unitCost) {
          await this.createOrUpdateBatch(
            queryRunner,
            tenantId,
            item.productId,
            transaction.warehouseId,
            item.quantity,
            item.unitCost,
            transaction.code,
          );
        }

        // For OUT transactions, use FIFO to deduct from batches
        if (transaction.type === StockTransactionType.OUT) {
          await this.deductFromBatchesFIFO(
            queryRunner,
            tenantId,
            item.productId,
            transaction.warehouseId,
            item.quantity,
          );
        }
      }

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== STOCK BALANCES ====================
  async getStockBalance(
    tenantId: string,
    productId: string,
    warehouseId: string,
  ): Promise<StockBalance> {
    let balance = await this.balancesRepository.findOne({
      where: { tenantId, productId, warehouseId },
      relations: ['product', 'warehouse'],
    });

    if (!balance) {
      // Create new balance record
      balance = this.balancesRepository.create({
        tenantId,
        productId,
        warehouseId,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        averageCost: 0,
        totalValue: 0,
      });
      balance = await this.balancesRepository.save(balance);
    }

    return balance;
  }

  async getAllStockBalances(
    tenantId: string,
    warehouseId?: string,
  ): Promise<StockBalance[]> {
    const where: any = { tenantId };
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    return await this.balancesRepository.find({
      where,
      relations: ['product', 'warehouse'],
      order: { warehouseId: 'ASC', productId: 'ASC' },
    });
  }

  // ==================== PRIVATE HELPERS ====================
  private async updateStockBalance(
    queryRunner: any,
    tenantId: string,
    productId: string,
    warehouseId: string,
    quantityChange: number,
    unitCost: number,
  ): Promise<void> {
    let balance = await queryRunner.manager.findOne(StockBalance, {
      where: { tenantId, productId, warehouseId },
    });

    if (!balance) {
      balance = queryRunner.manager.create(StockBalance, {
        tenantId,
        productId,
        warehouseId,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        averageCost: 0,
        totalValue: 0,
      });
    }

    const oldQuantity = Number(balance.quantity);
    const oldValue = Number(balance.totalValue);
    const newQuantity = oldQuantity + Number(quantityChange);

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient stock quantity');
    }

    // Weighted average cost calculation
    if (quantityChange > 0 && unitCost > 0) {
      const newValue = oldValue + (Number(quantityChange) * Number(unitCost));
      balance.averageCost = newQuantity > 0 ? newValue / newQuantity : 0;
      balance.totalValue = newValue;
    } else {
      balance.totalValue = newQuantity * Number(balance.averageCost);
    }

    balance.quantity = newQuantity;
    balance.availableQuantity = newQuantity - Number(balance.reservedQuantity);

    await queryRunner.manager.save(balance);
  }

  private async createOrUpdateBatch(
    queryRunner: any,
    tenantId: string,
    productId: string,
    warehouseId: string,
    quantity: number,
    unitCost: number,
    batchNumber: string,
  ): Promise<void> {
    const batch = queryRunner.manager.create(ProductBatch, {
      tenantId,
      productId,
      warehouseId,
      batchNumber,
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      totalCost: Number(quantity) * Number(unitCost),
      status: 'available',
    });

    await queryRunner.manager.save(batch);
  }

  private async deductFromBatchesFIFO(
    queryRunner: any,
    tenantId: string,
    productId: string,
    warehouseId: string,
    quantityToDeduct: number,
  ): Promise<void> {
    // Get batches ordered by creation date (FIFO)
    const batches = await queryRunner.manager.find(ProductBatch, {
      where: {
        tenantId,
        productId,
        warehouseId,
        status: 'available',
      },
      order: { createdAt: 'ASC' },
    });

    let remaining = Number(quantityToDeduct);

    for (const batch of batches) {
      if (remaining <= 0) break;

      const batchQty = Number(batch.quantity);
      if (batchQty > 0) {
        const deduct = Math.min(batchQty, remaining);
        batch.quantity = batchQty - deduct;
        
        if (batch.quantity <= 0) {
          batch.status = 'depleted';
        }

        await queryRunner.manager.save(batch);
        remaining -= deduct;
      }
    }

    if (remaining > 0) {
      throw new BadRequestException('Insufficient batch quantity for FIFO deduction');
    }
  }

  async findAllTransactions(tenantId: string): Promise<StockTransaction[]> {
    return await this.transactionsRepository.find({
      where: { tenantId },
      relations: ['warehouse', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneTransaction(id: string, tenantId: string): Promise<StockTransaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id, tenantId },
      relations: ['warehouse', 'items', 'items.product', 'items.batch'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }
}
