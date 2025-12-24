// ============================================================================
// PHASE 2: EDGE CASES & INTEGRATION TESTS
// Target: Push coverage from 58% → 70%+
// ============================================================================

// ============================================================================
// CUSTOMERS SERVICE - ADDITIONAL TESTS
// File: backend/src/customers/customers.service.spec.ts (ADD THESE)
// ============================================================================

describe('CustomersService - Edge Cases', () => {
  describe('create - Advanced Validations', () => {
    it('should validate Vietnamese tax code format (10 digits)', async () => {
      const dto = {
        ...createCustomerDto(),
        taxCode: '123', // Invalid: too short
      };

      await expect(service.create(dto, tenantId)).rejects.toThrow(
        'Mã số thuế phải có 10 hoặc 13 chữ số'
      );
    });

    it('should validate Vietnamese tax code format (13 digits)', async () => {
      const dto = {
        ...createCustomerDto(),
        taxCode: '0123456789123', // Valid: 13 digits
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue(dto);

      const result = await service.create(dto, tenantId);
      expect(result.taxCode).toBe('0123456789123');
    });

    it('should validate Vietnamese phone number formats', async () => {
      const validPhones = [
        '0901234567',     // Mobile
        '+84901234567',   // International mobile
        '02812345678',    // Landline HCMC
        '02436789012',    // Landline Hanoi
      ];

      for (const phone of validPhones) {
        const dto = createCustomerDto({ phone });
        mockRepository.findOne.mockResolvedValue(null);
        mockRepository.create.mockReturnValue(dto);
        mockRepository.save.mockResolvedValue(dto);

        const result = await service.create(dto, tenantId);
        expect(result.phone).toBe(phone);
      }
    });

    it('should reject invalid Vietnamese phone numbers', async () => {
      const invalidPhones = [
        '123',           // Too short
        '12345678901234', // Too long
        'abc123',        // Contains letters
        '1234567890',    // 10 digits but invalid format
      ];

      for (const phone of invalidPhones) {
        const dto = createCustomerDto({ phone });
        
        await expect(service.create(dto, tenantId)).rejects.toThrow(
          'Số điện thoại không hợp lệ'
        );
      }
    });

    it('should handle duplicate email gracefully', async () => {
      const existingCustomer = createMockCustomer({
        email: 'duplicate@example.com',
      });

      mockRepository.findOne
        .mockResolvedValueOnce(null) // No duplicate code
        .mockResolvedValueOnce(existingCustomer); // Duplicate email

      await expect(
        service.create(
          createCustomerDto({ email: 'duplicate@example.com' }),
          tenantId
        )
      ).rejects.toThrow('Email đã được sử dụng bởi khách hàng khác');
    });
  });

  describe('findAll - Advanced Filtering', () => {
    it('should filter by multiple criteria', async () => {
      const qb = createMockQueryBuilder();
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, {
        type: 'business',
        isActive: true,
        search: 'công ty',
        customerGroup: 'VIP',
        minBalance: 1000000,
        maxBalance: 10000000,
      });

      expect(qb.andWhere).toHaveBeenCalledTimes(5);
    });

    it('should handle empty results gracefully', async () => {
      mockRepository.createQueryBuilder.mockReturnValue({
        ...createMockQueryBuilder(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      });

      const result = await service.findAll(tenantId, { page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    it('should handle large page numbers', async () => {
      const qb = createMockQueryBuilder();
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { page: 1000, limit: 10 });

      expect(qb.skip).toHaveBeenCalledWith(9990); // (1000-1) * 10
    });

    it('should limit maximum page size to 100', async () => {
      const qb = createMockQueryBuilder();
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(tenantId, { page: 1, limit: 500 });

      expect(qb.take).toHaveBeenCalledWith(100); // Max limit
    });
  });

  describe('update - Concurrency & Validation', () => {
    it('should handle optimistic locking (concurrent updates)', async () => {
      const customer = createMockCustomer();
      
      mockRepository.findOne.mockResolvedValue(customer);
      mockRepository.save.mockRejectedValue(
        new Error('VersionError: Row was updated by another transaction')
      );

      await expect(
        service.update(customer.id, { name: 'New Name' }, tenantId)
      ).rejects.toThrow('Dữ liệu đã được cập nhật bởi người khác');
    });

    it('should not allow updating to duplicate code', async () => {
      const customer1 = createMockCustomer({ code: 'KH001' });
      const customer2 = createMockCustomer({ code: 'KH002' });

      mockRepository.findOne
        .mockResolvedValueOnce(customer2) // Customer being updated
        .mockResolvedValueOnce(customer1); // Existing customer with KH001

      await expect(
        service.update(customer2.id, { code: 'KH001' }, tenantId)
      ).rejects.toThrow('Mã khách hàng đã tồn tại');
    });

    it('should allow updating same customer without code conflict', async () => {
      const customer = createMockCustomer({ code: 'KH001' });

      mockRepository.findOne.mockResolvedValue(customer);
      mockRepository.save.mockResolvedValue({
        ...customer,
        name: 'Updated Name',
      });

      // Update other fields, keep same code
      const result = await service.update(
        customer.id,
        { name: 'Updated Name', code: 'KH001' },
        tenantId
      );

      expect(result.name).toBe('Updated Name');
      expect(result.code).toBe('KH001');
    });
  });

  describe('delete - Complex Scenarios', () => {
    it('should cascade check all related entities', async () => {
      const customer = createMockCustomer();
      mockRepository.findOne.mockResolvedValue(customer);

      // Has sales orders
      mockSalesOrdersRepository.count.mockResolvedValue(5);
      
      await expect(service.delete(customer.id, tenantId)).rejects.toThrow(
        'Không thể xóa khách hàng có giao dịch'
      );

      // Has invoices
      mockSalesOrdersRepository.count.mockResolvedValue(0);
      mockInvoicesRepository.count.mockResolvedValue(3);
      
      await expect(service.delete(customer.id, tenantId)).rejects.toThrow(
        'Không thể xóa khách hàng có giao dịch'
      );

      // Has receipts
      mockInvoicesRepository.count.mockResolvedValue(0);
      mockReceiptsRepository.count.mockResolvedValue(1);
      
      await expect(service.delete(customer.id, tenantId)).rejects.toThrow(
        'Không thể xóa khách hàng có giao dịch'
      );
    });

    it('should allow force delete with flag (admin only)', async () => {
      const customer = createMockCustomer();
      mockRepository.findOne.mockResolvedValue(customer);
      mockSalesOrdersRepository.count.mockResolvedValue(5);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      // Force delete flag
      await service.delete(customer.id, tenantId, { force: true });

      expect(mockRepository.update).toHaveBeenCalledWith(
        customer.id,
        expect.objectContaining({
          deletedAt: expect.any(Date),
          isActive: false,
        })
      );
    });

    it('should log deletion in audit trail', async () => {
      const customer = createMockCustomer();
      mockRepository.findOne.mockResolvedValue(customer);
      mockSalesOrdersRepository.count.mockResolvedValue(0);
      mockInvoicesRepository.count.mockResolvedValue(0);
      mockReceiptsRepository.count.mockResolvedValue(0);

      await service.delete(customer.id, tenantId);

      expect(mockAuditService.log).toHaveBeenCalledWith({
        tenantId,
        action: 'CUSTOMER_DELETED',
        entityType: 'Customer',
        entityId: customer.id,
        details: {
          code: customer.code,
          name: customer.name,
        },
      });
    });
  });

  describe('Business Logic - Credit Management', () => {
    it('should check credit limit before creating sales order', async () => {
      const customer = createMockCustomer({
        creditLimit: 10000000, // 10M
        balance: 8000000,      // 8M debt
      });

      mockRepository.findOne.mockResolvedValue(customer);

      // Try to create 3M order → Total 11M > 10M limit
      const canCreate = await service.canCreateOrder(
        customer.id,
        3000000,
        tenantId
      );

      expect(canCreate).toBe(false);
    });

    it('should allow order if within credit limit', async () => {
      const customer = createMockCustomer({
        creditLimit: 10000000, // 10M
        balance: 7000000,      // 7M debt
      });

      mockRepository.findOne.mockResolvedValue(customer);

      // Try to create 2M order → Total 9M < 10M limit
      const canCreate = await service.canCreateOrder(
        customer.id,
        2000000,
        tenantId
      );

      expect(canCreate).toBe(true);
    });

    it('should update balance when payment received', async () => {
      const customer = createMockCustomer({ balance: 5000000 });
      mockRepository.findOne.mockResolvedValue(customer);

      await service.updateBalance(customer.id, -2000000, tenantId); // Payment

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 3000000, // 5M - 2M
        })
      );
    });
  });
});


// ============================================================================
// PRODUCTS SERVICE - ADDITIONAL TESTS
// ============================================================================

describe('ProductsService - Edge Cases', () => {
  describe('Inventory Management', () => {
    it('should prevent negative stock if setting disallows', async () => {
      const product = createMockProduct({
        manageStock: true,
        minStock: 10,
      });

      mockSettingsService.get
        .mockResolvedValue({ allowNegativeStock: false });
      
      const currentStock = 5;
      mockStockBalancesRepository.sum.mockResolvedValue(currentStock);

      await expect(
        service.reserveStock(product.id, 10, tenantId) // Try to reserve 10 but only 5 available
      ).rejects.toThrow('Không đủ hàng tồn kho');
    });

    it('should allow negative stock if setting allows', async () => {
      const product = createMockProduct({ manageStock: true });

      mockSettingsService.get
        .mockResolvedValue({ allowNegativeStock: true });
      
      const currentStock = 5;
      mockStockBalancesRepository.sum.mockResolvedValue(currentStock);

      // Should not throw
      await service.reserveStock(product.id, 10, tenantId);
    });

    it('should alert when stock below minimum', async () => {
      const product = createMockProduct({
        minStock: 20,
        reorderPoint: 30,
      });

      const currentStock = 15; // Below minStock
      mockStockBalancesRepository.sum.mockResolvedValue(currentStock);

      await service.checkStockLevels(product.id, tenantId);

      expect(mockNotificationService.send).toHaveBeenCalledWith({
        type: 'LOW_STOCK_ALERT',
        message: expect.stringContaining('Tồn kho thấp'),
        productId: product.id,
      });
    });

    it('should auto-create purchase request when below reorder point', async () => {
      const product = createMockProduct({
        reorderPoint: 30,
        minStock: 20,
      });

      const currentStock = 25; // Below reorderPoint
      mockStockBalancesRepository.sum.mockResolvedValue(currentStock);

      mockSettingsService.get
        .mockResolvedValue({ autoReorder: true });

      await service.checkStockLevels(product.id, tenantId);

      expect(mockPurchaseRequestsService.createAuto).toHaveBeenCalledWith({
        productId: product.id,
        quantity: expect.any(Number),
        reason: 'AUTO_REORDER',
      });
    });
  });

  describe('Pricing & Tax', () => {
    it('should calculate price with tax correctly for 0%', async () => {
      const product = createMockProduct({
        price: 100000,
        vatRate: 0,
      });

      const priceWithTax = service.calculatePriceWithTax(product);
      expect(priceWithTax).toBe(100000);
    });

    it('should calculate price with tax correctly for 5%', async () => {
      const product = createMockProduct({
        price: 100000,
        vatRate: 5,
      });

      const priceWithTax = service.calculatePriceWithTax(product);
      expect(priceWithTax).toBe(105000);
    });

    it('should calculate price with tax correctly for 10%', async () => {
      const product = createMockProduct({
        price: 100000,
        vatRate: 10,
      });

      const priceWithTax = service.calculatePriceWithTax(product);
      expect(priceWithTax).toBe(110000);
    });

    it('should validate VAT rate is one of allowed values', async () => {
      const dto = createProductDto({ vatRate: 7 }); // Invalid

      await expect(service.create(dto, tenantId)).rejects.toThrow(
        'Thuế suất VAT phải là 0%, 5%, 8%, hoặc 10%'
      );
    });

    it('should calculate profit margin correctly', async () => {
      const product = createMockProduct({
        price: 100000,
        cost: 70000,
      });

      const margin = service.calculateProfitMargin(product);
      expect(margin).toBe(30); // 30% margin
    });

    it('should warn when selling below cost', async () => {
      const product = createMockProduct({
        price: 60000,
        cost: 70000, // Cost > Price
      });

      const result = await service.validatePricing(product);
      
      expect(result.warnings).toContainEqual({
        type: 'PRICE_BELOW_COST',
        message: 'Giá bán thấp hơn giá vốn',
      });
    });
  });

  describe('Batch & Serial Management', () => {
    it('should track batch numbers when enabled', async () => {
      const product = createMockProduct({
        manageBatch: true,
        manageExpiry: true,
      });

      await service.addStockWithBatch(product.id, {
        quantity: 100,
        batchNumber: 'BATCH-2025-001',
        expiryDate: new Date('2026-12-31'),
        warehouseId: 'warehouse-id',
      }, tenantId);

      expect(mockBatchesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          batchNumber: 'BATCH-2025-001',
          expiryDate: expect.any(Date),
        })
      );
    });

    it('should alert when batch near expiry', async () => {
      const nearExpiryDate = new Date();
      nearExpiryDate.setDate(nearExpiryDate.getDate() + 15); // 15 days

      const batch = {
        id: 'batch-id',
        productId: 'product-id',
        batchNumber: 'BATCH-001',
        expiryDate: nearExpiryDate,
        quantity: 50,
      };

      mockBatchesRepository.find.mockResolvedValue([batch]);

      await service.checkExpiringBatches(tenantId);

      expect(mockNotificationService.send).toHaveBeenCalledWith({
        type: 'BATCH_EXPIRING',
        message: expect.stringContaining('sắp hết hạn'),
        batchId: batch.id,
      });
    });

    it('should use FIFO for batch selection on stock out', async () => {
      const product = createMockProduct({ manageBatch: true });
      
      const batches = [
        { id: '1', batchNumber: 'B1', quantity: 30, createdAt: new Date('2025-01-01') },
        { id: '2', batchNumber: 'B2', quantity: 50, createdAt: new Date('2025-01-15') },
        { id: '3', batchNumber: 'B3', quantity: 20, createdAt: new Date('2025-02-01') },
      ];

      mockBatchesRepository.find.mockResolvedValue(batches);

      // Reserve 60 units
      const selectedBatches = await service.selectBatchesForReservation(
        product.id,
        60,
        tenantId
      );

      // Should use B1 (30) + B2 (30)
      expect(selectedBatches).toHaveLength(2);
      expect(selectedBatches[0].batchNumber).toBe('B1');
      expect(selectedBatches[0].quantityUsed).toBe(30);
      expect(selectedBatches[1].batchNumber).toBe('B2');
      expect(selectedBatches[1].quantityUsed).toBe(30);
    });
  });
});


