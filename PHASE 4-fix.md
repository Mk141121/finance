# PHASE 4 - ĐẠT 60% COVERAGE & HOÀN THIỆN TEST SUITE

## 🎯 MỤC TIÊU TỔNG QUAN

### Mục Tiêu Chính
- **Overall Coverage**: 28.87% → **60%+** (+31.13%, tăng 108%)
- **Total Tests**: 225 → **360-370 tests** (+135-145 tests)
- **Services ≥70%**: 3/8 → **8/8 services** (100%)
- **Integration Tests**: 0 → **15 tests**
- **E2E Tests**:  0 → **20 tests** (optional)

### Timeline
**4-5 tuần** (có thể rút ngắn nếu làm song song)

### Success Criteria
- ✅ All 8 services達到 70%+ coverage
- ✅ Overall project coverage ≥60%
- ✅ Zero test failures (100% pass rate)
- ✅ Execution time <15 seconds
- ✅ Integration workflows tested
- ✅ Production-ready quality

---

## 📅 LỊCH TRÌNH CHI TIẾT

### Week 1: InventoryService (Priority 1 - CRITICAL) 🔥
**Target**: 0% → 70%+ coverage  
**Tests**: +30 tests  
**Effort**: 5-6 ngày

#### Day 1-2: Stock Transaction Tests (12 tests)
```typescript
describe('Stock Transactions', () => {
  // IN Transactions (4 tests)
  it('should create IN transaction and increase stock');
  it('should validate quantity > 0 for IN');
  it('should record transaction metadata (user, date, reason)');
  it('should support bulk IN transactions');

  // OUT Transactions (4 tests)
  it('should create OUT transaction and decrease stock');
  it('should prevent OUT when insufficient stock');
  it('should validate quantity > 0 for OUT');
  it('should support bulk OUT transactions');

  // Transaction History (4 tests)
  it('should calculate running balance correctly');
  it('should filter transactions by date range');
  it('should filter transactions by type (IN/OUT)');
  it('should filter transactions by product');
});
```

#### Day 3: Batch/Serial Tracking (8 tests)
```typescript
describe('Batch Management', () => {
  // Batch Creation (3 tests)
  it('should create batch on IN transaction with expiry');
  it('should prevent duplicate batch numbers');
  it('should validate batch number format');

  // Batch Tracking (3 tests)
  it('should track batch quantities (available/used)');
  it('should support FIFO batch picking');
  it('should handle partial batch usage');

  // Serial Numbers (2 tests)
  it('should track serial numbers for serialized products');
  it('should prevent duplicate serial numbers');
});
```

#### Day 4: Expiry Management (6 tests)
```typescript
describe('Expiry Management', () => {
  // Expiry Detection (3 tests)
  it('should flag near-expiry items (30 days warning)');
  it('should prevent selling expired batches');
  it('should calculate days until expiry');

  // Expiry Reporting (3 tests)
  it('should list all expiring products');
  it('should filter expiring items by days threshold');
  it('should support expiry notifications');
});
```

#### Day 5: Stock Alerts & Multi-Location (4 tests)
```typescript
describe('Stock Alerts', () => {
  // Alerts (2 tests)
  it('should alert when stock < minStockLevel');
  it('should alert when stock > maxStockLevel');

  // Multi-Location (2 tests)
  it('should track stock by location/warehouse');
  it('should support inter-location transfers');
});

describe('Error Handling', () => {
  // Standard errors (bonus coverage)
  it('should throw NotFoundException when transaction not found');
  it('should handle database errors gracefully');
  it('should prevent concurrent stock updates');
});
```

**Deliverables**:
- ✅ `inventory. service.spec.ts` (30 tests)
- ✅ 70%+ coverage
- ✅ All tests passing

---

### Week 2: SuppliersService (Priority 2 - HIGH) 🔥
**Target**: 0% → 70%+ coverage  
**Tests**: +25 tests  
**Effort**: 4-5 ngày

