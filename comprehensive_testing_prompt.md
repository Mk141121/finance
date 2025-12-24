# 🧪 PROMPT TESTING COMPREHENSIVE V1
## KIỂM THỬ TOÀN BỘ HỆ THỐNG KẾ TOÁN & TỰ ĐỘNG FIX LỖI

> **Version:** 1.0  
> **Purpose:** Test đầy đủ, phát hiện lỗi và fix ngay lập tức  
> **Scope:** Toàn bộ hệ thống đã build  

---

## 🎯 VAI TRÒ & NHIỆM VỤ

### Vai trò của Agent Testing

Bạn là **Senior QA Engineer** + **Senior Developer** với khả năng:

- ✅ **Test tự động** - Viết và chạy test cases đầy đủ
- ✅ **Debug chuyên sâu** - Phát hiện lỗi logic, syntax, runtime
- ✅ **Fix ngay lập tức** - Sửa lỗi và verify lại
- ✅ **Regression testing** - Đảm bảo fix không gây lỗi mới
- ✅ **Performance testing** - Kiểm tra hiệu năng
- ✅ **Security testing** - Phát hiện lỗ hổng bảo mật

### Nguyên tắc testing

- ⚠️ **ZERO TOLERANCE** - Không bỏ qua bất kỳ lỗi nào
- 🔄 **TEST → FIX → VERIFY** - Chu trình liên tục
- 📊 **REPORT DETAIL** - Báo cáo chi tiết từng test case
- ✅ **CODE COVERAGE** - Minimum 80% coverage
- 🎯 **EDGE CASES** - Test các trường hợp biên
- 🔐 **SECURITY FIRST** - Ưu tiên security issues

---

## 📋 DANH SÁCH KIỂM THỬ TOÀN DIỆN

### PHASE 1: INFRASTRUCTURE & SETUP ⚙️

#### 1.1. Environment Setup
```bash
TEST CASES:
✓ TC-ENV-001: Kiểm tra .env có đầy đủ biến không?
✓ TC-ENV-002: Validate format các biến môi trường
✓ TC-ENV-003: Kiểm tra connection strings hợp lệ
✓ TC-ENV-004: Test với missing environment variables
✓ TC-ENV-005: Test với invalid environment variables

EXPECTED RESULTS:
- .env.example đầy đủ
- Tất cả biến có giá trị mặc định hợp lệ
- Error messages rõ ràng khi thiếu biến
- Application không crash khi env sai

FIX IF FAIL:
- Thêm biến thiếu vào .env.example
- Validate env variables at startup
- Thêm error handling cho missing vars
```

#### 1.2. Dependencies Installation
```bash
TEST CASES:
✓ TC-DEP-001: npm install chạy thành công
✓ TC-DEP-002: Không có vulnerabilities nghiêm trọng
✓ TC-DEP-003: Version conflicts được resolve
✓ TC-DEP-004: peer dependencies đầy đủ
✓ TC-DEP-005: Dev dependencies vs Production dependencies

COMMANDS:
npm install
npm audit
npm outdated
npm list --depth=0

EXPECTED:
- 0 errors
- 0 high/critical vulnerabilities
- Tất cả packages compatible

FIX IF FAIL:
- Update packages: npm update
- Fix vulnerabilities: npm audit fix
- Resolve conflicts manually
```

#### 1.3. Database Connection & Migration
```bash
TEST CASES:
✓ TC-DB-001: Database connection thành công
✓ TC-DB-002: Migrations chạy UP thành công
✓ TC-DB-003: Migrations chạy DOWN thành công
✓ TC-DB-004: Seed data chạy thành công
✓ TC-DB-005: Database constraints hoạt động
✓ TC-DB-006: Foreign keys cascade đúng
✓ TC-DB-007: Indexes được tạo đúng
✓ TC-DB-008: Row Level Security hoạt động (PostgreSQL)

COMMANDS:
npm run migration:run
npm run migration:revert
npm run seed:run
psql -d database_name -c "\dt" # List tables
psql -d database_name -c "\di" # List indexes

EXPECTED:
- Tất cả tables được tạo
- Foreign keys đúng
- Indexes tối ưu
- RLS policies hoạt động

FIX IF FAIL:
- Sửa migration files
- Thêm missing constraints
- Tối ưu indexes
- Enable RLS policies
```

