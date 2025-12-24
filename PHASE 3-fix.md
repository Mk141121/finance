# PHASE 3 - Nâng Cao Coverage & Tests Tích Hợp

## 🎯 MỤC TIÊU PHASE 3

### 1. Cải Thiện Branch Coverage (Services Hiện Tại)
- **ProductsService**: 25.8% → 70% branches
- **QuotationsService**:  44.44% → 70% branches  
- **PurchaseOrdersService**: 49% → 70% overall coverage

### 2. Thêm Tests Cho Services Còn Lại
- **SalesOrdersService**: 0% → 70% (PRIORITY CAO NHẤT)
- **InventoryService**: 0% → 70%
- **SuppliersService**: 0% → 70%
- **AccountingService**:  0% → 70%

### 3. Integration Tests & E2E Tests
- API endpoint testing
- Authentication/Authorization
- Database transactions
- Multi-service workflows

---

## 📋 DANH SÁCH CÔNG VIỆC

### GIAI ĐOẠN 3A:  Cải Thiện Branch Coverage (Tuần 1)

#### ✅ Task 3.1: ProductsService - Branch Coverage
**File**: `src/modules/products/products.service.spec.ts`

**Thêm tests cho các nhánh còn thiếu:**

```typescript
describe('ProductsService - Branch Coverage', () => {
  // ===== ERROR HANDLING BRANCHES =====
  describe('Error Handling', () => {
    it('should throw error when product not found for update', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      
      await expect(service.update('invalid-id', updateDto))
        .rejects.toThrow('Không tìm thấy sản phẩm');
    });

    it('should throw error when product not found for delete', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      
      await expect(service.remove('invalid-id'))
        .rejects.toThrow('Không tìm thấy sản phẩm');
    });

    it('should handle database connection error', async () => {
      jest.spyOn(repository, 'find').mockRejectedValue(
        new Error('Database connection failed')
      );
      
      await expect(service.findAll())
        .rejects.toThrow('Database connection failed');
    });

    it('should handle null/undefined input gracefully', async () => {
      await expect(service.findOne(null))
        .rejects.toThrow();
      
      await expect(service.findOne(undefined))
        .rejects.toThrow();
    });
  });

  // ===== CONDITIONAL LOGIC BRANCHES =====
  describe('Conditional Logic', () => {
    it('should handle product with trackByBatch = true', async () => {
      const dto = {
        ... createProductDto,
        trackByBatch: true,
        trackBySerial: false,
      };
      
      const result = await service.create(dto);
      expect(result. trackByBatch).toBe(true);
      expect(result. trackBySerial).toBe(false);
    });

    it('should handle product with trackBySerial = true', async () => {
      const dto = {
        ...createProductDto,
        trackByBatch: false,
        trackBySerial: true,
      };
      
      const result = await service.create(dto);
      expect(result.trackBySerial).toBe(true);
      expect(result.trackByBatch).toBe(false);
    });

    it('should handle product with hasExpiryDate = true', async () => {
      const dto = {
        ...createProductDto,
        hasExpiryDate: true,
      };
      
      const result = await service.create(dto);
      expect(result. hasExpiryDate).toBe(true);
    });

    it('should handle product with all tracking flags = false', async () => {
      const dto = {
        ...createProductDto,
        trackByBatch: false,
        trackBySerial:  false,
        hasExpiryDate: false,
      };
      
      const result = await service.create(dto);
      expect(result.trackByBatch).toBe(false);
      expect(result.trackBySerial).toBe(false);
      expect(result.hasExpiryDate).toBe(false);
    });

    it('should calculate correct price when profitMarginPercent changes', async () => {
      const product = mockProduct();
      product.costPrice = 100000;
      product.profitMarginPercent = 20;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(product);
      
      const updateDto = { profitMarginPercent: 30 };
      const result = await service.update(product.id, updateDto);
      
      expect(result.profitMarginPercent).toBe(30);
      expect(result.sellingPrice).toBe(130000); // 100000 * 1.3
    });

    it('should handle costPrice = 0 when calculating profit margin', async () => {
      const product = mockProduct();
      product.costPrice = 0;
      product.profitMarginPercent = 20;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(product);
      
      const result = await service.update(product. id, { costPrice: 0 });
      
      expect(result.sellingPrice).toBe(0);
    });
  });

  // ===== FILTERING BRANCHES =====
  describe('Filtering Logic', () => {
    it('should filter by category when provided', async () => {
      const products = [
        { ... mockProduct(), category: 'Electronics' },
        { ...mockProduct(), category: 'Food' },
      ];
      
      jest.spyOn(repository, 'find').mockResolvedValue(products);
      
      const result = await service.findAll({ category: 'Electronics' });
      
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'Electronics' })
        })
      );
    });

    it('should filter by active status when provided', async () => {
      const result = await service.findAll({ isActive: false });
      
      expect(repository.find).toHaveBeenCalledWith(
        expect. objectContaining({
          where:  expect.objectContaining({ isActive: false })
        })
      );
    });

    it('should combine multiple filters', async () => {
      const result = await service.findAll({ 
        category: 'Electronics',
        isActive: true,
        search: 'laptop'
      });
      
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Electronics',
            isActive: true
          })
        })
      );
    });

    it('should handle empty filter object', async () => {
      const result = await service.findAll({});
      
      expect(repository.find).toHaveBeenCalled();
    });
  });

  // ===== VALIDATION BRANCHES =====
  describe('Validation Logic', () => {
    it('should reject negative costPrice', async () => {
      const dto = {
        ...createProductDto,
        costPrice: -1000,
      };
      
      await expect(service.create(dto))
        .rejects.toThrow('Giá vốn không được âm');
    });

    it('should reject negative sellingPrice', async () => {
      const dto = {
        ... createProductDto,
        sellingPrice: -5000,
      };
      
      await expect(service.create(dto))
        .rejects.toThrow('Giá bán không được âm');
    });

    it('should reject invalid VAT rate', async () => {
      const dto = {
        ... createProductDto,
        vatRate: 15, // Invalid rate (only 0, 5, 8, 10 allowed)
      };
      
      await expect(service.create(dto))
        .rejects.toThrow('Thuế suất VAT không hợp lệ');
    });

    it('should reject minStockLevel > maxStockLevel', async () => {
      const dto = {
        ...createProductDto,
        minStockLevel: 100,
        maxStockLevel: 50,
      };
      
      await expect(service.create(dto))
        .rejects.toThrow('Mức tồn kho tối thiểu không được lớn hơn tối đa');
    });

    it('should accept minStockLevel = maxStockLevel', async () => {
      const dto = {
        ...createProductDto,
        minStockLevel: 50,
        maxStockLevel: 50,
      };
      
      const result = await service.create(dto);
      expect(result. minStockLevel).toBe(50);
      expect(result. maxStockLevel).toBe(50);
    });
  });

  // ===== STOCK STATUS BRANCHES =====
  describe('Stock Status Logic', () => {
    it('should return "below_min" when stock < minStockLevel', async () => {
      const product = mockProduct();
      product.currentStock = 5;
      product.minStockLevel = 10;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(product);
      
      const result = await service. getStockStatus(product.id);
      expect(result.status).toBe('below_min');
    });

    it('should return "above_max" when stock > maxStockLevel', async () => {
      const product = mockProduct();
      product.currentStock = 200;
      product.maxStockLevel = 100;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(product);
      
      const result = await service. getStockStatus(product.id);
      expect(result.status).toBe('above_max');
    });

    it('should return "optimal" when minStock <= stock <= maxStock', async () => {
      const product = mockProduct();
      product.currentStock = 50;
      product.minStockLevel = 10;
      product.maxStockLevel = 100;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(product);
      
      const result = await service.getStockStatus(product.id);
      expect(result.status).toBe('optimal');
    });

    it('should return "out_of_stock" when stock = 0', async () => {
      const product = mockProduct();
      product.currentStock = 0;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(product);
      
      const result = await service. getStockStatus(product.id);
      expect(result.status).toBe('out_of_stock');
    });
  });
});
```

