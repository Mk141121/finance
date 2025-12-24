# Testing Guide - Kiểm tra APIs

## Prerequisites
1. Backend đang chạy: `http://localhost:3000`
2. Có JWT token (sau khi login)
3. Có tenantId (từ response login)

## 1. Register & Login

### Register
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@demo.com",
    "email": "admin@demo.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@demo.com",
    "password": "Admin123!"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin@demo.com",
    "email": "admin@demo.com",
    "tenant": {
      "id": "tenant-uuid",
      "name": "DEMO Company"
    }
  }
}
```

Lưu `access_token` để dùng cho các requests tiếp theo.

---

## 2. Test Quotations (Báo giá)

### Tạo quotation
```bash
curl -X POST http://localhost:3000/api/v1/quotations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "QT-2024-001",
    "date": "2024-01-15",
    "validUntil": "2024-02-15",
    "customerId": "CUSTOMER_UUID",
    "taxRate": 10,
    "discountRate": 5,
    "notes": "Báo giá tháng 1/2024",
    "items": [
      {
        "productId": "PRODUCT_UUID",
        "description": "iPhone 15 Pro Max 256GB",
        "quantity": 10,
        "unit": "chiếc",
        "unitPrice": 30000000,
        "taxRate": 10
      }
    ]
  }'
```

### Lấy danh sách quotations
```bash
curl -X GET http://localhost:3000/api/v1/quotations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cập nhật status
```bash
curl -X PATCH http://localhost:3000/api/v1/quotations/QUOTATION_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "sent"
  }'
```

**Status flow:** `draft` → `sent` → `accepted/rejected/expired`

---

## 3. Test Sales Orders (Đơn hàng bán)

### Tạo sales order
```bash
curl -X POST http://localhost:3000/api/v1/sales-orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SO-2024-001",
    "date": "2024-01-15",
    "customerId": "CUSTOMER_UUID",
    "quotationId": "QUOTATION_UUID",
    "deliveryDate": "2024-01-20",
    "deliveryAddress": "123 Đường ABC, Hà Nội",
    "taxRate": 10,
    "paymentMethod": "bank_transfer",
    "items": [
      {
        "productId": "PRODUCT_UUID",
        "description": "iPhone 15 Pro Max 256GB",
        "quantityOrdered": 10,
        "unit": "chiếc",
        "unitPrice": 30000000,
        "taxRate": 10
      }
    ]
  }'
```

### Cập nhật status sales order
```bash
curl -X PATCH http://localhost:3000/api/v1/sales-orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

**Status flow:** `draft` → `confirmed` → `processing` → `completed/cancelled`

---

## 4. Test Purchase Orders (Đơn mua hàng)

### Tạo purchase order
```bash
curl -X POST http://localhost:3000/api/v1/purchase-orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PO-2024-001",
    "date": "2024-01-15",
    "supplierId": "SUPPLIER_UUID",
    "expectedDeliveryDate": "2024-01-25",
    "deliveryAddress": "Kho 1 - 456 Đường XYZ",
    "taxRate": 10,
    "paymentMethod": "bank_transfer",
    "items": [
      {
        "productId": "PRODUCT_UUID",
        "description": "iPhone 15 Pro Max 256GB",
        "quantityOrdered": 50,
        "unit": "chiếc",
        "unitPrice": 25000000,
        "taxRate": 10
      }
    ]
  }'
```

### Cập nhật status purchase order
```bash
curl -X PATCH http://localhost:3000/api/v1/purchase-orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "sent"
  }'
```

**Status flow:** `draft` → `sent` → `confirmed` → `received/cancelled`

---

## 5. Business Flow Testing

### Flow 1: Quote → Order → Delivery → Invoice
1. Tạo Quotation (status: draft)
2. Gửi cho khách (status: sent)
3. Khách chấp nhận (status: accepted)
4. Tạo Sales Order từ Quotation (link quotationId)
5. Xác nhận đơn (status: confirmed)
6. Xuất kho (status: processing)
7. Giao hàng xong (status: completed)
8. *TODO: Tạo Invoice từ Sales Order*

### Flow 2: Purchase → Receive → Payment
1. Tạo Purchase Order (status: draft)
2. Gửi cho NCC (status: sent)
3. NCC xác nhận (status: confirmed)
4. Nhận hàng (status: received)
5. *TODO: Tạo Goods Receipt*
6. *TODO: Nhập kho (Stock Transaction)*
7. *TODO: Thanh toán (Payment)*

---

## 6. Validation Tests

### Test 1: Invalid status transition
```bash
# Thử chuyển từ 'completed' → 'draft' (PHẢI LỖI)
curl -X PATCH http://localhost:3000/api/v1/sales-orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "draft"}'

# Expected: 400 Bad Request - "Cannot change status from completed to draft"
```

### Test 2: Update completed order
```bash
# Thử update đơn đã completed (PHẢI LỖI)
curl -X PATCH http://localhost:3000/api/v1/sales-orders/ORDER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Updated"}'

# Expected: 400 Bad Request - "Only draft or confirmed orders can be updated"
```

### Test 3: Negative quantities
```bash
# Quantity âm (PHẢI LỖI validation)
curl -X POST http://localhost:3000/api/v1/quotations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "QT-2024-002",
    "items": [{"productId": "xxx", "quantity": -10, "unitPrice": 100}]
  }'

# Expected: 400 Bad Request - validation error
```

---

## 7. Expected Calculations

### Input:
- Quantity: 10
- Unit Price: 1,000,000 VND
- Discount Rate: 5%
- Tax Rate (VAT): 10%

### Calculation:
```
Subtotal = 10 × 1,000,000 = 10,000,000
Discount = 10,000,000 × 5% = 500,000
After Discount = 10,000,000 - 500,000 = 9,500,000
Tax = 9,500,000 × 10% = 950,000
Total = 9,500,000 + 950,000 = 10,450,000
```

### Expected Response:
```json
{
  "subtotal": 10000000,
  "discountAmount": 500000,
  "taxAmount": 950000,
  "total": 10450000
}
```

---

## 8. Multi-tenancy Testing

### Test: User không access được data của tenant khác
```bash
# Login với tenant A
TOKEN_A="..."

# Login với tenant B
TOKEN_B="..."

# Tạo quotation với tenant A
QT_A_ID=$(curl -X POST ... -H "Authorization: Bearer $TOKEN_A")

# Thử GET quotation của A bằng token B (PHẢI LỖI 404)
curl -X GET http://localhost:3000/api/v1/quotations/$QT_A_ID \
  -H "Authorization: Bearer $TOKEN_B"

# Expected: 404 Not Found
```

---

## Postman Collection
Có thể import file này vào Postman để test nhanh hơn.

## Swagger/OpenAPI
Visit: `http://localhost:3000/api/docs` (nếu đã cấu hình Swagger)

---

## Next: Test Inventory + E-Invoice + Accounting
Sau khi implement 3 modules còn lại, sẽ có thêm test cases cho:
- Stock transactions
- FIFO costing
- XML invoice generation
- Auto journal entries