---

### PHASE 2: BACKEND TESTING 🔧

#### 2.1. Authentication & Authorization

##### A. Registration
```typescript
TEST CASES:

✓ TC-AUTH-001: Register với data hợp lệ
  Input: {
    email: "test@example.com",
    password: "P@ssw0rd123",
    full_name: "Nguyễn Văn A"
  }
  Expected: 201, user created, email verification sent

✓ TC-AUTH-002: Register với email trùng
  Input: { email: "existing@example.com", ... }
  Expected: 409 Conflict, "Email đã tồn tại"

✓ TC-AUTH-003: Register với email invalid
  Input: { email: "invalid-email", ... }
  Expected: 400 Bad Request, validation error

✓ TC-AUTH-004: Register với password yếu
  Input: { password: "123", ... }
  Expected: 400, "Mật khẩu phải có ít nhất 8 ký tự, chữ hoa, số, ký tự đặc biệt"

✓ TC-AUTH-005: Register với missing required fields
  Input: { email: "test@example.com" }
  Expected: 400, validation errors

✓ TC-AUTH-006: Register với SQL injection attempt
  Input: { email: "'; DROP TABLE users; --", ... }
  Expected: 400 hoặc sanitized safely

✓ TC-AUTH-007: Register với XSS attempt
  Input: { full_name: "<script>alert('xss')</script>", ... }
  Expected: Sanitized, stored safely

✓ TC-AUTH-008: Register đồng thời (race condition)
  Input: 100 concurrent requests với cùng email
  Expected: Chỉ 1 thành công, 99 fail

AUTOMATED TEST:
describe('Authentication - Registration', () => {
  it('should register successfully with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'P@ssw0rd123',
        full_name: 'Nguyễn Văn A'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('test@example.com');
  });

  it('should reject duplicate email', async () => {
    await createUser({ email: 'existing@example.com' });
    
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'P@ssw0rd123',
        full_name: 'Test User'
      });
    
    expect(response.status).toBe(409);
    expect(response.body.message).toContain('đã tồn tại');
  });

  // Add all other test cases...
});

FIX CHECKLIST:
- [ ] Validate email format with regex
- [ ] Check email uniqueness before insert
- [ ] Hash password with bcrypt (cost ≥ 12)
- [ ] Validate password strength
- [ ] Sanitize all inputs (XSS prevention)
- [ ] Use parameterized queries (SQL injection prevention)
- [ ] Add unique constraint on email column
- [ ] Implement rate limiting
- [ ] Add CSRF token
```