**Expected Improvement**:  25.8% → 70%+ branches ✅

---

#### ✅ Task 3.2: QuotationsService - Branch Coverage
**File**: `src/modules/quotations/quotations. service.spec.ts`

**Thêm tests cho các nhánh còn thiếu:**

```typescript
describe('QuotationsService - Branch Coverage', () => {
  // ===== ERROR HANDLING BRANCHES =====
  describe('Error Handling', () => {
    it('should throw error when quotation not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      
      await expect(service.update('invalid-id', updateDto))
        .rejects.toThrow('Không tìm thấy báo giá');
    });

    it('should throw error when deleting confirmed quotation', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus.CONFIRMED;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);
      
      await expect(service. remove(quotation.id))
        .rejects.toThrow('Không thể xóa báo giá đã xác nhận');
    });

    it('should throw error when updating expired quotation', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus.EXPIRED;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);
      
      await expect(service.update(quotation.id, updateDto))
        .rejects.toThrow('Không thể cập nhật báo giá đã hết hạn');
    });

    it('should throw error when customer not found', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);
      
      await expect(service. create(createDto))
        .rejects.toThrow('Không tìm thấy khách hàng');
    });

    it('should throw error when product not found in item', async () => {
      const dto = {
        ...createDto,
        items: [{
          productId: 'invalid-product-id',
          quantity: 10,
          unitPrice: 50000
        }]
      };
      
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);
      
      await expect(service. create(dto))
        .rejects.toThrow('Không tìm thấy sản phẩm');
    });
  });

  // ===== STATUS TRANSITION BRANCHES =====
  describe('Status Transitions', () => {
    it('should allow DRAFT → SENT transition', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus.DRAFT;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);
      
      const result = await service.updateStatus(quotation.id, QuotationStatus. SENT);
      expect(result.status).toBe(QuotationStatus.SENT);
    });

    it('should allow SENT → CONFIRMED transition', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus.SENT;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);
      
      const result = await service.updateStatus(quotation. id, QuotationStatus. CONFIRMED);
      expect(result. status).toBe(QuotationStatus.CONFIRMED);
    });

    it('should allow SENT → REJECTED transition', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus.SENT;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);
      
      const result = await service.updateStatus(quotation.id, QuotationStatus.REJECTED);
      expect(result.status).toBe(QuotationStatus.REJECTED);
    });

    it('should reject CONFIRMED → DRAFT transition', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus.CONFIRMED;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);
      
      await expect(service.updateStatus(quotation.id, QuotationStatus.DRAFT))
        .rejects.toThrow('Không thể chuyển trạng thái từ CONFIRMED về DRAFT');
    });

    it('should reject EXPIRED → CONFIRMED transition', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus.EXPIRED;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);
      
      await expect(service.updateStatus(quotation.id, QuotationStatus. CONFIRMED))
        .rejects.toThrow('Không thể xác nhận báo giá đã hết hạn');
    });

    it('should allow any status → CANCELLED transition', async () => {
      const statuses = [
        QuotationStatus.DRAFT,
        QuotationStatus.SENT,
        QuotationStatus.CONFIRMED,
      ];

      for (const status of statuses) {
        const quotation = mockQuotation();
        quotation.status = status;
        
        jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);
        
        const result = await service.updateStatus(quotation.id, QuotationStatus.CANCELLED);
        expect(result.status).toBe(QuotationStatus.CANCELLED);
      }
    });
  });

  // ===== DISCOUNT CALCULATION BRANCHES =====
  describe('Discount Calculations', () => {
    it('should apply percentage discount correctly', async () => {
      const item = {
        productId: 'prod-1',
        quantity: 10,
        unitPrice: 100000,
        discountType: 'PERCENTAGE',
        discountValue:  10,
      };

      const result = service.calculateItemTotal(item);
      
      expect(result.subtotal).toBe(1000000);
      expect(result.discount).toBe(100000); // 10%
      expect(result.total).toBe(900000);
    });

    it('should apply fixed discount correctly', async () => {
      const item = {
        productId: 'prod-1',
        quantity:  10,
        unitPrice:  100000,
        discountType: 'FIXED',
        discountValue: 50000,
      };

      const result = service.calculateItemTotal(item);
      
      expect(result.subtotal).toBe(1000000);
      expect(result.discount).toBe(50000);
      expect(result.total).toBe(950000);
    });

    it('should handle no discount', async () => {
      const item = {
        productId: 'prod-1',
        quantity: 10,
        unitPrice: 100000,
        discountType: 'NONE',
        discountValue: 0,
      };

      const result = service.calculateItemTotal(item);
      
      expect(result.subtotal).toBe(1000000);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(1000000);
    });

    it('should cap discount at 100% for percentage type', async () => {
      const item = {
        productId: 'prod-1',
        quantity: 10,
        unitPrice: 100000,
        discountType: 'PERCENTAGE',
        discountValue:  150, // Invalid:  >100%
      };

      await expect(service.calculateItemTotal(item))
        .rejects.toThrow('Giảm giá phần trăm không được vượt quá 100%');
    });

    it('should prevent fixed discount > subtotal', async () => {
      const item = {
        productId: 'prod-1',
        quantity: 10,
        unitPrice: 100000,
        discountType: 'FIXED',
        discountValue:  2000000, // > subtotal
      };

      await expect(service.calculateItemTotal(item))
        .rejects.toThrow('Giảm giá cố định không được lớn hơn tổng tiền');
    });
  });

  // ===== DATE VALIDATION BRANCHES =====
  describe('Date Validations', () => {
    it('should accept validUntil in the future', async () => {
      const dto = {
        ...createDto,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
      };

      const result = await service.create(dto);
      expect(result.validUntil).toBeInstanceOf(Date);
    });

    it('should reject validUntil in the past', async () => {
      const dto = {
        ...createDto,
        validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // -1 day
      };

      await expect(service.create(dto))
        .rejects.toThrow('Ngày hết hạn không được là quá khứ');
    });

    it('should reject validUntil before date', async () => {
      const dto = {
        ...createDto,
        date: new Date('2025-01-10'),
        validUntil: new Date('2025-01-05'), // Before date
      };

      await expect(service.create(dto))
        .rejects.toThrow('Ngày hết hạn phải sau ngày báo giá');
    });

    it('should allow validUntil = date + 1 day', async () => {
      const date = new Date('2025-01-10');
      const validUntil = new Date('2025-01-11');
      
      const dto = { ...createDto, date, validUntil };

      const result = await service.create(dto);
      expect(result. validUntil. getTime()).toBeGreaterThan(result.date.getTime());
    });
  });

  // ===== EXPIRY CHECK BRANCHES =====
  describe('Expiry Checks', () => {
    it('should mark as expired when validUntil < now', async () => {
      const quotation = mockQuotation();
      quotation.validUntil = new Date(Date.now() - 1000); // Past
      quotation.status = QuotationStatus.SENT;
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);

      await service.checkExpiry(quotation. id);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: QuotationStatus.EXPIRED })
      );
    });

    it('should NOT mark as expired when validUntil > now', async () => {
      const quotation = mockQuotation();
      quotation.validUntil = new Date(Date.now() + 100000); // Future
      quotation. status = QuotationStatus. SENT;
      
      jest. spyOn(repository, 'findOne').mockResolvedValue(quotation);

      await service.checkExpiry(quotation. id);

      expect(repository. save).not.toHaveBeenCalled();
    });

    it('should NOT mark confirmed quotations as expired', async () => {
      const quotation = mockQuotation();
      quotation.validUntil = new Date(Date.now() - 1000); // Past
      quotation.status = QuotationStatus.CONFIRMED; // Already confirmed
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(quotation);

      await service.checkExpiry(quotation.id);

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  // ===== FILTERING BRANCHES =====
  describe('Filtering Logic', () => {
    it('should filter by status', async () => {
      await service.findAll({ status: QuotationStatus. CONFIRMED });
      
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: QuotationStatus. CONFIRMED })
        })
      );
    });

    it('should filter by customerId', async () => {
      await service.findAll({ customerId: 'cust-123' });
      
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-123' })
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      await service.findAll({ startDate, endDate });
      
      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.any(Object) // Between condition
          })
        })
      );
    });

    it('should combine multiple filters', async () => {
      await service.findAll({
        status: QuotationStatus.SENT,
        customerId: 'cust-123',
        startDate: new Date('2025-01-01'),
      });
      
      expect(repository.find).toHaveBeenCalledWith(
        expect. objectContaining({
          where:  expect.objectContaining({
            status: QuotationStatus. SENT,
            customerId: 'cust-123',
          })
        })
      );
    });
  });
});
```

