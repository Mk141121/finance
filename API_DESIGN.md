# API DESIGN - HỆ THỐNG KẾ TOÁN DOANH NGHIỆP

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Tất cả các API (trừ login/register) đều yêu cầu JWT token:
```
Authorization: Bearer <token>
```

---

## 1. AUTHENTICATION

### POST /auth/login
Đăng nhập hệ thống

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "full_name": "Nguyễn Văn A",
      "role": {
        "name": "admin",
        "display_name": "Quản trị hệ thống"
      }
    }
  }
}
```

### POST /auth/register
Đăng ký tài khoản mới (chỉ Admin)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Trần Văn B",
  "phone": "0901234567",
  "role_id": "uuid"
}
```

### GET /auth/me
Lấy thông tin user hiện tại

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@example.com",
    "full_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "role": {
      "name": "admin",
      "display_name": "Quản trị hệ thống"
    }
  }
}
```

### POST /auth/logout
Đăng xuất

---

## 2. SETTINGS (Cài đặt)

### GET /settings
Lấy tất cả cài đặt

**Query params:**
- `category` (optional): company, invoice, accounting, payroll, inventory, ui

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "category": "company",
      "key": "info",
      "value": {
        "name": "Công ty TNHH ABC",
        "tax_code": "0123456789",
        "address": "123 Đường ABC, Quận 1, TP.HCM",
        "phone": "028 1234 5678",
        "email": "info@abc.com",
        "logo": "/uploads/logo.png",
        "representative": "Nguyễn Văn A"
      }
    },
    {
      "id": "uuid",
      "category": "accounting",
      "key": "config",
      "value": {
        "accounting_standard": "TT133",
        "inventory_method": "FIFO",
        "rounding": 0,
        "currency": "VND"
      }
    }
  ]
}
```

### GET /settings/:category/:key
Lấy một cài đặt cụ thể

**Example:** `GET /settings/company/info`

### POST /settings
Tạo cài đặt mới

**Request:**
```json
{
  "category": "invoice",
  "key": "config",
  "value": {
    "template": "01GTKT",
    "series": "AA/22E",
    "start_number": 1,
    "default_vat_rate": 10,
    "provider": "vnpt"
  },
  "description": "Cài đặt hóa đơn điện tử"
}
```

### PUT /settings/:id
Cập nhật cài đặt

**Request:**
```json
{
  "value": {
    "template": "01GTKT",
    "series": "BB/23E",
    "start_number": 100
  }
}
```

---

## 3. PRODUCTS (Sản phẩm)

### GET /products
Lấy danh sách sản phẩm

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)
- `search`: Tìm theo mã hoặc tên
- `category_id`: Lọc theo nhóm
- `type`: product, service, material
- `is_active`: true/false

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "code": "SP001",
        "name": "Laptop Dell XPS 13",
        "type": "product",
        "category": {
          "id": "uuid",
          "name": "Máy tính"
        },
        "unit": {
          "code": "cai",
          "name": "Cái"
        },
        "sale_price": 25000000,
        "cost_price": 20000000,
        "vat_rate": 10,
        "manage_inventory": true,
        "is_active": true
      }
    ],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "total_pages": 8
    }
  }
}
```

### GET /products/:id
Lấy chi tiết sản phẩm

### POST /products
Tạo sản phẩm mới

**Request:**
```json
{
  "code": "SP002",
  "name": "iPhone 15 Pro",
  "type": "product",
  "category_id": "uuid",
  "unit_id": "uuid",
  "sale_price": 30000000,
  "cost_price": 25000000,
  "vat_rate": 10,
  "revenue_account": "511",
  "cogs_account": "632",
  "inventory_account": "156",
  "manage_inventory": true,
  "description": "Điện thoại cao cấp"
}
```

### PUT /products/:id
Cập nhật sản phẩm

### DELETE /products/:id
Xóa sản phẩm (soft delete)

### POST /products/import
Import sản phẩm từ Excel

**Request:** multipart/form-data
```
file: products.xlsx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_rows": 100,
    "success_count": 95,
    "error_count": 5,
    "errors": [
      {
        "row": 5,
        "code": "SP005",
        "error": "Mã sản phẩm đã tồn tại"
      }
    ],
    "error_file_url": "/downloads/products_errors.xlsx"
  }
}
```

### GET /products/categories
Lấy danh sách nhóm sản phẩm

### POST /products/categories
Tạo nhóm sản phẩm mới

### GET /products/units
Lấy danh sách đơn vị tính

---

## 4. CUSTOMERS (Khách hàng)

### GET /customers
Lấy danh sách khách hàng

**Query params:**
- `page`, `limit`, `search`
- `type`: individual, company
- `is_active`: true/false

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "code": "KH001",
        "name": "Công ty TNHH XYZ",
        "type": "company",
        "tax_code": "0987654321",
        "email": "contact@xyz.com",
        "phone": "028 9876 5432",
        "address": "456 Đường XYZ, Quận 2, TP.HCM",
        "balance": 50000000,
        "is_active": true
      }
    ],
    "meta": {
      "total": 80,
      "page": 1,
      "limit": 20,
      "total_pages": 4
    }
  }
}
```