##### B. Login
```typescript
TEST CASES:

✓ TC-AUTH-009: Login với credentials đúng
  Input: { email: "user@example.com", password: "correct_password" }
  Expected: 200, { access_token, refresh_token, user_info }

✓ TC-AUTH-010: Login với password sai
  Expected: 401, "Email hoặc mật khẩu không đúng" (không tiết lộ email có tồn tại)

✓ TC-AUTH-011: Login với email không tồn tại
  Expected: 401, "Email hoặc mật khẩu không đúng"

✓ TC-AUTH-012: Login với account bị khóa
  Expected: 403, "Tài khoản đã bị khóa"

✓ TC-AUTH-013: Login brute force (5+ attempts)
  Input: 10 lần login sai liên tiếp
  Expected: Account locked sau 5 lần, 429 Rate Limited

✓ TC-AUTH-014: Login với email chưa verify
  Expected: 403, "Vui lòng xác thực email"

✓ TC-AUTH-015: JWT token có đúng payload
  Verify: token chứa { user_id, tenant_id, role, permissions, exp }

✓ TC-AUTH-016: Access token expires sau 15 phút
  Test: Login → Wait 16 mins → Request → Expect 401

✓ TC-AUTH-017: Refresh token hoạt động
  Test: Use refresh_token → Get new access_token

✓ TC-AUTH-018: Refresh token rotation
  Test: Use refresh_token → Old token invalid, new token issued

AUTOMATED TEST:
describe('Authentication - Login', () => {
  beforeEach(async () => {
    await createUser({
      email: 'test@example.com',
      password: await bcrypt.hash('P@ssw0rd123', 12),
      is_verified: true
    });
  });

  it('should login successfully', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'P@ssw0rd123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data).toHaveProperty('refresh_token');
  });

  it('should reject wrong password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword'
      });
    
    expect(response.status).toBe(401);
  });

  it('should lock account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });
    }

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'P@ssw0rd123' });
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('khóa');
  });
});

FIX CHECKLIST:
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add login attempt tracking
- [ ] Lock account after 5 failed attempts
- [ ] Generic error message (don't reveal if email exists)
- [ ] JWT secret from env
- [ ] Access token expires: 15 mins
- [ ] Refresh token expires: 7 days
- [ ] Implement refresh token rotation
- [ ] Store refresh tokens in DB (for revocation)
```

##### C. Authorization (RBAC)
```typescript
TEST CASES:

✓ TC-RBAC-001: Admin có thể truy cập tất cả
✓ TC-RBAC-002: Kế toán không thể xóa Settings
✓ TC-RBAC-003: Viewer chỉ có thể xem (Read-only)
✓ TC-RBAC-004: User không thể access tenant khác
✓ TC-RBAC-005: Middleware kiểm tra tenant_id
✓ TC-RBAC-006: Middleware kiểm tra permissions

MATRIX TEST:
Role         | Customers | Sales Orders | Settings | Users
-------------|-----------|--------------|----------|-------
Admin        | CRUD      | CRUD         | CRUD     | CRUD
Accountant   | CRUD      | CRU          | CR       | R
Sales        | CRUD      | CRUD         | R        | R
Viewer       | R         | R            | R        | R

AUTOMATED TEST:
describe('Authorization - RBAC', () => {
  it('should allow admin to delete settings', async () => {
    const adminToken = await getToken('admin');
    const response = await request(app)
      .delete('/api/v1/settings/123')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
  });

  it('should deny accountant from deleting settings', async () => {
    const accountantToken = await getToken('accountant');
    const response = await request(app)
      .delete('/api/v1/settings/123')
      .set('Authorization', `Bearer ${accountantToken}`);
    
    expect(response.status).toBe(403);
  });

  it('should prevent cross-tenant access', async () => {
    const user1Token = await getTokenWithTenant('tenant-1');
    
    const response = await request(app)
      .get('/api/v1/customers/from-tenant-2')
      .set('Authorization', `Bearer ${user1Token}`);
    
    expect(response.status).toBe(404); // or 403
  });
});

FIX CHECKLIST:
- [ ] Implement RBAC guards
- [ ] Check role in JWT
- [ ] Validate permissions per endpoint
- [ ] Add tenant_id to all queries
- [ ] Use RLS policies (PostgreSQL)
- [ ] Audit log for all actions
```

---

#### 2.2. Multi-tenancy Isolation

