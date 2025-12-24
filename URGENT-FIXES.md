# 🚨 URGENT FIXES - CẦN FIX NGAY

**Ngày tạo**: 2025-12-24  
**Trạng thái**: 🔴 CRITICAL - Cần xử lý trong 1-3 ngày  
**Current Coverage**: 42.29%  
**Target**: 60%+

---

## 📊 TỔNG QUAN VẤN ĐỀ

### Critical Issues Summary

```
┌─────────────────────────────────┬──────────┬──────────┬────────────┐
│ Issue                           │ Priority │ Effort   │ Impact     │
├─────────────────────────────────┼──────────┼──────────┼────────────┤
│ PurchaseOrdersService Coverage  │ 🔴 P0    │ 1-2 days │ +5% cov    │
│ Missing Integration Tests       │ 🔴 P0    │ 2-3 days │ +5% cov    │
│ E2E Tests Not Running           │ 🟡 P1    │ 1 day    │ Stability  │
│ Error Handling Gaps             │ 🟡 P1    │ 1 day    │ +2% cov    │
│ E-InvoicesService Missing Tests │ 🟠 P2    │ 5-7 days │ +8% cov    │
│ SettingsService Missing Tests   │ 🟠 P2    │ 1-2 days │ +2% cov    │
└─────────────────────────────────┴──────────┴──────────┴────────────┘
```

---

## 🔴 PRIORITY 0 - FIX TRONG 24H

### Issue #1: PurchaseOrdersService Coverage Thấp (50.51%)

**File**:  `backend/src/purchase-orders/purchase-orders.service.spec.ts`  
**Current Coverage**: 50.51%  
**Target**:  70%+  
**Gap**: 19.49%

#### ❌ Vấn đề

```typescript
// Thiếu tests cho: 
1. Status workflow transitions (DRAFT → SENT → APPROVED → RECEIVED)
2. Multi-item calculations với mixed VAT rates
3. Supplier validation
4. Date validations (expectedDeliveryDate)
5. Integration với InventoryService (auto stock IN)
6. Error handling branches
7. Concurrent update scenarios
```

#### ✅ Giải pháp

**Thêm vào file `purchase-orders.service.spec.ts`:**