**Expected Improvement**: 44.44% → 70%+ branches ✅

---

#### ✅ Task 3.3: PurchaseOrdersService - Branch Coverage
**File**: `src/modules/purchase-orders/purchase-orders.service. spec.ts`

**Thêm tests tương tự QuotationsService với focus:**
- ✅ Error handling (not found, invalid status)
- ✅ Status transitions (DRAFT → APPROVED → RECEIVED)
- ✅ Date validations (expectedDeliveryDate > orderDate)
- ✅ Supplier validation
- ✅ Item quantity/price validation
- ✅ Filtering branches

**Expected Improvement**: 49% → 70%+ overall coverage ✅

---

### GIAI ĐOẠN 3B:  Tests Cho Services Còn Lại (Tuần 2-3)

#### ✅ Task 3.4: SalesOrdersService Tests (PRIORITY CAO NHẤT)
**File**: `src/modules/sales-orders/sales-orders.service.spec. ts`

**Tạo test suite hoàn chỉnh (30-35 tests):**

```typescript
describe('SalesOrdersService', () => {
  let service: SalesOrdersService;
  let repository: Repository<SalesOrder>;
  let customerRepository: Repository<Customer>;
  let productRepository: Repository<Product>;
  let quotationRepository: Repository<Quotation>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        {
          provide: getRepositoryToken(SalesOrder),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Customer),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Product),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Quotation),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<SalesOrdersService>(SalesOrdersService);
    repository = module.get(getRepositoryToken(SalesOrder));
    customerRepository = module. get(getRepositoryToken(Customer));
    productRepository = module. get(getRepositoryToken(Product));
    quotationRepository = module.get(getRepositoryToken(Quotation));
  });

  // ===== BASIC CRUD (8 tests) =====
  describe('create', () => {
    it('should create new sales order successfully', async () => {
      const dto = mockCreateSalesOrderDto();
      const customer = mockCustomer();
      const product = mockProduct();
      
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(customer);
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(product);
      jest.spyOn(repository, 'save').mockResolvedValue(mockSalesOrder());

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.customerId).toBe(dto.customerId);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw error when customer not found', async () => {
      const dto = mockCreateSalesOrderDto();
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      await expect(service. create(dto))
        .rejects.toThrow('Không tìm thấy khách hàng');
    });

    it('should generate unique order number', async () => {
      const dto = mockCreateSalesOrderDto();
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer());
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct());
      
      const order1 = await service.create(dto);
      const order2 = await service.create(dto);

      expect(order1.orderNumber).not.toBe(order2.orderNumber);
    });

    it('should calculate totals correctly', async () => {
      const dto = {
        customerId: 'cust-1',
        items: [
          { productId: 'prod-1', quantity: 10, unitPrice: 100000, vatRate: 10 },
          { productId:  'prod-2', quantity:  5, unitPrice: 200000, vatRate: 10 },
        ],
      };

      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer());
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct());

      const result = await service.create(dto);

      expect(result.subtotal).toBe(2000000); // 10*100k + 5*200k
      expect(result.taxAmount).toBe(200000); // 10%
      expect(result.totalAmount).toBe(2200000);
    });
  });

  describe('findAll', () => {
    it('should return paginated sales orders', async () => {
      const orders = [mockSalesOrder(), mockSalesOrder()];
      jest.spyOn(repository, 'find').mockResolvedValue(orders);

      const result = await service.findAll({ page: 1, limit:  10 });

      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      await service.findAll({ status: SalesOrderStatus.CONFIRMED });

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: SalesOrderStatus.CONFIRMED })
        })
      );
    });

    it('should filter by customer', async () => {
      await service.findAll({ customerId: 'cust-123' });

      expect(repository. find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-123' })
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await service.findAll({ startDate, endDate });

      expect(repository.find).toHaveBeenCalled();
    });
  });

  // ===== BUSINESS LOGIC (10 tests) =====
  describe('Business Logic', () => {
    it('should apply discount correctly - percentage type', async () => {
      const dto = {
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 10, unitPrice: 100000 }],
        discountType: 'PERCENTAGE',
        discountValue:  10,
      };

      const result = await service.create(dto);

      expect(result.subtotal).toBe(1000000);
      expect(result.discountAmount).toBe(100000);
      expect(result.totalAmount).toBe(900000 * 1.1); // +10% VAT
    });

    it('should apply discount correctly - fixed type', async () => {
      const dto = {
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 10, unitPrice: 100000 }],
        discountType: 'FIXED',
        discountValue: 50000,
      };

      const result = await service.create(dto);

      expect(result.discountAmount).toBe(50000);
      expect(result.totalAmount).toBe(950000 * 1.1);
    });

    it('should calculate VAT for multiple rates', async () => {
      const dto = {
        customerId:  'cust-1',
        items: [
          { productId: 'prod-1', quantity: 10, unitPrice:  100000, vatRate: 0 },
          { productId: 'prod-2', quantity: 5, unitPrice: 200000, vatRate: 10 },
        ],
      };

      const result = await service. create(dto);

      expect(result.taxAmount).toBe(100000); // Only 10% on 2nd item
    });

    it('should round VND correctly (no decimals)', async () => {
      const dto = {
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 3, unitPrice: 99999 }],
        discountType: 'PERCENTAGE',
        discountValue: 10,
      };

      const result = await service.create(dto);

      expect(result.totalAmount % 1).toBe(0); // No decimals
    });

    it('should validate quantity > 0', async () => {
      const dto = {
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 0, unitPrice: 100000 }],
      };

      await expect(service.create(dto))
        .rejects.toThrow('Số lượng phải lớn hơn 0');
    });

    it('should validate unitPrice >= 0', async () => {
      const dto = {
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 10, unitPrice:  -1000 }],
      };

      await expect(service.create(dto))
        .rejects.toThrow('Đơn giá không được âm');
    });

    it('should check product stock availability', async () => {
      const product = mockProduct();
      product.currentStock = 5;

      const dto = {
        customerId:  'cust-1',
        items: [{ productId: 'prod-1', quantity: 10, unitPrice: 100000 }],
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(product);

      await expect(service.create(dto))
        .rejects.toThrow('Sản phẩm không đủ hàng trong kho');
    });

    it('should apply customer default discount', async () => {
      const customer = mockCustomer();
      customer.defaultDiscountPercent = 5;

      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(customer);

      const dto = {
        customerId:  'cust-1',
        items: [{ productId:  'prod-1', quantity:  10, unitPrice: 100000 }],
      };

      const result = await service.create(dto);

      expect(result.discountAmount).toBe(50000); // 5% of 1M
    });

    it('should handle zero total edge case', async () => {
      const dto = {
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 10, unitPrice: 0 }],
      };

      const result = await service.create(dto);

      expect(result. totalAmount).toBe(0);
    });

    it('should handle large quantity (999999)', async () => {
      const dto = {
        customerId: 'cust-1',
        items: [{ productId: 'prod-1', quantity: 999999, unitPrice:  100 }],
      };

      const result = await service.create(dto);

      expect(result.totalAmount).toBeGreaterThan(0);
    });
  });

  // ===== STATUS WORKFLOW (7 tests) =====
  describe('Status Workflow', () => {
    it('should allow DRAFT → CONFIRMED transition', async () => {
      const order = mockSalesOrder();
      order.status = SalesOrderStatus.DRAFT;

      jest.spyOn(repository, 'findOne').mockResolvedValue(order);

      const result = await service.updateStatus(order.id, SalesOrderStatus.CONFIRMED);

      expect(result. status).toBe(SalesOrderStatus.CONFIRMED);
    });

    it('should allow CONFIRMED → PROCESSING transition', async () => {
      const order = mockSalesOrder();
      order.status = SalesOrderStatus.CONFIRMED;

      jest.spyOn(repository, 'findOne').mockResolvedValue(order);

      const result = await service.updateStatus(order.id, SalesOrderStatus.PROCESSING);

      expect(result.status).toBe(SalesOrderStatus.PROCESSING);
    });

    it('should allow PROCESSING → COMPLETED transition', async () => {
      const order = mockSalesOrder();
      order.status = SalesOrderStatus.PROCESSING;

      jest.spyOn(repository, 'findOne').mockResolvedValue(order);

      const result = await service.updateStatus(order.id, SalesOrderStatus.COMPLETED);

      expect(result.status).toBe(SalesOrderStatus.COMPLETED);
    });

    it('should reject COMPLETED → DRAFT transition', async () => {
      const order = mockSalesOrder();
      order.status = SalesOrderStatus.COMPLETED;

      jest.spyOn(repository, 'findOne').mockResolvedValue(order);

      await expect(service.updateStatus(order.id, SalesOrderStatus. DRAFT))
        .rejects.toThrow('Không thể chuyển trạng thái từ COMPLETED về DRAFT');
    });

    it('should allow any status → CANCELLED transition', async () => {
      const statuses = [
        SalesOrderStatus.DRAFT,
        SalesOrderStatus. CONFIRMED,
        SalesOrderStatus.PROCESSING,
      ];

      for (const status of statuses) {
        const order = mockSalesOrder();
        order.status = status;

        jest.spyOn(repository, 'findOne').mockResolvedValue(order);

        const result = await service.updateStatus(order.id, SalesOrderStatus.CANCELLED);
        expect(result.status).toBe(SalesOrderStatus.CANCELLED);
      }
    });

    it('should NOT allow transition from CANCELLED', async () => {
      const order = mockSalesOrder();
      order.status = SalesOrderStatus.CANCELLED;

      jest. spyOn(repository, 'findOne').mockResolvedValue(order);

      await expect(service.updateStatus(order.id, SalesOrderStatus.CONFIRMED))
        .rejects.toThrow('Không thể thay đổi trạng thái đơn hàng đã hủy');
    });

    it('should update stock when status = COMPLETED', async () => {
      const order = mockSalesOrder();
      order.status = SalesOrderStatus.PROCESSING;
      order.items = [
        { productId:  'prod-1', quantity:  10 },
      ];

      const product = mockProduct();
      product.currentStock = 100;

      jest.spyOn(repository, 'findOne').mockResolvedValue(order);
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(product);

      await service.updateStatus(order.id, SalesOrderStatus.COMPLETED);

      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ currentStock: 90 })
      );
    });
  });

  // ===== CONVERT FROM QUOTATION (3 tests) =====
  describe('Convert from Quotation', () => {
    it('should convert confirmed quotation to sales order', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus. CONFIRMED;

      jest.spyOn(quotationRepository, 'findOne').mockResolvedValue(quotation);

      const result = await service.createFromQuotation(quotation. id);

      expect(result. customerId).toBe(quotation.customerId);
      expect(result.items).toEqual(quotation.items);
      expect(result.quotationId).toBe(quotation.id);
    });

    it('should reject conversion of non-confirmed quotation', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus.DRAFT;

      jest. spyOn(quotationRepository, 'findOne').mockResolvedValue(quotation);

      await expect(service.createFromQuotation(quotation.id))
        .rejects.toThrow('Chỉ có thể chuyển đổi báo giá đã xác nhận');
    });

    it('should mark quotation as converted', async () => {
      const quotation = mockQuotation();
      quotation.status = QuotationStatus. CONFIRMED;

      jest.spyOn(quotationRepository, 'findOne').mockResolvedValue(quotation);

      await service.createFromQuotation(quotation.id);

      expect(quotationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isConverted: true })
      );
    });
  });

  // ===== ERROR HANDLING (5 tests) =====
  describe('Error Handling', () => {
    it('should throw error when sales order not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id'))
        .rejects.toThrow('Không tìm thấy đơn hàng');
    });

    it('should handle database connection error', async () => {
      jest.spyOn(repository, 'find').mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.findAll())
        .rejects.toThrow('Database error');
    });

    it('should validate deliveryDate >= orderDate', async () => {
      const dto = {
        customerId: 'cust-1',
        orderDate: new Date('2025-01-10'),
        deliveryDate: new Date('2025-01-05'), // Before order date
        items: [],
      };

      await expect(service.create(dto))
        .rejects.toThrow('Ngày giao hàng không được trước ngày đặt hàng');
    });

    it('should throw error when product not found', async () => {
      const dto = {
        customerId:  'cust-1',
        items: [{ productId: 'invalid-prod', quantity: 10, unitPrice: 1000 }],
      };

      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer());
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(dto))
        .rejects.toThrow('Không tìm thấy sản phẩm');
    });

    it('should handle concurrent updates gracefully', async () => {
      const order = mockSalesOrder();
      jest.spyOn(repository, 'findOne').mockResolvedValue(order);

      const update1 = service.update(order.id, { notes: 'Update 1' });
      const update2 = service.update(order.id, { notes: 'Update 2' });

      await Promise.all([update1, update2]);

      expect(repository. save).toHaveBeenCalledTimes(2);
    });
  });
});
```