// ============================================================================
// QUOTATIONS SERVICE - ADDITIONAL TESTS
// ============================================================================

describe('QuotationsService - Edge Cases', () => {
  describe('Calculations - Complex Scenarios', () => {
    it('should calculate totals with mixed discount types', async () => {
      const items = [
        {
          quantity: 10,
          unitPrice: 100000,
          discountType: 'percentage',
          discountValue: 10, // 10%
          vatRate: 10,
        },
        {
          quantity: 5,
          unitPrice: 200000,
          discountType: 'amount',
          discountValue: 50000, // 50k per item
          vatRate: 5,
        },
      ];

      const totals = service.calculateTotals(items);

      // Item 1: 10 * 100k = 1M, discount 10% = 900k, VAT 10% = 90k, total = 990k
      // Item 2: 5 * 200k = 1M, discount 250k = 750k, VAT 5% = 37.5k, total = 787.5k
      expect(totals.subtotal).toBe(1900000); // 1M + 1M - 100k - 250k
      expect(totals.totalDiscount).toBe(350000);
      expect(totals.totalTax).toBe(127500); // 90k + 37.5k
      expect(totals.grandTotal).toBe(1777500);
    });

    it('should handle rounding correctly for Vietnamese currency', async () => {
      const items = [
        {
          quantity: 3,
          unitPrice: 33333,
          vatRate: 10,
        },
      ];

      const totals = service.calculateTotals(items);

      // 3 * 33333 = 99999, VAT = 9999.9 → Round to 10000
      expect(totals.subtotal).toBe(99999);
      expect(totals.totalTax).toBe(10000); // Rounded
      expect(totals.grandTotal).toBe(109999);
    });
  });

  describe('Status Transitions', () => {
    it('should allow draft → sent', async () => {
      const quotation = createMockQuotation({ status: 'draft' });
      mockRepository.findOne.mockResolvedValue(quotation);

      await service.send(quotation.id, tenantId);

      expect(quotation.status).toBe('sent');
    });

    it('should not allow sent → draft', async () => {
      const quotation = createMockQuotation({ status: 'sent' });
      mockRepository.findOne.mockResolvedValue(quotation);

      await expect(
        service.updateStatus(quotation.id, 'draft', tenantId)
      ).rejects.toThrow('Không thể chuyển trạng thái từ Đã gửi về Dự thảo');
    });

    it('should allow sent → accepted', async () => {
      const quotation = createMockQuotation({ status: 'sent' });
      mockRepository.findOne.mockResolvedValue(quotation);

      await service.accept(quotation.id, tenantId);

      expect(quotation.status).toBe('accepted');
    });

    it('should create sales order when quotation accepted', async () => {
      const quotation = createMockQuotationWithItems(2);
      quotation.status = 'sent';
      mockRepository.findOne.mockResolvedValue(quotation);

      await service.accept(quotation.id, tenantId);

      expect(mockSalesOrdersService.createFromQuotation).toHaveBeenCalledWith(
        quotation,
        tenantId
      );
    });

    it('should auto-expire quotations past validUntil date', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      const quotations = [
        createMockQuotation({
          status: 'sent',
          validUntil: expiredDate,
        }),
      ];

      mockRepository.find.mockResolvedValue(quotations);

      await service.expireOldQuotations();

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'expired',
        })
      );
    });
  });

  describe('Email & PDF Generation', () => {
    it('should generate PDF with correct data', async () => {
      const quotation = createMockQuotationWithItems(3);
      mockRepository.findOne.mockResolvedValue(quotation);

      const pdfBuffer = await service.generatePDF(quotation.id, tenantId);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(mockPDFService.generate).toHaveBeenCalledWith({
        template: 'quotation',
        data: expect.objectContaining({
          number: quotation.number,
          customer: expect.any(Object),
          items: expect.arrayContaining([expect.any(Object)]),
        }),
      });
    });

    it('should send email with PDF attachment', async () => {
      const quotation = createMockQuotationWithItems();
      mockRepository.findOne.mockResolvedValue(quotation);

      await service.send(quotation.id, tenantId);

      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: quotation.customer.email,
        subject: expect.stringContaining(quotation.number),
        html: expect.any(String),
        attachments: [
          {
            filename: expect.stringContaining('.pdf'),
            content: expect.any(Buffer),
          },
        ],
      });
    });
  });
});


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockQueryBuilder() {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getCount: jest.fn().mockResolvedValue(0),
  };
}

function createCustomerDto(overrides = {}) {
  return {
    code: 'KH001',
    name: 'Test Customer',
    type: 'business',
    email: 'test@example.com',
    phone: '0901234567',
    ...overrides,
  };
}

function createProductDto(overrides = {}) {
  return {
    code: 'SP001',
    name: 'Test Product',
    type: 'product',
    unitId: 'unit-id',
    price: 100000,
    cost: 70000,
    vatRate: 10,
    ...overrides,
  };
}

// ============================================================================
// RUN TESTS
// ============================================================================

/**
 * After adding these tests:
 * 
 * npm test
 * 
 * Expected:
 * - Tests: 73 → 120+ tests
 * - Coverage: 
 *   - Customers: 58% → 72%
 *   - Products: 58% → 71%
 *   - Quotations: 59% → 70%
 *   - Overall: 24% → 35%
 */