#### Day 1: CRUD Operations (8 tests)
```typescript
describe('SuppliersService', () => {
  // Create (3 tests)
  it('should create supplier successfully');
  it('should throw error when required fields missing');
  it('should prevent duplicate tax codes');

  // Read (3 tests)
  it('should find all suppliers with pagination');
  it('should find supplier by id');
  it('should throw NotFoundException when not found');

  // Update/Delete (2 tests)
  it('should update supplier successfully');
  it('should soft delete supplier');
});
```

#### Day 2: Vietnamese Validations (8 tests)
```typescript
describe('Validations', () => {
  // Phone Validation (2 tests)
  it('should accept valid Vietnamese phone:  0987654321');
  it('should reject invalid phone: 123');

  // Tax Code Validation (2 tests)
  it('should accept valid tax code: 10-13 digits');
  it('should reject invalid tax code format');

  // Email & Address (2 tests)
  it('should validate email format');
  it('should validate address fields (city, district)');

  // Business Rules (2 tests)
  it('should validate payment terms (7/15/30/60 days)');
  it('should handle special characters in name');
});
```

#### Day 3: Search & Filtering (5 tests)
```typescript
describe('Search and Filtering', () => {
  // Search (2 tests)
  it('should search by name (Vietnamese text)');
  it('should search by tax code');

  // Filtering (3 tests)
  it('should filter by isActive status');
  it('should filter by supplier type');
  it('should combine multiple filters (name + isActive)');
});
```

#### Day 4: Error Handling & Edge Cases (4 tests)
```typescript
describe('Error Handling', () => {
  it('should handle database connection errors');
  it('should handle concurrent updates gracefully');
  it('should validate null/undefined inputs');
  it('should handle empty search results');
});
```

**Deliverables**:
- ✅ `suppliers.service.spec.ts` (25 tests)
- ✅ 70%+ coverage
- ✅ Vietnamese validations complete

---

### Week 3: AccountingService (Priority 3 - MEDIUM) 📊
**Target**: 0% → 70%+ coverage  
**Tests**: +25 tests  
**Effort**: 5-6 ngày

#### Day 1-2: Journal Entries (8 tests)
```typescript
describe('Journal Entries', () => {
  // Entry Creation (4 tests)
  it('should create journal entry with balanced debit/credit');
  it('should reject unbalanced entries (debit ≠ credit)');
  it('should generate unique entry numbers');
  it('should support multi-line entries');

  // Entry Management (4 tests)
  it('should link entry to source document (SO, PO)');
  it('should validate account codes exist');
  it('should prevent duplicate entries');
  it('should support reversing entries');
});
```

#### Day 3: Account Types & Balance (6 tests)
```typescript
describe('Account Types', () => {
  // Account Type Rules (5 tests)
  it('should handle ASSET accounts (debit increases)');
  it('should handle LIABILITY accounts (credit increases)');
  it('should handle EQUITY accounts');
  it('should handle REVENUE accounts (credit increases)');
  it('should handle EXPENSE accounts (debit increases)');

  // Balance Calculation (1 test)
  it('should calculate account balance correctly');
});
```

#### Day 4: VND Calculations & Reports (6 tests)
```typescript
describe('Calculations', () => {
  // VND Rounding (2 tests)
  it('should round VND amounts (no decimals)');
  it('should handle large amounts (billions)');

  // Reports (4 tests)
  it('should generate profit/loss statement');
  it('should generate balance sheet');
  it('should filter by date range');
  it('should validate balance sheet equation (Assets = Liabilities + Equity)');
});
```

#### Day 5: Integration & Error Handling (5 tests)
```typescript
describe('Integration', () => {
  // Auto Entry Creation (3 tests)
  it('should create entries when sales order completed');
  it('should create entries when purchase order received');
  it('should create entries for payments');

  // Error Handling (2 tests)
  it('should handle database errors');
  it('should maintain audit trail');
});
```

**Deliverables**:
- ✅ `accounting.service.spec.ts` (25 tests)
- ✅ 70%+ coverage
- ✅ VND compliance validated

---

### Week 4: Refinement & Integration Tests 🔗
**Target**: 
- Improve QuotationsService:  58.42% → 70%+
- Add Integration Tests: 0 → 15 tests
- Add E2E Tests: 0 → 20 tests (optional)