**Expected Coverage**:  0% → 70%+ ✅  
**Tests Count**: ~35 tests

---

#### ✅ Task 3. 5: InventoryService Tests
**File**: `src/modules/inventory/inventory.service.spec.ts`

**Focus Areas (25-30 tests):**
- ✅ Stock adjustments (IN/OUT transactions)
- ✅ Batch/Serial tracking
- ✅ Expiry date management
- ✅ Stock level alerts
- ✅ Transaction history
- ✅ Multi-location inventory

**Expected Coverage**: 0% → 70%+ ✅

---

#### ✅ Task 3.6: SuppliersService Tests
**File**:  `src/modules/suppliers/suppliers.service.spec.ts`

**Focus Areas (20-25 tests):**
- ✅ CRUD operations
- ✅ Vietnamese phone validation (similar to customers)
- ✅ Tax code validation
- ✅ Email validation
- ✅ Search & filtering
- ✅ Active/inactive status

**Expected Coverage**: 0% → 70%+ ✅

---

#### ✅ Task 3.7: AccountingService Tests
**File**: `src/modules/accounting/accounting.service.spec.ts`

**Focus Areas (20-25 tests):**
- ✅ Journal entries
- ✅ Debit/Credit balance
- ✅ Account types (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- ✅ VND rounding
- ✅ Date range reporting
- ✅ Balance calculations

**Expected Coverage**: 0% → 70%+ ✅

---

### GIAI ĐOẠN 3C:  Integration Tests & E2E (Tuần 4)

#### ✅ Task 3.8: Integration Tests
**File**: `test/integration/workflows. spec.ts`

**Test các workflows business:**

```typescript
describe('Integration Tests - Business Workflows', () => {
  // ===== CUSTOMER TO SALES ORDER FLOW =====
  describe('Customer → Quotation → Sales Order', () => {
    it('should complete full sales flow', async () => {
      // Step 1: Create customer
      const customer = await customersService.create({
        name: 'Công ty ABC',
        type: CustomerType.COMPANY,
        phone: '0987654321',
        email: 'abc@example.com',
      });

      // Step 2: Create quotation
      const quotation = await quotationsService.create({
        customerId: customer.id,
        items: [
          { productId: 'prod-1', quantity: 10, unitPrice: 100000 },
        ],
        validUntil: new Date(Date. now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Step 3: Confirm quotation
      await quotationsService.updateStatus(quotation.id, QuotationStatus.CONFIRMED);

      // Step 4: Convert to sales order
      const salesOrder = await salesOrdersService.createFromQuotation(quotation. id);

      // Step 5: Process and complete order
      await salesOrdersService.updateStatus(salesOrder. id, SalesOrderStatus. CONFIRMED);
      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.PROCESSING);
      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.COMPLETED);

      // Verify final state
      expect(salesOrder.customerId).toBe(customer.id);
      expect(salesOrder. status).toBe(SalesOrderStatus.COMPLETED);
      
      const updatedQuotation = await quotationsService. findOne(quotation.id);
      expect(updatedQuotation.isConverted).toBe(true);
    });
  });

  // ===== SUPPLIER TO PURCHASE ORDER FLOW =====
  describe('Supplier → Purchase Order → Inventory', () => {
    it('should complete full purchase flow', async () => {
      // Step 1: Create supplier
      const supplier = await suppliersService.create({
        name: 'Nhà cung cấp XYZ',
        phone: '0912345678',
        email: 'xyz@supplier.com',
      });

      // Step 2: Create purchase order
      const po = await purchaseOrdersService. create({
        supplierId:  supplier.id,
        items: [
          { productId: 'prod-1', quantity: 100, unitPrice: 80000 },
        ],
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Step 3: Approve PO
      await purchaseOrdersService.updateStatus(po.id, POStatus.APPROVED);

      // Step 4: Receive goods
      await purchaseOrdersService.updateStatus(po.id, POStatus.RECEIVED);

      // Step 5: Verify inventory updated
      const product = await productsService.findOne('prod-1');
      expect(product.currentStock).toBeGreaterThan(0);

      // Step 6: Verify inventory transaction created
      const transactions = await inventoryService.findTransactions({
        productId: 'prod-1',
        type: 'IN',
      });
      expect(transactions.length).toBeGreaterThan(0);
    });
  });

  // ===== INVENTORY ADJUSTMENT FLOW =====
  describe('Inventory Adjustments', () => {
    it('should handle stock OUT when sales order completed', async () => {
      const initialStock = 100;
      const orderQuantity = 10;

      // Setup product with stock
      const product = await productsService.create({
        ... mockProductDto(),
        currentStock: initialStock,
      });

      // Create and complete sales order
      const salesOrder = await salesOrdersService.create({
        customerId: 'cust-1',
        items: [
          { productId:  product.id, quantity: orderQuantity, unitPrice: 100000 },
        ],
      });

      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.CONFIRMED);
      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.PROCESSING);
      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.COMPLETED);

      // Verify stock reduced
      const updatedProduct = await productsService.findOne(product.id);
      expect(updatedProduct.currentStock).toBe(initialStock - orderQuantity);

      // Verify transaction recorded
      const transactions = await inventoryService.findTransactions({
        productId: product.id,
        type: 'OUT',
      });
      expect(transactions[0].quantity).toBe(orderQuantity);
    });
  });

  // ===== ACCOUNTING INTEGRATION =====
  describe('Accounting Integration', () => {
    it('should create journal entries when sales order completed', async () => {
      const salesOrder = await salesOrdersService.create({
        customerId: 'cust-1',
        items: [
          { productId: 'prod-1', quantity: 10, unitPrice:  100000 },
        ],
      });

      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.COMPLETED);

      // Verify accounting entries created
      const entries = await accountingService.findEntries({
        referenceType: 'SALES_ORDER',
        referenceId: salesOrder.id,
      });

      expect(entries.length).toBeGreaterThan(0);
      
      // Verify debit/credit balance
      const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
      expect(totalDebit).toBe(totalCredit);
    });
  });
});
```

**Expected Tests**:  10-15 integration tests

---

#### ✅ Task 3.9: E2E Tests (Optional)
**File**: `test/e2e/api.spec.ts`

**Test các API endpoints:**

```typescript
describe('E2E Tests - API Endpoints', () => {
  describe('POST /customers', () => {
    it('should create customer via API', async () => {
      const response = await request(app. getHttpServer())
        .post('/customers')
        .send({
          name: 'Test Customer',
          type: 'INDIVIDUAL',
          phone: '0987654321',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Test Customer');
    });

    it('should reject invalid phone number', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Test Customer',
          phone: '123', // Invalid
        })
        .expect(400);
    });
  });

  describe('GET /customers', () => {
    it('should return paginated customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers?page=1&limit=10')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    it('should filter by search term', async () => {
      const response = await request(app. getHttpServer())
        .get('/customers?search=ABC')
        .expect(200);

      expect(response.body. data. length).toBeGreaterThanOrEqual(0);
    });
  });

  // Similar tests for other endpoints...
});
```

**Expected Tests**: 20-30 E2E tests (optional)

---

## 📊 KẾT QUẢ MONG ĐỢI PHASE 3

### Coverage Goals: 

| Service | Hiện tại | Mục tiêu | Tests |
|---------|----------|----------|-------|
| CustomersService | 92.3% ✅ | Maintain | - |
| ProductsService | 51% (25. 8% branches) | **70%+** | +15 tests |
| QuotationsService | 58% (44% branches) | **70%+** | +12 tests |
| PurchaseOrdersService | 49% | **70%+** | +10 tests |
| **SalesOrdersService** | 0% | **70%+** | +35 tests |
| **InventoryService** | 0% | **70%+** | +30 tests |
| **SuppliersService** | 0% | **70%+** | +25 tests |
| **AccountingService** | 0% | **70%+** | +25 tests |

### Test Statistics:

- **Current**:  116 tests
- **Phase 3 Target**: **~270 tests** (+150 tests)
- **Execution Time**: <10 seconds
- **Overall Project Coverage**: 22% → **60%+**

---

## 🎯 CHECKLIST

### Week 1: Branch Coverage
- [ ] ProductsService:  25. 8% → 70%+ branches (+15 tests)
- [ ] QuotationsService: 44% → 70%+ branches (+12 tests)
- [ ] PurchaseOrdersService: 49% → 70% overall (+10 tests)

### Week 2: New Services (Part 1)
- [ ] SalesOrdersService: 0% → 70% (+35 tests) - PRIORITY
- [ ] InventoryService: 0% → 70% (+30 tests)

### Week 3: New Services (Part 2)
- [ ] SuppliersService: 0% → 70% (+25 tests)
- [ ] AccountingService: 0% → 70% (+25 tests)

### Week 4: Integration & E2E
- [ ] Integration tests: Business workflows (+15 tests)
- [ ] E2E tests: API endpoints (+20 tests - optional)
- [ ] Performance optimization
- [ ] Documentation update

---

## 🚀 CÁCH CHẠY TESTS

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:cov

# Chạy tests cho service cụ thể
npm test -- products.service.spec.ts

# Chạy tests ở watch mode
npm test -- --watch

# Chạy integration tests
npm run test:integration

# Chạy E2E tests
npm run test:e2e
```

---

## 📝 GHI CHÚ

- **Test Quality > Test Quantity**: Focus on meaningful tests
- **Business Logic First**: Prioritize testing critical business rules
- **Vietnamese Compliance**: Validate tax rates, phone formats, currency
- **Edge Cases**: Always test boundary conditions
- **Error Handling**: Test all error paths
- **Performance**: Keep tests fast (<10s total)

---

## ✅ PHASE 3 SUCCESS CRITERIA

- [ ] Overall project coverage: **60%+**
- [ ] All services:  **70%+ coverage**
- [ ] Branch coverage: **70%+** for existing services
- [ ] Total tests: **270+**
- [ ] All tests passing ✅
- [ ] Execution time: <10 seconds
- [ ] No critical bugs in production logic
- [ ] Vietnamese business rules validated
- [ ] Integration workflows tested

---

**🎉 Hoàn thành Phase 3 = Production-Ready Test Suite! **