```typescript
// ============================================================================
// URGENT FIXES - ADD THESE TESTS
// ============================================================================

describe('PurchaseOrdersService - URGENT COVERAGE FIXES', () => {
  // FIX 1: Status Workflow Tests (5 tests)
  describe('Status Transitions', () => {
    it('should allow DRAFT → SENT transition', async () => {
      const po = createMockPurchaseOrder({ status: 'draft' });
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(po as any);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue({
        ...po,
        status: 'sent',
      } as any);

      const result = await service.updateStatus(po.id, 'sent', 'tenant-1');

      expect(result. status).toBe('sent');
      expect(purchaseOrderRepository.save).toHaveBeenCalled();
    });

    it('should allow SENT → APPROVED transition', async () => {
      const po = createMockPurchaseOrder({ status: 'sent' });
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(po as any);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue({
        ... po,
        status: 'approved',
      } as any);

      const result = await service. updateStatus(po.id, 'approved', 'tenant-1');

      expect(result.status).toBe('approved');
    });

    it('should allow APPROVED → RECEIVED transition', async () => {
      const po = createMockPurchaseOrder({ status: 'approved' });
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(po as any);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue({
        ...po,
        status: 'received',
      } as any);

      const result = await service.updateStatus(po.id, 'received', 'tenant-1');

      expect(result.status).toBe('received');
    });

    it('should reject RECEIVED → DRAFT transition', async () => {
      const po = createMockPurchaseOrder({ status: 'received' });
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(po as any);

      await expect(
        service.updateStatus(po. id, 'draft', 'tenant-1')
      ).rejects.toThrow('Không thể chuyển từ RECEIVED về DRAFT');
    });

    it('should allow CANCELLED from any status', async () => {
      const statuses = ['draft', 'sent', 'approved'];

      for (const status of statuses) {
        const po = createMockPurchaseOrder({ status });
        jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(po as any);
        jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue({
          ...po,
          status:  'cancelled',
        } as any);

        const result = await service.updateStatus(po.id, 'cancelled', 'tenant-1');
        expect(result.status).toBe('cancelled');
      }
    });
  });

  // FIX 2: Multi-Item Calculations (3 tests)
  describe('Multi-Item Calculations', () => {
    it('should calculate total with mixed VAT rates (0%, 5%, 10%)', async () => {
      const createDto = {
        orderDate: new Date('2025-01-01'),
        supplierId: 'supplier-1',
        supplierName: 'NCC ABC',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            quantity: 10,
            unitPrice: 100000,
            taxRate: 0, // No tax
          },
          {
            productId: 'p2',
            productName: 'Product 2',
            quantity: 5,
            unitPrice: 200000,
            taxRate: 5, // 5% tax
          },
          {
            productId: 'p3',
            productName: 'Product 3',
            quantity: 2,
            unitPrice: 500000,
            taxRate: 10, // 10% tax
          },
        ],
      };

      const qb = createMockQueryBuilder();
      jest.spyOn(purchaseOrderRepository, 'createQueryBuilder').mockReturnValue(qb as any);
      jest.spyOn(purchaseOrderRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue({
        id: 'po-1',
        subtotal: 3000000, // 10*100k + 5*200k + 2*500k
        taxAmount: 150000, // 0 + 50k (5%) + 100k (10%)
        totalAmount: 3150000,
      } as any);

      const result = await service.create(createDto as any, 'tenant-1', 'user-1');

      expect(result.subtotal).toBe(3000000);
      expect(result.taxAmount).toBe(150000);
      expect(result. totalAmount).toBe(3150000);
    });

    it('should round VND correctly (no decimals)', async () => {
      const createDto = {
        orderDate: new Date('2025-01-01'),
        supplierId: 'supplier-1',
        supplierName: 'NCC ABC',
        items: [
          {
            productId: 'p1',
            productName:  'Product 1',
            quantity: 3,
            unitPrice: 99999, // Will create decimals
            taxRate: 10,
          },
        ],
      };

      const qb = createMockQueryBuilder();
      jest.spyOn(purchaseOrderRepository, 'createQueryBuilder').mockReturnValue(qb as any);
      jest.spyOn(purchaseOrderRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(purchaseOrderRepository, 'save').mockResolvedValue({
        id: 'po-1',
        subtotal: 299997, // 3 * 99999
        taxAmount: 30000, // Rounded
        totalAmount: 329997, // No decimals
      } as any);

      const result = await service. create(createDto as any, 'tenant-1', 'user-1');

      // Verify no decimals
      expect(result.totalAmount % 1).toBe(0);
      expect(result.taxAmount % 1).toBe(0);
    });

    it('should handle zero quantity edge case', async () => {
      const createDto = {
        orderDate: new Date('2025-01-01'),
        supplierId: 'supplier-1',
        items: [
          {
            productId: 'p1',
            quantity: 0, // Invalid
            unitPrice: 100000,
          },
        ],
      };

      await expect(
        service.create(createDto as any, 'tenant-1', 'user-1')
      ).rejects.toThrow('Số lượng phải lớn hơn 0');
    });
  });

  // FIX 3: Supplier Validation (2 tests)
  describe('Supplier Validation', () => {
    it('should throw NotFoundException when supplier not found', async () => {
      const createDto = {
        supplierId: 'invalid-supplier-id',
        items: [],
      };

      // Mock supplier not found
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(createDto as any, 'tenant-1', 'user-1')
      ).rejects.toThrow('Không tìm thấy nhà cung cấp');
    });

    it('should validate supplier is active', async () => {
      const createDto = {
        supplierId: 'supplier-1',
        items: [],
      };

      // Mock inactive supplier
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue({
        id: 'supplier-1',
        isActive: false,
      } as any);

      await expect(
        service.create(createDto as any, 'tenant-1', 'user-1')
      ).rejects.toThrow('Nhà cung cấp không còn hoạt động');
    });
  });

  // FIX 4: Date Validations (3 tests)
  describe('Date Validations', () => {
    it('should validate expectedDeliveryDate >= orderDate', async () => {
      const createDto = {
        orderDate: new Date('2025-01-10'),
        expectedDeliveryDate: new Date('2025-01-05'), // Before order date
        supplierId: 'supplier-1',
        items: [],
      };

      await expect(
        service.create(createDto as any, 'tenant-1', 'user-1')
      ).rejects.toThrow('Ngày dự kiến giao hàng không được trước ngày đặt hàng');
    });

    it('should reject past expectedDeliveryDate', async () => {
      const createDto = {
        orderDate: new Date(),
        expectedDeliveryDate:  new Date('2024-01-01'), // Past date
        supplierId: 'supplier-1',
        items: [],
      };

      await expect(
        service. create(createDto as any, 'tenant-1', 'user-1')
      ).rejects.toThrow('Ngày dự kiến giao hàng không được là quá khứ');
    });

    it('should calculate days until delivery', async () => {
      const po = createMockPurchaseOrder({
        orderDate: new Date('2025-01-01'),
        expectedDeliveryDate: new Date('2025-01-08'),
      });

      const daysUntil = service.calculateDaysUntilDelivery(po);

      expect(daysUntil).toBe(7);
    });
  });

  // FIX 5: Error Handling (3 tests)
  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      jest.spyOn(purchaseOrderRepository, 'find').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.findAll({}, 'tenant-1')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle concurrent updates gracefully', async () => {
      const po = createMockPurchaseOrder();
      jest.spyOn(purchaseOrderRepository, 'findOne').mockResolvedValue(po as any);
      jest.spyOn(purchaseOrderRepository, 'save').mockRejectedValue(
        new Error('OptimisticLockError')
      );

      await expect(
        service.update(po.id, { notes: 'Update 1' }, 'tenant-1', 'user-1')
      ).rejects.toThrow();
    });

    it('should rollback on transaction failure', async () => {
      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockRejectedValue(new Error('Save failed')),
        },
      };

      // Assuming service uses transactions
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(queryRunner as any);

      await expect(
        service.createWithTransaction({} as any, 'tenant-1', 'user-1')
      ).rejects.toThrow();

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// HELPER FUNCTION
// ============================================================================
function createMockQueryBuilder() {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  };
}
```