#### Day 1: QuotationsService Improvement (+10 tests)
```typescript
describe('QuotationsService - Additional Coverage', () => {
  // Missing Error Branches (4 tests)
  it('should throw error when deleting confirmed quotation');
  it('should throw error when updating expired quotation');
  it('should handle database connection errors');
  it('should prevent concurrent updates');

  // Missing Calculation Branches (3 tests)
  it('should cap percentage discount at 100%');
  it('should prevent fixed discount > subtotal');
  it('should handle zero quantity edge case');

  // Missing Status Branches (3 tests)
  it('should reject EXPIRED → CONFIRMED transition');
  it('should allow any status → CANCELLED');
  it('should NOT mark confirmed quotations as expired');
});
```

**Expected**:  58.42% → 70%+ ✅

#### Day 2-3: Integration Tests (15 tests)
**File**: `test/integration/business-workflows.spec.ts`

```typescript
describe('Integration Tests - Business Workflows', () => {
  // ===== WORKFLOW 1: SALES FLOW (5 tests) =====
  describe('Customer → Quotation → Sales Order → Inventory', () => {
    it('should complete full sales flow successfully', async () => {
      // 1. Create customer
      const customer = await customersService.create({
        name: 'Công ty ABC',
        type: CustomerType. COMPANY,
        phone: '0987654321',
      });

      // 2. Create product with stock
      const product = await productsService.create({
        name: 'Laptop Dell',
        costPrice: 10000000,
        sellingPrice: 15000000,
        currentStock: 100,
      });

      // 3. Create quotation
      const quotation = await quotationsService.create({
        customerId: customer.id,
        items: [{
          productId: product.id,
          quantity: 10,
          unitPrice: 15000000,
        }],
        validUntil: new Date(Date. now() + 7 * 24 * 60 * 60 * 1000),
      });

      // 4. Confirm quotation
      await quotationsService.updateStatus(quotation.id, QuotationStatus.CONFIRMED);

      // 5. Convert to sales order
      const salesOrder = await salesOrdersService.createFromQuotation(quotation. id);
      expect(salesOrder.customerId).toBe(customer.id);

      // 6. Process order
      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.CONFIRMED);
      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.PROCESSING);
      
      // 7. Complete order (should reduce stock)
      await salesOrdersService.updateStatus(salesOrder. id, SalesOrderStatus. COMPLETED);

      // 8. Verify stock reduced
      const updatedProduct = await productsService. findOne(product.id);
      expect(updatedProduct.currentStock).toBe(90); // 100 - 10

      // 9. Verify inventory transaction created
      const transactions = await inventoryService.findTransactions({
        productId: product.id,
        type: 'OUT',
      });
      expect(transactions.length).toBe(1);
      expect(transactions[0].quantity).toBe(10);

      // 10. Verify quotation marked as converted
      const updatedQuotation = await quotationsService.findOne(quotation. id);
      expect(updatedQuotation.isConverted).toBe(true);
    });

    it('should prevent selling when insufficient stock');
    it('should apply customer default discount');
    it('should calculate multi-VAT rates correctly');
    it('should handle quotation expiry before conversion');
  });

  // ===== WORKFLOW 2: PURCHASE FLOW (5 tests) =====
  describe('Supplier → Purchase Order → Inventory → Accounting', () => {
    it('should complete full purchase flow successfully', async () => {
      // 1. Create supplier
      const supplier = await suppliersService.create({
        name: 'Nhà cung cấp XYZ',
        phone: '0912345678',
        taxCode: '0123456789',
      });

      // 2. Create product
      const product = await productsService.create({
        name: 'Mouse Logitech',
        costPrice:  200000,
        sellingPrice:  300000,
        currentStock: 0,
      });

      // 3. Create purchase order
      const po = await purchaseOrdersService. create({
        supplierId:  supplier.id,
        items: [{
          productId: product. id,
          quantity: 100,
          unitPrice: 200000,
        }],
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // 4. Approve PO
      await purchaseOrdersService.updateStatus(po. id, POStatus.APPROVED);

      // 5. Receive goods
      await purchaseOrdersService.updateStatus(po.id, POStatus.RECEIVED);

      // 6. Verify stock increased
      const updatedProduct = await productsService.findOne(product.id);
      expect(updatedProduct.currentStock).toBe(100);

      // 7. Verify inventory transaction
      const transactions = await inventoryService.findTransactions({
        productId: product.id,
        type: 'IN',
      });
      expect(transactions.length).toBe(1);
      expect(transactions[0].quantity).toBe(100);

      // 8. Verify accounting entries created
      const entries = await accountingService.findEntries({
        referenceType: 'PURCHASE_ORDER',
        referenceId: po.id,
      });
      expect(entries.length).toBeGreaterThan(0);

      // 9. Verify debit/credit balance
      const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
      expect(totalDebit).toBe(totalCredit);
    });

    it('should handle partial deliveries');
    it('should support batch tracking on receive');
    it('should validate expected delivery date');
    it('should prevent receiving cancelled PO');
  });

  // ===== WORKFLOW 3: INVENTORY ADJUSTMENTS (3 tests) =====
  describe('Inventory Adjustments', () => {
    it('should handle manual stock adjustment (damage/loss)', async () => {
      const product = await productsService.create({
        name: 'Test Product',
        currentStock: 100,
      });

      // Manual adjustment:  -10 (damaged goods)
      await inventoryService.createTransaction({
        productId: product. id,
        type: 'OUT',
        quantity: 10,
        reason: 'DAMAGED',
      });

      const updatedProduct = await productsService.findOne(product.id);
      expect(updatedProduct. currentStock).toBe(90);
    });

    it('should alert when stock below minimum level');
    it('should track expiry dates and prevent selling expired');
  });

  // ===== WORKFLOW 4: ACCOUNTING INTEGRATION (2 tests) =====
  describe('Accounting Integration', () => {
    it('should create balanced entries for sales order', async () => {
      const salesOrder = mockSalesOrder();
      await salesOrdersService.updateStatus(salesOrder.id, SalesOrderStatus.COMPLETED);

      const entries = await accountingService.findEntries({
        referenceType: 'SALES_ORDER',
        referenceId: salesOrder.id,
      });

      // Debit: Accounts Receivable
      // Credit: Revenue
      expect(entries.some(e => e.accountType === 'ASSET' && e.debit > 0)).toBe(true);
      expect(entries.some(e => e.accountType === 'REVENUE' && e.credit > 0)).toBe(true);
    });

    it('should create balanced entries for purchase order');
  });
});
```