```typescript
TEST CASES:

✓ TC-MT-001: Tenant A không thể query data của Tenant B
  Test: Login as Tenant A → Query Tenant B's customer → Expect 404/403

✓ TC-MT-002: Foreign keys respect tenant boundary
  Test: Tạo Sales Order với customer_id từ tenant khác → Expect fail

✓ TC-MT-003: Row Level Security hoạt động
  Test: Direct SQL query với tenant_id sai → No results

✓ TC-MT-004: User có thể thuộc nhiều tenants
  Test: User login → Switch tenant → Data changes

✓ TC-MT-005: Default tenant được set đúng
  Test: User login → Expect default tenant active

✓ TC-MT-006: Bulk operations không cross tenant
  Test: Import Excel → Tất cả records có cùng tenant_id

✓ TC-MT-007: Backup/Restore theo tenant
  Test: Backup Tenant A → Restore → Không affect Tenant B

✓ TC-MT-008: Search không cross tenant
  Test: Full-text search → Chỉ results trong tenant hiện tại

AUTOMATED TEST:
describe('Multi-tenancy Isolation', () => {
  let tenant1Token, tenant2Token;
  let customer1, customer2;

  beforeEach(async () => {
    // Setup 2 tenants with data
    tenant1Token = await createTenantAndLogin('tenant-1');
    tenant2Token = await createTenantAndLogin('tenant-2');
    
    customer1 = await createCustomer(tenant1Token, { name: 'Customer 1' });
    customer2 = await createCustomer(tenant2Token, { name: 'Customer 2' });
  });

  it('should not allow tenant-1 to access tenant-2 data', async () => {
    const response = await request(app)
      .get(`/api/v1/customers/${customer2.id}`)
      .set('Authorization', `Bearer ${tenant1Token}`);
    
    expect(response.status).toBe(404);
  });

  it('should not allow creating sales order with cross-tenant customer', async () => {
    const response = await request(app)
      .post('/api/v1/sales-orders')
      .set('Authorization', `Bearer ${tenant1Token}`)
      .send({
        customer_id: customer2.id, // From tenant-2!
        items: [...]
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Khách hàng không tồn tại');
  });

  it('should enforce RLS at database level', async () => {
    // Direct query với tenant_id khác
    await db.query(`SET app.tenant_id = 'tenant-1'`);
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [customer2.id]);
    
    expect(result.rows.length).toBe(0);
  });
});

FIX CHECKLIST:
- [ ] Add tenant_id to ALL business tables
- [ ] Create composite indexes (tenant_id, id)
- [ ] Enable Row Level Security
- [ ] Create RLS policies for each table
- [ ] Middleware sets tenant_id in context
- [ ] Validate FK references within tenant
- [ ] Add tenant_id to WHERE clause automatically
- [ ] Test with PostgreSQL session variable
```

---

#### 2.3. Settings Module

```typescript
TEST CASES:

✓ TC-SET-001: Get all settings
  GET /api/v1/settings
  Expected: { company: {...}, invoice: {...}, ... }

✓ TC-SET-002: Get settings by category
  GET /api/v1/settings/company
  Expected: { company_name, tax_code, ... }

✓ TC-SET-003: Update setting
  PUT /api/v1/settings/invoice/default_tax_rate
  Body: { value: { rate: 10, type: 'percentage' } }
  Expected: 200, setting updated

✓ TC-SET-004: Setting validation
  PUT /api/v1/settings/invoice/default_tax_rate
  Body: { value: { rate: 15 } } // 15% không hợp lệ ở VN
  Expected: 400, validation error

✓ TC-SET-005: Settings theo tenant
  Test: Tenant A update settings → Tenant B settings không đổi

✓ TC-SET-006: Default settings khi tạo tenant mới
  Test: Create tenant → Settings auto-populated with defaults

✓ TC-SET-007: Setting history (audit)
  Test: Update setting → Check audit log

✓ TC-SET-008: JSONB queries hoạt động
  Test: Query nested JSON fields

AUTOMATED TEST:
describe('Settings Module', () => {
  let token;

  beforeEach(async () => {
    token = await createTenantAndLogin();
  });

  it('should get all settings', async () => {
    const response = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('company');
    expect(response.body.data).toHaveProperty('invoice');
  });

  it('should update setting successfully', async () => {
    const response = await request(app)
      .put('/api/v1/settings/invoice/default_tax_rate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        value: { rate: 10, type: 'percentage' }
      });
    
    expect(response.status).toBe(200);
    
    // Verify
    const getResponse = await request(app)
      .get('/api/v1/settings/invoice')
      .set('Authorization', `Bearer ${token}`);
    
    expect(getResponse.body.data.default_tax_rate.rate).toBe(10);
  });

  it('should validate tax rate', async () => {
    const response = await request(app)
      .put('/api/v1/settings/invoice/default_tax_rate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        value: { rate: 15 } // Invalid in VN
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Thuế suất không hợp lệ');
  });

  it('should isolate settings between tenants', async () => {
    const token2 = await createTenantAndLogin();
    
    // Tenant 1 updates
    await request(app)
      .put('/api/v1/settings/company/company_name')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'Company A' });
    
    // Tenant 2 checks
    const response = await request(app)
      .get('/api/v1/settings/company')
      .set('Authorization', `Bearer ${token2}`);
    
    expect(response.body.data.company_name).not.toBe('Company A');
  });
});

FIX CHECKLIST:
- [ ] Settings table with tenant_id
- [ ] JSONB column for flexible values
- [ ] Validation rules per setting type
- [ ] Default settings seeder
- [ ] Audit trail for changes
- [ ] Cache frequently accessed settings
- [ ] Proper indexing on (tenant_id, category, key)
```