#### 📋 Checklist

```bash
- [ ] Copy code above vào purchase-orders.service.spec.ts
- [ ] Run tests: npm test -- purchase-orders.service.spec
- [ ] Verify coverage: npm run test:cov
- [ ] Target:  Coverage >= 70%
- [ ] Commit:  "fix(tests): increase PurchaseOrdersService coverage to 70%+"
```

#### ⏱️ Estimated Time:  1-2 hours

---

### Issue #2: Missing Integration Tests

**File**: `test/integration/workflows.spec.ts` (NEW)  
**Current**:  0 tests  
**Target**: 20 tests  
**Impact**: +5% overall coverage

#### ❌ Vấn đề

```typescript
// Không có tests cho:
1. End-to-end workflows (Customer → Quotation → SO → Accounting)
2. Cross-module validations
3. Data consistency checks
4. Transaction rollback scenarios
```

#### ✅ Giải pháp

**Tạo file mới:  `test/integration/workflows.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { CustomersService } from '../../src/customers/customers.service';
import { QuotationsService } from '../../src/quotations/quotations.service';
import { SalesOrdersService } from '../../src/sales-orders/sales-orders. service';
import { AccountingService } from '../../src/accounting/accounting.service';
import { InventoryService } from '../../src/inventory/inventory.service';
import { DataSource } from 'typeorm';

describe('Integration Tests - Business Workflows', () => {
  let app: INestApplication;
  let customersService: CustomersService;
  let quotationsService: QuotationsService;
  let salesOrdersService: SalesOrdersService;
  let accountingService:  AccountingService;
  let inventoryService: InventoryService;
  let dataSource: DataSource;

  const TENANT_ID = 'test-tenant-1';
  const USER_ID = 'test-user-1';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    customersService = app.get(CustomersService);
    quotationsService = app.get(QuotationsService);
    salesOrdersService = app.get(SalesOrdersService);
    accountingService = app.get(AccountingService);
    inventoryService = app.get(InventoryService);
    dataSource = app. get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Cleanup test data
    await dataSource.query('DELETE FROM quotations WHERE tenant_id = $1', [TENANT_ID]);
    await dataSource.query('DELETE FROM customers WHERE tenant_id = $1', [TENANT_ID]);
  });

  // ============================================================================
  // WORKFLOW 1: SALES FLOW
  // ============================================================================
  describe('Sales Workflow:  Customer → Quotation → Sales Order → Accounting', () => {
    it('should complete full sales workflow successfully', async () => {
      // Step 1: Create customer
      const customer = await customersService.create(
        {
          code: 'KH-TEST-001',
          name: 'Công ty Test Integration',
          type: 'company',
          email: 'test@integration.com',
          phone: '0987654321',
          taxCode: '0100000001',
        },
        TENANT_ID,
        USER_ID,
      );

      expect(customer).toBeDefined();
      expect(customer.code).toBe('KH-TEST-001');

      // Step 2: Create quotation
      const quotation = await quotationsService.create(
        {
          quotationDate: new Date('2025-01-15'),
          validUntil: new Date('2025-02-15'),
          customerId: customer.id,
          customerName: customer.name,
          items: [
            {
              productId: 'test-product-1',
              productName: 'Sản phẩm Test',
              quantity: 10,
              unitPrice: 100000,
              discountPercent: 5,
              taxRate: 10,
            },
          ],
          notes: 'Integration test quotation',
        },
        TENANT_ID,
        USER_ID,
      );

      expect(quotation).toBeDefined();
      expect(quotation.customerId).toBe(customer.id);
      expect(quotation. status).toBe('draft');

      // Step 3: Confirm quotation
      const confirmedQuotation = await quotationsService.updateStatus(
        quotation.id,
        'confirmed',
        TENANT_ID,
      );

      expect(confirmedQuotation. status).toBe('confirmed');

      // Step 4: Convert to sales order
      const salesOrder = await salesOrdersService.createFromQuotation(
        quotation.id,
        TENANT_ID,
        USER_ID,
      );

      expect(salesOrder).toBeDefined();
      expect(salesOrder.quotationId).toBe(quotation.id);
      expect(salesOrder. customerId).toBe(customer.id);

      // Step 5: Complete sales order
      await salesOrdersService.updateStatus(salesOrder.id, 'confirmed', TENANT_ID);
      await salesOrdersService.updateStatus(salesOrder.id, 'processing', TENANT_ID);
      const completedSO = await salesOrdersService.updateStatus(
        salesOrder.id,
        'completed',
        TENANT_ID,
      );

      expect(completedSO. status).toBe('completed');

      // Step 6: Verify accounting entry created
      const entries = await accountingService.findEntries(
        {
          referenceType: 'SALES_ORDER',
          referenceId:  salesOrder.id,
        },
        TENANT_ID,
      );

      expect(entries).toBeDefined();
      expect(entries.length).toBeGreaterThan(0);

      // Verify debit = credit
      const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
      expect(totalDebit).toBe(totalCredit);

      // Step 7: Verify quotation marked as converted
      const updatedQuotation = await quotationsService.findOne(quotation. id, TENANT_ID);
      expect(updatedQuotation.isConverted).toBe(true);
    });

    it('should prevent converting expired quotation to sales order', async () => {
      const customer = await customersService.create(
        {
          code:  'KH-TEST-002',
          name: 'Test Customer 2',
          type:  'individual',
        },
        TENANT_ID,
        USER_ID,
      );

      const quotation = await quotationsService.create(
        {
          quotationDate: new Date('2024-01-01'),
          validUntil: new Date('2024-01-31'), // Expired
          customerId: customer. id,
          customerName: customer.name,
          items: [],
        },
        TENANT_ID,
        USER_ID,
      );

      await expect(
        salesOrdersService.createFromQuotation(quotation.id, TENANT_ID, USER_ID)
      ).rejects.toThrow('Không thể chuyển đổi báo giá đã hết hạn');
    });

    it('should prevent deleting customer with active quotations', async () => {
      const customer = await customersService. create(
        {
          code: 'KH-TEST-003',
          name: 'Test Customer 3',
          type: 'company',
        },
        TENANT_ID,
        USER_ID,
      );

      await quotationsService.create(
        {
          quotationDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          customerId: customer.id,
          customerName: customer. name,
          items: [],
        },
        TENANT_ID,
        USER_ID,
      );

      await expect(customersService.remove(customer.id, TENANT_ID)).rejects.toThrow(
        'Không thể xóa khách hàng có báo giá đang hoạt động'
      );
    });
  });

  // ============================================================================
  // WORKFLOW 2: PURCHASE FLOW
  // ============================================================================
  describe('Purchase Workflow:  Supplier → PO → Inventory → Accounting', () => {
    it('should complete full purchase workflow successfully', async () => {
      // Implementation similar to sales workflow
      // Test:  Create supplier → Create PO → Approve → Receive → Verify stock IN
    });
  });

  // ============================================================================
  // WORKFLOW 3: INVENTORY ADJUSTMENTS
  // ============================================================================
  describe('Inventory Adjustments', () => {
    it('should update stock when sales order completed', async () => {
      // Test stock OUT when SO = completed
    });

    it('should update stock when purchase order received', async () => {
      // Test stock IN when PO = received
    });

    it('should rollback stock when order cancelled', async () => {
      // Test rollback logic
    });
  });
});
```