**Expected**: 15 integration tests covering end-to-end workflows ✅

#### Day 4-5: E2E/API Tests (Optional - 20 tests)
**File**: `test/e2e/api-endpoints.spec.ts`

```typescript
describe('E2E Tests - API Endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports:  [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ===== CUSTOMERS API (4 tests) =====
  describe('POST /customers', () => {
    it('should create customer via API', async () => {
      const response = await request(app.getHttpServer())
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
          name: 'Test',
          phone: '123', // Invalid
        })
        .expect(400);
    });
  });

  describe('GET /customers', () => {
    it('should return paginated customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers? page=1&limit=10')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(0);
    });

    it('should filter by search term', async () => {
      await request(app.getHttpServer())
        .get('/customers?search=ABC')
        .expect(200);
    });
  });

  // ===== PRODUCTS API (4 tests) =====
  describe('POST /products', () => {
    it('should create product with valid VAT rate');
    it('should reject invalid VAT rate (15%)');
    it('should calculate profit margin automatically');
    it('should validate minStockLevel <= maxStockLevel');
  });

  // ===== QUOTATIONS API (4 tests) =====
  describe('POST /quotations', () => {
    it('should create quotation');
    it('should reject expired validUntil date');
    it('should calculate totals with discounts');
    it('should link to customer');
  });

  // ===== SALES ORDERS API (4 tests) =====
  describe('POST /sales-orders', () => {
    it('should create sales order');
    it('should prevent insufficient stock sales');
    it('should convert from quotation');
    it('should update status (DRAFT → CONFIRMED)');
  });

  // ===== PURCHASE ORDERS API (4 tests) =====
  describe('POST /purchase-orders', () => {
    it('should create purchase order');
    it('should validate supplier exists');
    it('should validate expected delivery date');
    it('should update status (DRAFT → APPROVED → RECEIVED)');
  });
});
```