### GET /customers/:id
Lấy chi tiết khách hàng

### POST /customers
Tạo khách hàng mới

**Request:**
```json
{
  "code": "KH002",
  "name": "Nguyễn Thị B",
  "type": "individual",
  "tax_code": "",
  "email": "nguyenb@gmail.com",
  "phone": "0901234567",
  "address": "789 Đường ABC, Quận 3, TP.HCM",
  "receivable_account": "131",
  "payment_terms": "Thanh toán trong 15 ngày",
  "credit_limit": 100000000
}
```

### PUT /customers/:id
Cập nhật khách hàng

### DELETE /customers/:id
Xóa khách hàng

### POST /customers/import
Import khách hàng từ Excel

### GET /customers/:id/invoices
Lấy danh sách hóa đơn của khách hàng

### GET /customers/:id/balance
Lấy công nợ khách hàng

**Response:**
```json
{
  "success": true,
  "data": {
    "customer_id": "uuid",
    "customer_name": "Công ty TNHH XYZ",
    "current_balance": 50000000,
    "total_invoices": 25,
    "total_amount": 500000000,
    "paid_amount": 450000000,
    "unpaid_amount": 50000000
  }
}
```

---

## 5. SUPPLIERS (Nhà cung cấp)

### GET /suppliers
Tương tự customers

### GET /suppliers/:id
Lấy chi tiết NCC

### POST /suppliers
Tạo NCC mới

**Request:**
```json
{
  "code": "NCC001",
  "name": "Công ty TNHH Cung cấp ABC",
  "type": "company",
  "tax_code": "0123456789",
  "bank_account": "1234567890",
  "bank_name": "Vietcombank",
  "email": "abc@supplier.com",
  "phone": "028 1111 2222",
  "address": "111 Đường Supplier, Quận 1, TP.HCM",
  "payable_account": "331"
}
```

### PUT /suppliers/:id
Cập nhật NCC

### DELETE /suppliers/:id
Xóa NCC

### POST /suppliers/import
Import NCC từ Excel

### GET /suppliers/:id/balance
Lấy công nợ NCC

---

## 6. INVENTORY (Kho vận)

### GET /warehouses
Lấy danh sách kho

### POST /warehouses
Tạo kho mới

### GET /inventory
Lấy tồn kho

**Query params:**
- `warehouse_id`
- `product_id`
- `status`: normal, low_stock, out_of_stock

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "warehouse": {
        "id": "uuid",
        "name": "Kho chính"
      },
      "product": {
        "id": "uuid",
        "code": "SP001",
        "name": "Laptop Dell XPS 13"
      },
      "quantity": 50,
      "unit_cost": 20000000,
      "total_value": 1000000000,
      "min_quantity": 10,
      "status": "normal"
    }
  ]
}
```

### GET /stock-transactions
Lấy danh sách phiếu nhập/xuất kho

**Query params:**
- `type`: IN, OUT, TRANSFER, ADJUST
- `warehouse_id`
- `from_date`, `to_date`
- `status`: draft, confirmed, cancelled

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "transaction_no": "NK001",
        "type": "IN",
        "warehouse": {
          "id": "uuid",
          "name": "Kho chính"
        },
        "transaction_date": "2024-01-15",
        "total_amount": 500000000,
        "status": "confirmed",
        "confirmed_at": "2024-01-15T10:30:00Z"
      }
    ],
    "meta": {
      "total": 50,
      "page": 1,
      "limit": 20
    }
  }
}
```