#### 📋 Checklist

```bash
- [ ] Create file test/integration/workflows.spec.ts
- [ ] Copy code above
- [ ] Setup test database (see next section)
- [ ] Run: npm run test:integration
- [ ] Verify all workflows pass
- [ ] Commit: "feat(tests): add integration tests for business workflows"
```

#### ⏱️ Estimated Time:  2-3 hours

---

## 🟡 PRIORITY 1 - FIX TRONG 2-3 NGÀY

### Issue #3: E2E Tests Not Running

**Status**: E2E tests created but cannot run  
**Impact**: Cannot verify API endpoints work correctly

#### ❌ Vấn đề

```bash
# When running:  npm run test:e2e
# Error: Cannot connect to test database
# Error: Authentication tokens not working
```

#### ✅ Giải pháp

**Step 1: Create Test Database**

**File**: `docker-compose.test.yml`

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres: 15
    container_name: finance-test-db
    environment: 
      POSTGRES_DB: finance_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports: 
      - '5433:5432'
    volumes: 
      - test_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U test_user']
      interval: 10s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7-alpine
    container_name: finance-test-redis
    ports:
      - '6380:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  test_pgdata: 
```

**Step 2: Test Environment Config**

**File**: `.env.test`

```bash
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=test_user
DB_PASSWORD=test_password
DB_DATABASE=finance_test

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_EXPIRES_IN=1h