**Expected**: 20 E2E tests (optional) ✅

---

## 📊 PROJECTED RESULTS

### Coverage Targets by Service

| Service | Current | Week 1 | Week 2 | Week 3 | Week 4 | Final Target |
|---------|---------|--------|--------|--------|--------|--------------|
| CustomersService | 92.3% | - | - | - | - | 92.3% ✅ |
| ProductsService | 71.62% | - | - | - | - | 71.62% ✅ |
| SalesOrdersService | 98.88% | - | - | - | - | 98.88% ✅ |
| **InventoryService** | 0% | **70%** | - | - | - | **70%** 🎯 |
| **SuppliersService** | 0% | - | **70%** | - | - | **70%** 🎯 |
| **AccountingService** | 0% | - | - | **70%** | - | **70%** 🎯 |
| **QuotationsService** | 58.42% | - | - | - | **70%** | **70%** 🎯 |
| PurchaseOrdersService | 50. 51% | - | - | - | **70%** | **70%** 🎯 |

**Result**: 8/8 services ≥70% ✅

### Overall Statistics

```
┌─────────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Metric                  │ Current  │ Week 2   │ Week 4   │ Growth   │
├─────────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Total Tests             │ 225      │ 280      │ 360-380  │ +60-68%  │
│ Test Suites             │ 6        │ 8        │ 9-10     │ +50-67%  │
│ Overall Coverage        │ 28.87%   │ ~40%     │ 60%+     │ +108%    │
│ Services ≥70%           │ 3/8      │ 5/8      │ 8/8      │ +167%    │
│ Integration Tests       │ 0        │ 0        │ 15       │ NEW      │
│ E2E Tests               │ 0        │ 0        │ 20       │ NEW      │
│ Execution Time          │ 12.5s    │ <15s     │ <15s     │ Fast ✅  │
└─────────────────────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 🎯 MILESTONES & DELIVERABLES

### Milestone 1: Week 1 Complete ✅
**Date**: [Week 1 End]  
**Deliverables**:
- ✅ `inventory.service.spec.ts` (30 tests)
- ✅ InventoryService coverage:  70%+
- ✅ Stock transactions tested
- ✅ Batch/expiry management tested

**Success Criteria**:
- All 30 new tests passing
- Coverage ≥70%
- Execution time increase <2s

---

### Milestone 2: Week 2 Complete ✅
**Date**: [Week 2 End]  
**Deliverables**:
- ✅ `suppliers.service.spec.ts` (25 tests)
- ✅ SuppliersService coverage: 70%+
- ✅ Vietnamese validations complete

**Success Criteria**:
- All 25 new tests passing
- Coverage ≥70%
- Overall project coverage ~40%

---

### Milestone 3: Week 3 Complete ✅
**Date**: [Week 3 End]  
**Deliverables**: 
- ✅ `accounting.service.spec.ts` (25 tests)
- ✅ AccountingService coverage: 70%+
- ✅ Journal entries & balance calculations tested

**Success Criteria**: 
- All 25 new tests passing
- Coverage ≥70%
- Overall project coverage ~50%

---

### Milestone 4: Phase 4 Complete ✅🎉
**Date**: [Week 4 End]  
**Deliverables**:
- ✅ QuotationsService improved to 70%+
- ✅ PurchaseOrdersService improved to 70%+
- ✅ `business-workflows.spec.ts` (15 integration tests)
- ✅ `api-endpoints.spec.ts` (20 E2E tests - optional)
- ✅ Overall project coverage: 60%+

**Success Criteria**:
- ✅ All 360-380 tests passing (100% pass rate)
- ✅ Overall coverage ≥60%
- ✅ All 8 services ≥70% coverage
- ✅ Execution time <15s
- ✅ Zero critical bugs
- ✅ Production-ready quality

---

## 🛠️ DEVELOPMENT WORKFLOW

### Daily Workflow
```bash
# 1. Start new feature branch
git checkout -b test/phase4-week1-inventory

# 2. Create test file
touch src/modules/inventory/inventory.service.spec.ts

