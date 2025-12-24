# Backend APIs - Đã implement

## Authentication
- POST `/api/v1/auth/register` - Đăng ký tài khoản
- POST `/api/v1/auth/login` - Đăng nhập (trả JWT + tenantId)
- GET `/api/v1/auth/me` - Lấy thông tin user hiện tại

## Multi-tenancy
- GET `/api/v1/tenants` - Danh sách tenants
- GET `/api/v1/tenants/my-tenants` - Tenants của user hiện tại
- GET `/api/v1/tenants/:id` - Chi tiết tenant
- POST `/api/v1/tenants` - Tạo tenant mới
- PUT `/api/v1/tenants/:id` - Cập nhật tenant
- DELETE `/api/v1/tenants/:id` - Xóa tenant
- POST `/api/v1/tenants/:tenantId/set-default` - Set tenant mặc định

## Settings
- GET `/api/v1/settings` - Danh sách settings
- GET `/api/v1/settings/:category/:key` - Lấy setting cụ thể
- POST `/api/v1/settings` - Tạo setting
- PUT `/api/v1/settings/:id` - Cập nhật setting
- PUT `/api/v1/settings/:category/:key` - Cập nhật theo category/key
- DELETE `/api/v1/settings/:id` - Xóa setting

## Products
- GET `/api/v1/products` - Danh sách sản phẩm
- GET `/api/v1/products/:id` - Chi tiết sản phẩm
- POST `/api/v1/products` - Tạo sản phẩm
- PUT `/api/v1/products/:id` - Cập nhật sản phẩm
- DELETE `/api/v1/products/:id` - Xóa sản phẩm
- POST `/api/v1/products/import` - Import từ Excel

## Customers
- GET `/api/v1/customers` - Danh sách khách hàng
- GET `/api/v1/customers/:id` - Chi tiết khách hàng
- POST `/api/v1/customers` - Tạo khách hàng
- PUT `/api/v1/customers/:id` - Cập nhật khách hàng
- DELETE `/api/v1/customers/:id` - Xóa khách hàng

## Suppliers
- GET `/api/v1/suppliers` - Danh sách nhà cung cấp
- GET `/api/v1/suppliers/:id` - Chi tiết NCC
- POST `/api/v1/suppliers` - Tạo NCC
- PUT `/api/v1/suppliers/:id` - Cập nhật NCC
- DELETE `/api/v1/suppliers/:id` - Xóa NCC

## 🆕 Quotations (Sales - Báo giá)
- POST `/api/v1/quotations` - Tạo báo giá
- GET `/api/v1/quotations` - Danh sách báo giá
- GET `/api/v1/quotations/:id` - Chi tiết báo giá
- PATCH `/api/v1/quotations/:id` - Cập nhật báo giá
- PATCH `/api/v1/quotations/:id/status` - Cập nhật trạng thái
- DELETE `/api/v1/quotations/:id` - Xóa báo giá
- POST `/api/v1/quotations/check-expired` - Tự động đánh dấu hết hạn

**Status flow:** draft → sent → accepted/rejected/expired

## 🆕 Sales Orders (Bán hàng - Đơn hàng)
- POST `/api/v1/sales-orders` - Tạo đơn hàng
- GET `/api/v1/sales-orders` - Danh sách đơn hàng
- GET `/api/v1/sales-orders/:id` - Chi tiết đơn hàng
- PATCH `/api/v1/sales-orders/:id` - Cập nhật đơn hàng
- PATCH `/api/v1/sales-orders/:id/status` - Cập nhật trạng thái
- DELETE `/api/v1/sales-orders/:id` - Xóa đơn hàng

**Status flow:** draft → confirmed → processing → completed/cancelled

## 🆕 Purchase Orders (Mua hàng - Đơn mua)
- POST `/api/v1/purchase-orders` - Tạo đơn mua
- GET `/api/v1/purchase-orders` - Danh sách đơn mua
- GET `/api/v1/purchase-orders/:id` - Chi tiết đơn mua
- PATCH `/api/v1/purchase-orders/:id` - Cập nhật đơn mua
- PATCH `/api/v1/purchase-orders/:id/status` - Cập nhật trạng thái
- DELETE `/api/v1/purchase-orders/:id` - Xóa đơn mua