---

#### 2.4. Master Data (Customers, Suppliers, Products)

```typescript
TEST CASES (for each entity):

✓ TC-CUST-001: Create customer với data hợp lệ
✓ TC-CUST-002: Create với mã trùng → 409
✓ TC-CUST-003: Create với MST không hợp lệ → 400
✓ TC-CUST-004: Get list với pagination
✓ TC-CUST-005: Get list với sorting
✓ TC-CUST-006: Get list với filtering
✓ TC-CUST-007: Search by name/code/tax_code
✓ TC-CUST-008: Get by ID
✓ TC-CUST-009: Update customer
✓ TC-CUST-010: Soft delete customer
✓ TC-CUST-011: Cannot delete customer có transactions
✓ TC-CUST-012: Import Excel thành công
✓ TC-CUST-013: Import Excel với duplicate codes → Partial success
✓ TC-CUST-014: Import Excel validation errors → Return error file
✓ TC-CUST-015: Export Excel
✓ TC-CUST-016: Download template
✓ TC-CUST-017: Upload > 10000 records → Background job

DETAILED TEST - CREATE CUSTOMER:
describe('Customers - Create', () => {
  it('should create customer successfully', async () => {
    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'KH001',
        name: 'Công ty TNHH ABC',
        type: 'business',
        tax_code: '0123456789',
        email: 'contact@abc.com',
        phone: '0901234567',
        address: '123 Nguyễn Huệ, Q1, TP.HCM'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.data.code).toBe('KH001');
  });

  it('should reject duplicate code', async () => {
    await createCustomer({ code: 'KH001' });
    
    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'KH001',
        name: 'Another Company'
      });
    
    expect(response.status).toBe(409);
  });

  it('should validate Vietnamese tax code', async () => {
    const response = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'KH002',
        name: 'Company',
        type: 'business',
        tax_code: '123' // Invalid format
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Mã số thuế không hợp lệ');
  });

  it('should validate Vietnamese phone number', async () => {
    const validPhones = [
      '0901234567',
      '+84901234567',
      '84901234567',
      '02812345678' // Landline
    ];

    for (const phone of validPhones) {
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: `KH${Date.now()}`,
          name: 'Company',
          phone: phone
        });
      
      expect(response.status).toBe(201);
    }
  });
});

IMPORT EXCEL TEST:
describe('Customers - Import Excel', () => {
  it('should import successfully with valid data', async () => {
    const excelBuffer = createExcelFile([
      { code: 'KH001', name: 'Customer 1', tax_code: '0123456789' },
      { code: 'KH002', name: 'Customer 2', tax_code: '0123456788' }
    ]);

    const response = await request(app)
      .post('/api/v1/customers/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', excelBuffer, 'customers.xlsx');
    
    expect(response.status).toBe(200);
    expect(response.body.data.success).toBe(2);
    expect(response.body.data.failed).toBe(0);
  });

  it('should handle validation errors', async () => {
    const excelBuffer = createExcelFile([
      { code: 'KH001', name: 'Valid Customer' },
      { code: '', name: 'Invalid - No Code' },
      { code: 'KH003', name: '' }, // Invalid - No Name
    ]);

    const response = await request(app)
      .post('/api/v1/customers/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', excelBuffer, 'customers.xlsx');
    
    expect(response.status).toBe(200);
    expect(response.body.data.success).toBe(1);
    expect(response.body.data.failed).toBe(2);
    expect(response.body.data.error_file).toBeDefined();
    
    // Download error file and verify
    const errorFile = await downloadFile(response.body.data.error_file);
    const errors = parseExcel(errorFile);
    expect(errors[1].error).toContain('Mã khách hàng không được để trống');
  });

  it('should handle upsert (update existing)', async () => {
    await createCustomer({ code: 'KH001', name: 'Old Name' });

    const excelBuffer = createExcelFile([
      { code: 'KH001', name: 'New Name', email: 'new@example.com' }
    ]);

    const response = await request(app)
      .post('/api/v1/customers/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', excelBuffer, 'customers.xlsx');
    
    expect(response.status).toBe(200);
    expect(response.body.data.updated).toBe(1);
    
    // Verify update
    const customer = await getCustomer('KH001');
    expect(customer.name).toBe('New Name');
    expect(customer.email).toBe('new@example.com');
  });
});

FIX CHECKLIST:
- [ ] Unique constraint on (tenant_id, code)
- [ ] Validate MST format: 10 hoặc 13 số
- [ ] Validate phone: regex cho VN
- [ ] Validate email format
- [ ] Pagination với cursor hoặc offset
- [ ] Filtering với query params
- [ ] Full-text search (PostgreSQL)
- [ ] Soft delete với deleted_at
- [ ] Check FK constraints before delete
- [ ] Excel import với validation
- [ ] Excel import upsert logic
- [ ] Excel export với template
- [ ] Background job cho large imports
```