# 3. Write tests (TDD approach)
# - Write failing test
# - Implement code
# - Make test pass
# - Refactor

# 4. Run tests locally
npm test -- inventory.service.spec.ts

# 5. Check coverage
npm run test:cov

# 6. Run all tests
npm test

# 7.  Commit and push
git add . 
git commit -m "feat(test): add InventoryService tests (Day 1/5)"
git push origin test/phase4-week1-inventory

# 8. Create PR if week complete
# Review → Merge → Next week
```

### Code Review Checklist
- [ ] All tests passing (100% pass rate)
- [ ] Coverage target met (≥70%)
- [ ] Test descriptions clear (Vietnamese OK)
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Mock usage proper
- [ ] No console.log left
- [ ] Execution time acceptable

---

## 📚 TEST PATTERNS & TEMPLATES

### Pattern 1: Service Unit Test Template
```typescript
describe('[ServiceName]', () => {
  let service: [ServiceName];
  let repository: Repository<[Entity]>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        [ServiceName],
        { provide: getRepositoryToken([Entity]), useClass: Repository },
      ],
    }).compile();

    service = module.get([ServiceName]);
    repository = module.get(getRepositoryToken([Entity]));
  });

  describe('create', () => {
    it('should create [entity] successfully', async () => {
      const dto = mock[Entity]Dto();
      jest.spyOn(repository, 'save').mockResolvedValue(mock[Entity]());

      const result = await service. create(dto);

      expect(result).toBeDefined();
      expect(repository. save).toHaveBeenCalledWith(expect.objectContaining(dto));
    });
  });

  describe('findAll', () => { /* ... */ });
  describe('findOne', () => { /* ... */ });
  describe('update', () => { /* ... */ });
  describe('remove', () => { /* ... */ });

  // Business logic tests
  describe('Business Logic', () => { /* ... */ });

  // Error handling tests
  describe('Error Handling', () => { /* ... */ });
});
```

### Pattern 2: Integration Test Template
```typescript
describe('Integration:  [Workflow Name]', () => {
  it('should complete [workflow] successfully', async () => {
    // Step 1: Setup data
    const entity1 = await service1.create(data1);

    // Step 2: Perform action
    const entity2 = await service2.create({
      ...data2,
      foreignKey: entity1.id,
    });

    // Step 3: Verify side effects
    const updated = await service1.findOne(entity1.id);
    expect(updated. status).toBe(ExpectedStatus);

    // Step 4: Verify related data
    const related = await service3.findBy({ foreignKey: entity2.id });
    expect(related.length).toBeGreaterThan(0);
  });
});
```

### Pattern 3: E2E Test Template
```typescript
describe('E2E: [Endpoint]', () => {
  it('should [action] via API', async () => {
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .send(validData)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.field).toBe(expectedValue);
  });

  it('should reject invalid data', async () => {
    await request(app.getHttpServer())
      .post('/endpoint')
      .send(invalidData)
      .expect(400);
  });
});
```

---

## 🔧 UTILITIES & HELPERS

### Mock Factories (Create Once, Use Everywhere)
```typescript
// test/utils/mock-factories.ts

export const mockInventoryTransaction = (
  overrides?:  Partial<InventoryTransaction>
): InventoryTransaction => ({
  id: 'trans-1',
  productId: 'prod-1',
  type: 'IN',
  quantity: 100,
  reason: 'PURCHASE',
  date: new Date(),
  userId: 'user-1',
  ...overrides,
});

export const mockBatch = (overrides?: Partial<Batch>): Batch => ({
  id: 'batch-1',
  batchNumber: 'BATCH-2025-001',
  productId: 'prod-1',
  quantity: 100,
  availableQuantity: 100,
  manufactureDate: new Date('2025-01-01'),
  expiryDate: new Date('2026-01-01'),
  ...overrides,
});

export const mockSupplier = (overrides?: Partial<Supplier>): Supplier => ({
  id: 'sup-1',
  name: 'Nhà cung cấp Test',
  phone: '0987654321',
  taxCode: '0123456789',
  email: 'supplier@test.com',
  isActive: true,
  ...overrides,
});