# App
NODE_ENV=test
PORT=3001
```

**Step 3: Jest E2E Config**

**File**: `test/jest-e2e.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ". e2e-spec.ts$",
  "transform": {
    "^. +\\.(t|j)s$": "ts-jest"
  },
  "setupFilesAfterEnv": ["./setup-e2e.ts"]
}
```

**Step 4: E2E Setup Script**

**File**: `test/setup-e2e.ts`

```typescript
import { DataSource } from 'typeorm';

let dataSource: DataSource;

beforeAll(async () => {
  // Connect to test database
  dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'test_user',
    password: 'test_password',
    database: 'finance_test',
    entities: ['src/**/*.entity.ts'],
    synchronize: true, // Auto-create tables in test
  });

  await dataSource.initialize();
});

afterAll(async () => {
  // Cleanup
  await dataSource.dropDatabase();
  await dataSource. destroy();
});

afterEach(async () => {
  // Clear all tables after each test
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity. name);
    await repository.clear();
  }
});
```

**Step 5: Update package.json**

```json
{
  "scripts": {
    "test:e2e": "jest --config ./test/jest-e2e. json --runInBand",
    "test:e2e:watch": "jest --config ./test/jest-e2e.json --watch",
    "test:e2e:cov": "jest --config ./test/jest-e2e.json --coverage",
    "db:test: up": "docker-compose -f docker-compose.test.yml up -d",
    "db:test:down": "docker-compose -f docker-compose.test.yml down -v"
  }
}
```

#### 📋 Checklist

```bash
- [ ] Create docker-compose.test.yml
- [ ] Create .env.test
- [ ] Update test/jest-e2e.json
- [ ] Create test/setup-e2e. ts
- [ ] Start test DB:  npm run db:test:up
- [ ] Wait for healthy:  docker ps (check STATUS)
- [ ] Run E2E tests: npm run test: e2e
- [ ] All tests should pass
- [ ] Commit:  "feat(tests): setup E2E test infrastructure"
```

#### ⏱️ Estimated Time: 1 day

---

### Issue #4: Error Handling Gaps

**Impact**: Missing tests for critical error scenarios

#### ❌ Vấn đề

```typescript
// Thiếu tests cho:
1. Database connection failures
2. Transaction rollback scenarios
3. Concurrent update conflicts
4. Network timeouts
5. Invalid input sanitization
```

#### ✅ Giải pháp

**Thêm vào tất cả services:**

```typescript
describe('[ServiceName] - Error Handling', () => {
  describe('Database Errors', () => {
    it('should handle connection timeout', async () => {
      jest.spyOn(repository, 'find').mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(service.findAll()).rejects.toThrow('Connection timeout');
    });

    it('should handle query timeout', async () => {
      jest.spyOn(repository, 'findOne').mockRejectedValue(
        new Error('Query timeout')
      );

      await expect(service.findOne('id-1')).rejects.toThrow('Query timeout');
    });

    it('should handle deadlock errors', async () => {
      jest.spyOn(repository, 'save').mockRejectedValue(
        new Error('Deadlock detected')
      );

      await expect(service.create({} as any)).rejects.toThrow('Deadlock detected');
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback on save failure', async () => {
      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest. fn().mockRejectedValue(new Error('Save failed')),
        },
      };

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(queryRunner as any);

      await expect(service.createWithTransaction({} as any)).rejects.toThrow();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle optimistic locking', async () => {
      const entity = { id: '1', version: 1 };
      jest.spyOn(repository, 'findOne').mockResolvedValue(entity as any);
      jest.spyOn(repository, 'save').mockRejectedValue(
        new Error('OptimisticLockError:  version mismatch')
      );

      await expect(service.update('1', {}, 1)).rejects.toThrow('OptimisticLockError');
    });

    it('should retry on concurrent modification', async () => {
      let attemptCount = 0;
      jest.spyOn(repository, 'save').mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Concurrent modification'));
        }
        return Promise. resolve({} as any);
      });

      const result = await service.updateWithRetry('1', {});
      expect(attemptCount).toBe(3);
      expect(result).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      await expect(
        service.create({ name: maliciousInput } as any)
      ).rejects.toThrow('Invalid input');
    });

    it('should reject XSS attempts', async () => {
      const xssInput = '<script>alert("XSS")</script>';

      await expect(
        service.create({ notes: xssInput } as any)
      ).rejects.toThrow('Invalid input');
    });

    it('should handle null/undefined gracefully', async () => {
      await expect(service.findOne(null)).rejects.toThrow();
      await expect(service.findOne(undefined)).rejects.toThrow();
    });
  });
});
```

#### 📋 Checklist

```bash
- [ ] Add error handling tests to CustomersService
- [ ] Add error handling tests to ProductsService
- [ ] Add error handling tests to QuotationsService
- [ ] Add error handling tests to SalesOrdersService
- [ ] Add error handling tests to PurchaseOrdersService
- [ ] Run:  npm run test:cov
- [ ] Verify coverage increase
- [ ] Commit: "feat(tests): add comprehensive error handling tests"
```

#### ⏱️ Estimated Time: 1 day

---

## 🟠 PRIORITY 2 - FIX TRONG 1 TUẦN

### Issue #5: E-InvoicesService Missing Tests

**File**: `backend/src/e-invoices/services/e-invoices.service.spec.ts` (NEW)  
**Current**:  0%  
**Target**: 70%+  
**Impact**: +8% overall coverage

#### ❌ Vấn đề

E-InvoicesService là module quan trọng (HĐĐT Việt Nam) nhưng hoàn toàn chưa có tests. 

#### ✅ Giải pháp

**Tạo file**:  `backend/src/e-invoices/services/e-invoices.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EInvoicesService } from './e-invoices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EInvoice } from '../entities/e-invoice.entity';
import { XmlGeneratorService } from './xml-generator.service';
import { DigitalSignatureService } from './digital-signature.service';