### GET /stock-transactions/:id
Lấy chi tiết phiếu

### POST /stock-transactions
Tạo phiếu nhập/xuất kho

**Request:**
```json
{
  "transaction_no": "NK002",
  "type": "IN",
  "warehouse_id": "uuid",
  "transaction_date": "2024-01-16",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 10,
      "unit_cost": 20000000,
      "lot_number": "LOT001",
      "expiry_date": "2025-12-31"
    }
  ],
  "notes": "Nhập kho từ NCC ABC"
}
```

### PUT /stock-transactions/:id/confirm
Xác nhận phiếu (cập nhật tồn kho)

### DELETE /stock-transactions/:id
Hủy phiếu

---

## 7. EMPLOYEES (Nhân sự)

### GET /employees
Lấy danh sách nhân viên

### GET /employees/:id
Lấy chi tiết nhân viên

### POST /employees
Tạo nhân viên mới

**Request:**
```json
{
  "code": "NV001",
  "full_name": "Trần Văn C",
  "email": "tranc@company.com",
  "phone": "0901234567",
  "id_number": "079123456789",
  "tax_code": "9876543210",
  "birth_date": "1990-01-15",
  "gender": "male",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "department_id": "uuid",
  "position_id": "uuid",
  "hire_date": "2024-01-01",
  "contract_type": "permanent",
  "dependents": 2
}
```

### PUT /employees/:id
Cập nhật nhân viên

### DELETE /employees/:id
Xóa nhân viên

### GET /departments
Lấy danh sách phòng ban

### GET /positions
Lấy danh sách chức vụ

### GET /attendance
Lấy dữ liệu chấm công

**Query params:**
- `employee_id`
- `from_date`, `to_date`

### POST /attendance
Tạo/cập nhật chấm công

**Request:**
```json
{
  "employee_id": "uuid",
  "attendance_date": "2024-01-15",
  "check_in": "2024-01-15T08:00:00Z",
  "check_out": "2024-01-15T17:30:00Z",
  "work_hours": 8.5,
  "overtime_hours": 1.5,
  "status": "present"
}
```

### GET /payrolls
Lấy danh sách bảng lương

### GET /payrolls/:id
Lấy chi tiết bảng lương

### POST /payrolls
Tạo bảng lương

**Request:**
```json
{
  "payroll_no": "BL202401",
  "month": 1,
  "year": 2024,
  "pay_date": "2024-02-05",
  "items": [
    {
      "employee_id": "uuid",
      "base_salary": 15000000,
      "allowances": 2000000,
      "bonus": 1000000,
      "work_days": 22,
      "overtime_hours": 10
    }
  ]
}
```

### PUT /payrolls/:id/confirm
Xác nhận bảng lương

---

## 8. INVOICES (Hóa đơn VAT)

### GET /invoices
Lấy danh sách hóa đơn

**Query params:**
- `customer_id`
- `from_date`, `to_date`
- `status`: draft, issued, cancelled

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "invoice_no": "0000001",
        "invoice_template": "01GTKT",
        "invoice_series": "AA/22E",
        "invoice_date": "2024-01-15",
        "customer": {
          "id": "uuid",
          "name": "Công ty TNHH XYZ",
          "tax_code": "0987654321"
        },
        "subtotal": 100000000,
        "vat_amount": 10000000,
        "total_amount": 110000000,
        "status": "issued",
        "issued_at": "2024-01-15T14:30:00Z"
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 20
    }
  }
}
```

### GET /invoices/:id
Lấy chi tiết hóa đơn

### POST /invoices
Tạo hóa đơn mới

**Request:**
```json
{
  "invoice_template": "01GTKT",
  "invoice_series": "AA/22E",
  "invoice_date": "2024-01-16",
  "customer_id": "uuid",
  "payment_method": "transfer",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "unit_price": 25000000,
      "vat_rate": 10
    }
  ],
  "notes": "Ghi chú hóa đơn"
}
```

### PUT /invoices/:id/issue
Phát hành hóa đơn (gửi lên nhà cung cấp HĐĐT)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoice_no": "0000001",
    "status": "issued",
    "provider_invoice_id": "VNPT123456",
    "xml_file_path": "/invoices/xml/invoice_0000001.xml",
    "pdf_file_path": "/invoices/pdf/invoice_0000001.pdf"
  }
}
```