export const mockJournalEntry = (
  overrides?: Partial<JournalEntry>
): JournalEntry => ({
  id:  'entry-1',
  entryNumber: 'JE-2025-001',
  date: new Date(),
  description: 'Test entry',
  lines: [],
  ...overrides,
});

export const mockAccountingLine = (
  overrides?:  Partial<AccountingLine>
): AccountingLine => ({
  id: 'line-1',
  accountCode: '1010',
  accountName: 'Cash',
  accountType: 'ASSET',
  debit: 1000000,
  credit: 0,
  ... overrides,
});
```

### Test Utilities
```typescript
// test/utils/test-helpers.ts

export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const expectToThrow = async (
  fn: () => Promise<any>,
  errorMessage: string
) => {
  await expect(fn()).rejects.toThrow(errorMessage);
};

export const createMockRepository = <T>() => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

export const resetAllMocks = (... mocks: jest.Mock[]) => {
  mocks.forEach(mock => mock.mockReset());
};

// Vietnamese date helpers
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatVND = (amount: number): string => {
  return Math.round(amount).toLocaleString('vi-VN') + ' ₫';
};

export const isValidVietnamesePhone = (phone: string): boolean => {
  return /^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone);
};
```

---

## 🚨 RISK MANAGEMENT

### Potential Risks

#### Risk 1: Timeline Delays ⚠️
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**:
- Set realistic daily targets
- Focus on quality over speed
- Allow buffer time (Week 5 if needed)
- Parallelize tasks when possible

#### Risk 2: Coverage Target Not Met ⚠️
**Impact**:  High  
**Probability**: Low  
**Mitigation**: 
- Monitor coverage daily
- Prioritize high-impact tests
- Add extra tests to critical services
- Accept 55-60% as minimum viable

#### Risk 3: Performance Degradation ⚠️
**Impact**: Medium  
**Probability**: Low  
**Mitigation**: 
- Keep execution time <15s
- Use proper mocking
- Avoid database calls in unit tests
- Run tests in parallel

#### Risk 4: Test Maintenance Burden ⚠️
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: 
- Create reusable utilities
- Use mock factories
- Keep tests simple and focused
- Document test patterns

---

## 📊 PROGRESS TRACKING

### Weekly Tracking Template

```markdown
## Week [N] Progress Report

### Completed
- ✅ [Service]:  X tests added, Y% coverage achieved
- ✅ [Task]: Description

### In Progress
- 🔄 [Service]: Z tests remaining
- 🔄 [Task]: Current status

### Blocked
- ⚠️ [Issue]: Description and resolution plan

### Metrics
- Total tests: X → Y (+Z)
- Overall coverage: X% → Y% (+Z%)
- Services ≥70%: X/8

### Next Week Plan
- [ ] Task 1
- [ ] Task 2
```

### Daily Standup Template

```markdown
## Daily Update - [Date]

### Yesterday
- Completed: [Tasks]
- Tests added: [Number]

### Today
- Plan: [Tasks]
- Target: [Number] tests

### Blockers
- [Any issues]
```

---

## ✅ SUCCESS CRITERIA CHECKLIST

### Phase 4 Completion Criteria

#### Code Quality ✅
- [ ] All 360-380 tests passing (100% pass rate)
- [ ] Zero test failures
- [ ] Zero flaky tests
- [ ] Execution time <15 seconds
- [ ] No console warnings/errors

#### Coverage Targets ✅
- [ ] Overall project coverage ≥60%
- [ ] InventoryService ≥70%
- [ ] SuppliersService ≥70%
- [ ] AccountingService ≥70%
- [ ] QuotationsService ≥70%
- [ ] PurchaseOrdersService ≥70%
- [ ] CustomersService maintained ≥70%
- [ ] ProductsService maintained ≥70%
- [ ] SalesOrdersService maintained ≥70%

#### Test Quality ✅
- [ ] All business logic tested
- [ ] All error paths tested
- [ ] Edge cases covered
- [ ] Vietnamese rules validated
- [ ] Integration workflows tested
- [ ] Proper mocking used
- [ ] Clear test descriptions

#### Documentation ✅
- [ ] README updated with test instructions
- [ ] Test patterns documented
- [ ] Mock factories created
- [ ] CI/CD setup (if applicable)

#### Production Readiness ✅
- [ ] No critical bugs
- [ ] All validations working
- [ ] Data integrity maintained
- [ ] Performance acceptable
- [ ] Security considerations addressed

---

## 🎓 LESSONS & BEST PRACTICES

### From Phase 3 Success

#### What Worked Exceptionally Well ⭐
1. **Structured approach**: Following detailed plans
2. **Quality focus**: Comprehensive tests over quick wins
3. **Edge case testing**: Zero, large values, concurrency
4. **Vietnamese compliance**: Tax rates, phone formats
5. **Mock strategy**: Proper isolation of units

#### Patterns to Continue
```typescript
// ✅ Clear test structure
describe('Feature', () => {
  describe('Scenario', () => {
    it('should do specific thing', () => { /* ... */ });
  });
});