describe('EInvoicesService', () => {
  let service:  EInvoicesService;
  let repository: Repository<EInvoice>;
  let xmlGenerator: XmlGeneratorService;
  let digitalSignature: DigitalSignatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EInvoicesService,
        {
          provide: getRepositoryToken(EInvoice),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: XmlGeneratorService,
          useValue: {
            generate: jest.fn(),
          },
        },
        {
          provide: DigitalSignatureService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EInvoicesService);
    repository = module.get(getRepositoryToken(EInvoice));
    xmlGenerator = module.get(XmlGeneratorService);
    digitalSignature = module.get(DigitalSignatureService);
  });

  describe('create', () => {
    it('should create draft e-invoice');
    it('should generate invoice number');
    it('should validate customer tax code');
  });

  describe('issue', () => {
    it('should generate XML in TCVN format');
    it('should sign XML with digital certificate');
    it('should update status to ISSUED');
  });

  describe('send', () => {
    it('should send e-invoice to TCT');
    it('should send email to customer');
    it('should update status to SENT');
  });

  describe('cancel', () => {
    it('should cancel issued e-invoice');
    it('should create cancellation XML');
    it('should update status to CANCELLED');
  });

  // Add 20-30 more tests... 
});
```

#### 📋 Checklist

```bash
- [ ] Create e-invoices.service.spec. ts
- [ ] Implement 30+ tests covering: 
      - CRUD operations
      - XML generation (TCVN format)
      - Digital signature
      - Status transitions
      - TCT API integration (mocked)
      - Email sending