### PUT /invoices/:id/cancel
Hủy hóa đơn

### GET /invoices/:id/download-pdf
Tải xuống hóa đơn PDF

### GET /invoices/:id/download-xml
Tải xuống hóa đơn XML

---

## 9. ACCOUNTING (Kế toán tổng hợp)

### GET /chart-of-accounts
Lấy hệ thống tài khoản

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "account_code": "111",
      "account_name": "Tiền mặt",
      "account_type": "asset",
      "level": 1,
      "is_detail": true,
      "is_active": true
    }
  ]
}
```

### GET /accounting-vouchers
Lấy danh sách chứng từ kế toán

**Query params:**
- `voucher_type`: PC, PT, PK, KC
- `from_date`, `to_date`
- `status`: draft, posted, cancelled

### GET /accounting-vouchers/:id
Lấy chi tiết chứng từ

### POST /accounting-vouchers
Tạo chứng từ kế toán

**Request:**
```json
{
  "voucher_no": "PC001",
  "voucher_type": "PC",
  "voucher_date": "2024-01-15",
  "description": "Chi tiền mua hàng hóa",
  "entries": [
    {
      "debit_account": "156",
      "credit_account": "111",
      "amount": 50000000,
      "description": "Mua hàng hóa"
    },
    {
      "debit_account": "133",
      "credit_account": "111",
      "amount": 5000000,
      "description": "Thuế GTGT được khấu trừ"
    }
  ]
}
```

### PUT /accounting-vouchers/:id/post
Ghi sổ (post to ledger)

### GET /general-ledger
Lấy sổ cái

**Query params:**
- `account_code`
- `from_date`, `to_date`

**Response:**
```json
{
  "success": true,
  "data": {
    "account_code": "111",
    "account_name": "Tiền mặt",
    "opening_balance": 100000000,
    "entries": [
      {
        "entry_date": "2024-01-15",
        "voucher_no": "PT001",
        "description": "Thu tiền bán hàng",
        "debit_amount": 55000000,
        "credit_amount": 0,
        "balance": 155000000
      }
    ],
    "closing_balance": 155000000
  }
}
```

### GET /reports/balance-sheet
Báo cáo cân đối kế toán

**Query params:**
- `as_of_date`: Ngày báo cáo (default: hôm nay)

### GET /reports/income-statement
Báo cáo kết quả kinh doanh

**Query params:**
- `from_date`, `to_date`

### GET /reports/cash-flow
Báo cáo lưu chuyển tiền tệ

---

## 10. COMMON RESPONSES

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi bằng tiếng Việt",
    "details": { ... }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Chưa đăng nhập
- `FORBIDDEN`: Không có quyền truy cập
- `NOT_FOUND`: Không tìm thấy dữ liệu
- `VALIDATION_ERROR`: Dữ liệu không hợp lệ
- `DUPLICATE_CODE`: Mã đã tồn tại
- `INSUFFICIENT_INVENTORY`: Không đủ hàng trong kho
- `INVALID_ACCOUNTING_ENTRY`: Định khoản không hợp lệ

---

## 11. PAGINATION

Tất cả API list đều hỗ trợ pagination:

**Query params:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "total_pages": 8
    }
  }
}
```

---

## 12. SORTING & FILTERING

**Query params:**
- `sort_by`: Tên trường cần sắp xếp
- `order`: asc, desc (default: asc)

**Example:**
```
GET /products?sort_by=created_at&order=desc
```

---

## 13. FILE UPLOAD

**Endpoint:** `POST /upload`

**Request:** multipart/form-data
```
file: <binary>
type: logo | invoice | document
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/file_123456.png",
    "filename": "logo.png",
    "size": 102400
  }
}
```