**Status flow:** draft → sent → confirmed → received/cancelled

## 🆕 Inventory (Quản lý kho)

### Warehouses
- GET `/api/v1/inventory/warehouses` - Danh sách kho
- GET `/api/v1/inventory/warehouses/:id` - Chi tiết kho

### Stock Transactions (Xuất nhập kho)
- POST `/api/v1/inventory/transactions` - Tạo phiếu xuất/nhập kho
- GET `/api/v1/inventory/transactions` - Danh sách phiếu
- GET `/api/v1/inventory/transactions/:id` - Chi tiết phiếu
- POST `/api/v1/inventory/transactions/:id/confirm` - Xác nhận phiếu (cập nhật tồn kho)

**Transaction types:**
- `in` - Nhập kho (từ đơn mua)
- `out` - Xuất kho (từ đơn bán)
- `adjustment` - Điều chỉnh
- `transfer` - Chuyển kho
- `return` - Trả hàng

**FIFO Logic:** Khi confirm phiếu xuất, tự động lấy từ batch cũ nhất trước

### Stock Balances (Tồn kho)
- GET `/api/v1/inventory/balances` - Tồn kho tất cả sản phẩm
- GET `/api/v1/inventory/balances?warehouseId=xxx` - Tồn kho theo kho
- GET `/api/v1/inventory/balances/:productId/:warehouseId` - Tồn kho 1 sản phẩm

**Balance fields:**
- `quantity` - Tổng tồn
- `reservedQuantity` - Đã giữ (cho đơn hàng)
- `availableQuantity` - Có thể bán
- `averageCost` - Giá vốn bình quân
- `totalValue` - Giá trị tồn kho

## 📄 E-Invoice (Hóa đơn điện tử)

### Invoice Management
- POST `/api/v1/e-invoices` - Tạo hóa đơn nháp
- GET `/api/v1/e-invoices` - Danh sách hóa đơn
- GET `/api/v1/e-invoices/:id` - Chi tiết hóa đơn
- PUT `/api/v1/e-invoices/:id` - Sửa hóa đơn nháp
- DELETE `/api/v1/e-invoices/:id` - Xóa hóa đơn nháp

### Invoice Operations
- POST `/api/v1/e-invoices/:id/issue` - Phát hành (tạo XML + ký số)
- POST `/api/v1/e-invoices/:id/send` - Gửi cho khách hàng
- POST `/api/v1/e-invoices/:id/cancel` - Hủy hóa đơn
- POST `/api/v1/e-invoices/:id/replace` - Thay thế/điều chỉnh

### XML Downloads
- GET `/api/v1/e-invoices/:id/xml` - Download XML gốc
- GET `/api/v1/e-invoices/:id/xml/signed` - Download XML đã ký

**Invoice types:**
- `vat_invoice` - Hóa đơn GTGT (01GTKT)
- `sales_invoice` - Hóa đơn bán hàng (02GTTT)
- `export_invoice` - Hóa đơn xuất khẩu (04HGDL)
- `adjustment_invoice` - Hóa đơn điều chỉnh (05ĐCHĐ)
- `replacement_invoice` - Hóa đơn thay thế (06TTHĐ)

**Invoice statuses:**
- `draft` - Nháp (có thể sửa/xóa)
- `issued` - Đã phát hành (có XML + chữ ký)
- `sent` - Đã gửi khách hàng
- `signed` - Đã ký số
- `cancelled` - Đã hủy
- `replaced` - Đã thay thế

**Features:**
- Auto-generate invoice number: 0000001, 0000002...
- Invoice series: C24TAA, C25TBA...
- Template code: 01GTKT0/001
- Lookup code: C24TAA20241223ABCDEF
- Digital signature: XML-DSig (RSA-SHA256)
- XML format: TCVN per Nghị định 123/2020
- Support multiple tax rates: 0%, 5%, 8%, 10%, KCT, KKKNT
- Amount in words (Vietnamese)