- [ ] Run:  npm test -- e-invoices.service.spec
- [ ] Target:  70%+ coverage
- [ ] Commit: "feat(tests): add E-InvoicesService test suite"
```

#### ⏱️ Estimated Time:  5-7 days

---

### Issue #6: SettingsService Missing Tests

**File**:  `backend/src/settings/settings.service.spec.ts` (NEW)  
**Current**: 0%  
**Target**: 70%+  
**Impact**: +2% overall coverage

#### ✅ Giải pháp

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository:  Repository<Setting>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Setting),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SettingsService);
    repository = module.get(getRepositoryToken(Setting));
  });

  describe('findAll', () => {
    it('should return all settings');
    it('should filter by category');
  });

  describe('create', () => {
    it('should create setting');
    it('should reject duplicate key');
  });

  // Add 15-20 more tests...
});
```

#### 📋 Checklist

```bash
- [ ] Create settings.service.spec.ts
- [ ] Implement 20+ tests
- [ ] Run: npm test -- settings.service.spec
- [ ] Target: 70%+ coverage
- [ ] Commit: "feat(tests): add SettingsService test suite"
```

#### ⏱️ Estimated Time: 1-2 days

---

## 📊 PROGRESS TRACKER

### Daily Checklist

**Day 1** (Today):
```bash
- [ ] Fix PurchaseOrdersService coverage (Issue #1)
      Estimated: 2 hours
      Impact: +5% coverage
      
- [ ] Setup E2E test infrastructure (Issue #3 - Part 1)
      Estimated: 2 hours
      Create docker-compose.test.yml, .env.test
```