// ✅ Descriptive test names
it('should throw NotFoundException when supplier not found');

// ✅ Complete assertions
expect(result. field).toBe(expectedValue);
expect(mockFn).toHaveBeenCalledWith(expectedArgs);
expect(mockFn).toHaveBeenCalledTimes(1);

// ✅ Proper setup/teardown
beforeEach(() => { /* setup */ });
afterEach(() => { jest.clearAllMocks(); });
```

### New Recommendations for Phase 4

#### 1. Test in Small Batches
```typescript
// ✅ Good: 2-3 tests per commit
git commit -m "test(inventory): add IN transaction tests (3 tests)"

// ❌ Bad: 30 tests in one commit
git commit -m "test(inventory): add all tests"
```

#### 2. Run Tests Frequently
```bash
# Run after every 2-3 tests
npm test -- inventory.service.spec.ts --watch
```

#### 3. Monitor Coverage Continuously
```bash
# Check coverage after each batch
npm run test:cov -- inventory.service
```

#### 4. Refactor Early
```typescript
// If you copy-paste mock setup 3+ times, extract it! 
const setupMockRepository = () => {
  const repo = createMockRepository();
  repo.find. mockResolvedValue([]);
  return repo;
};
```

---

## 📞 SUPPORT & RESOURCES

### Documentation
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeORM Testing](https://typeorm.io/testing)

### Tools
- **Coverage Report**: `npm run test:cov`
- **Watch Mode**: `npm test -- --watch`
- **Specific File**: `npm test -- inventory.service.spec.ts`
- **Debug**:  `npm test -- --detectOpenHandles`

### Team Communication
- Daily updates in chat
- Weekly progress reports
- Blockers escalated immediately
- Code reviews within 24h

---

## 🎯 FINAL THOUGHTS

### Phase 4 Vision

By the end of Phase 4, this project will have:
- ✅ **360-380 comprehensive tests**
- ✅ **60%+ overall coverage** (production-ready)
- ✅ **All 8 services at 70%+** (excellent quality)
- ✅ **15 integration tests** (workflow validation)
- ✅ **Zero test failures** (100% reliability)
- ✅ **<15s execution** (developer-friendly)

This represents a **world-class test suite** for a Vietnamese ERP/finance system. 

### Commitment to Quality

```
"Coverage is not the goal—confidence is the goal. 
Coverage is just the metric we use to track it."
```

Focus on:
- 🎯 Testing critical business logic
- 🛡️ Preventing regressions
- 📚 Documenting expected behavior
- 🚀 Enabling confident refactoring

### Ready to Start?  🚀

```bash
# Let's begin Phase 4! 
git checkout -b test/phase4-week1-inventory
echo "Let's achieve 60% coverage!  💪" > PHASE4_LOG.md
npm test -- --watch
```

---

**Phase 4 Status**:  🔄 **READY TO START**  
**Expected Completion**: [4-5 weeks]  
**Success Probability**: ⭐⭐⭐⭐⭐ (Very High, based on Phase 3 success)

---

**Created**:  2025-12-24  
**Author**: @Mk141121  
**Version**: 1.0  
**Next Review**: After Week 1 Completion

---

🎉 **LET'S ACHIEVE 60% COVERAGE!  GOOD LUCK!** 🚀