---

## 🆕 Accounting (Kế toán)

### Chart of Accounts (Hệ thống tài khoản)
- GET `/api/v1/accounting/accounts` - Danh sách tài khoản
- GET `/api/v1/accounting/accounts/:code` - Chi tiết tài khoản theo mã

**14 accounts có sẵn:**
- TK 111: Tiền mặt
- TK 112: Tiền gửi ngân hàng
- TK 131: Phải thu của khách hàng
- TK 156: Hàng hóa
- TK 1331: Thuế GTGT được khấu trừ
- TK 331: Phải trả cho người bán
- TK 3331: Thuế GTGT phải nộp
- TK 411: Vốn đầu tư
- TK 421: Lợi nhuận chưa phân phối
- TK 511: Doanh thu bán hàng
- TK 632: Giá vốn hàng bán
- TK 641: Chi phí bán hàng
- TK 642: Chi phí quản lý
- TK 911: Xác định KQKD

### Journal Entries (Bút toán)
- POST `/api/v1/accounting/journal-entries` - Tạo bút toán thủ công
- GET `/api/v1/accounting/journal-entries` - Danh sách bút toán
- GET `/api/v1/accounting/journal-entries/:id` - Chi tiết bút toán
- POST `/api/v1/accounting/journal-entries/:id/post` - Ghi sổ (post)
- DELETE `/api/v1/accounting/journal-entries/:id` - Xóa bút toán (chỉ draft)

**Auto Journal Entries:**

1. **Sales Order (completed):**
   ```
   Nợ TK 131 (Phải thu KH): Total
   Có TK 511 (Doanh thu): Subtotal - Discount
   Có TK 3331 (VAT phải nộp): Tax
   
   Nợ TK 632 (Giá vốn): COGS
   Có TK 156 (Hàng hóa): COGS
   ```

2. **Purchase Order (received):**
   ```
   Nợ TK 156 (Hàng hóa): Subtotal - Discount
   Nợ TK 1331 (VAT đầu vào): Tax
   Có TK 331 (Phải trả NCC): Total
   ```

**Entry types:**
- `manual` - Bút toán thủ công
- `auto_sales` - Tự động từ bán hàng
- `auto_purchase` - Tự động từ mua hàng
- `auto_inventory` - Tự động từ kho
- `opening` - Bút toán mở sổ
- `closing` - Bút toán kết chuyển

---

## Middleware
- ✅ **TenantMiddleware**: Tự động inject tenantId vào mọi request (trừ auth)
- ✅ **JwtAuthGuard**: Xác thực JWT token
- ✅ **RLS Policies**: Row Level Security tự động filter theo tenant_id

## Features
- ✅ Auto-calculate totals (subtotal, discount, tax)
- ✅ Status transition validation
- ✅ Soft delete (deleted_at)
- ✅ Relations (customer, supplier, product, items)
- ✅ Multi-tenant isolation
- ✅ Timestamp tracking (created_at, updated_at)
- ✅ **FIFO costing** - First-in-first-out inventory valuation
- ✅ **Weighted average cost** - Auto-calculate on stock in
- ✅ **Database transactions** - Rollback on error
- ✅ **Batch tracking** - Lot number, expiry date
- ✅ **Auto Journal Entries** - Tự động từ Sales/Purchases
- ✅ **Debit = Credit validation** - Bút toán cân đối
- ✅ **Chart of Accounts** - 14 TK theo TT133/2016

## Chưa có APIs cho:
- ⏳ Delivery Notes (Phiếu giao hàng)
- ⏳ Goods Receipts (Phiếu nhập kho)
- ⏳ Invoices (Hóa đơn điện tử)
- ⏳ Stock Transactions (Xuất nhập kho)
- ⏳ Journal Entries (Bút toán kế toán)
- ⏳ Chart of Accounts Management (Quản lý hệ thống tài khoản)
- ⏳ Financial Reports (Báo cáo tài chính)