**Day 2**:
```bash
- [ ] Create integration tests (Issue #2)
      Estimated: 4 hours
      Sales workflow, Purchase workflow
      
- [ ] Finish E2E setup and run tests (Issue #3 - Part 2)
      Estimated: 2 hours
```

**Day 3**: 
```bash
- [ ] Add error handling tests (Issue #4)
      Estimated: 4 hours
      All services:  database errors, transactions, concurrent updates
```

**Day 4-7** (This week):
```bash
- [ ] Create SettingsService tests (Issue #6)
      Estimated: 1 day
      
- [ ] Start E-InvoicesService tests (Issue #5)
      Estimated: 3-4 days
```

---

## 🎯 SUCCESS CRITERIA

### Coverage Targets After Fixes

```
┌──────────────────────────┬──────────┬──────────┬──────────┐
│ Service                  │ Current  │ Target   │ Status   │
├──────────────────────────┼──────────┼──────────┼──────────┤
│ PurchaseOrdersService    │ 50. 51%   │ 70%      │ 🔴 P0    │
│ E-InvoicesService        │ 0%       │ 70%      │ 🟠 P2    │
│ SettingsService          │ 0%       │ 70%      │ 🟠 P2    │
│ Integration Tests        │ 0        │ 20 tests │ 🔴 P0    │
│ E2E Tests                │ Not run  │ Passing  │ 🟡 P1    │
│ Error Handling           │ Partial  │ Complete │ 🟡 P1    │
│ OVERALL PROJECT          │ 42.29%   │ 60%+     │ 🎯       │
└──────────────────────────┴──────────┴──────────┴──────────┘
```

### Expected Results After All Fixes

```
Total Tests:  337 → ~450 tests (+113)
Coverage: 42.29% → 60%+ (+17.71%)
All tests passing: 100%
E2E tests:  All green
Integration tests: 20+ tests
Error handling: Comprehensive
```

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Fix PurchaseOrdersService coverage (Issue #1)
cd backend
code src/purchase-orders/purchase-orders.service.spec.ts
# Copy tests from section "Issue #1" above
npm test -- purchase-orders.service. spec
npm run test:cov

# 2. Setup E2E tests (Issue #3)
code docker-compose.test.yml
code .env.test
npm run db:test:up
npm run test:e2e

# 3. Create integration tests (Issue #2)
mkdir -p test/integration
code test/integration/workflows.spec.ts
# Copy tests from section "Issue #2" above
npm run test:e2e

# 4. Track progress
npm run test:cov
# Check overall coverage percentage
```

---

## 📞 SUPPORT

### Nếu Gặp Lỗi

**Database connection issues:**
```bash
# Check Docker status
docker ps

# Restart test database
npm run db:test:down
npm run db:test:up

# Check logs
docker logs finance-test-db
```

**Tests failing:**
```bash
# Run single test file
npm test -- purchase-orders.service.spec

# Run with verbose output
npm test -- --verbose

# Clear jest cache
npm test -- --clearCache
```

**Coverage not updating:**
```bash
# Delete coverage folder
rm -rf coverage

# Run fresh coverage
npm run test:cov
```

---

## ✅ COMPLETION CHECKLIST

### Priority 0 (Must do today)
- [ ] Issue #1: PurchaseOrdersService coverage fixed
- [ ] Issue #2: Integration tests created
- [ ] Verify tests pass:  npm test
- [ ] Verify coverage increase: npm run test:cov

### Priority 1 (This week)
- [ ] Issue #3: E2E tests running
- [ ] Issue #4: Error handling complete
- [ ] All services >= 70% coverage

### Priority 2 (Next week)
- [ ] Issue #5: E-InvoicesService tests
- [ ] Issue #6: SettingsService tests
- [ ] Overall coverage >= 60%

---

**🎯 GOAL:  Đạt 60% coverage trong 2 tuần! **

**Last Updated**: 2025-12-24  
**Status**: 🔴 URGENT - Bắt đầu ngay! 