---

#### 2.5. Sales Module

```typescript
TEST CASES:

✓ TC-SALES-001: Tạo báo giá
✓ TC-SALES-002: Chuyển báo giá → Đơn hàng
✓ TC-SALES-003: Tạo đơn hàng trực tiếp
✓ TC-SALES-004: Đơn hàng với nhiều items
✓ TC-SALES-005: Tính tổng tiền đúng (subtotal, tax, total)
✓ TC-SALES-006: Áp dụng discount
✓ TC-SALES-007: Kiểm tra tồn kho trước khi confirm
✓ TC-SALES-008: Confirm đơn hàng → Status = Confirmed
✓ TC-SALES-009: Xuất kho từ đơn hàng
✓ TC-SALES-010: Xuất kho giảm tồn kho đúng
✓ TC-SALES-011: Không cho xuất kho khi hết hàng (nếu setting không cho âm)
✓ TC-SALES-012: Cancel đơn hàng → Hoàn tồn kho
✓ TC-SALES-013: Ghi sổ tự động khi xuất hóa đơn
✓ TC-SALES-014: Định khoản đúng (TK 131, 511, 3331, 632, 156)

BUSINESS LOGIC TEST:
describe('Sales - Order Creation & Processing', () => {
  let customer, product1, product2;

  beforeEach(async () => {
    customer = await createCustomer({ code: 'KH001' });
    product1 = await createProduct({ code: 'SP001', price: 100000, cost: 70000 });
    product2 = await createProduct({ code: 'SP002', price: 200000, cost: 150000 });
    
    // Add stock
    await addStock(product1.id, 