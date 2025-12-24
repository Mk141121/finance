# Next Steps - Triển khai tiếp 3 modules còn lại

## 📦 Module 3: Inventory (Quản lý kho - Ưu tiên CAO)

### Entities cần tạo:
1. **Warehouses** (Đã có table, cần entity)
   - Quản lý kho: mã, tên, địa chỉ, loại kho

2. **ProductBatches** (Lô hàng)
   - Track theo batch/lot number
   - FIFO costing
   - Expiry date tracking

3. **ProductSerials** (Serial/IMEI)
   - Track theo serial number
   - Cho điện thoại, máy tính, thiết bị

4. **StockTransactions** (Phiếu xuất nhập kho)
   - Type: IN (nhập), OUT (xuất), ADJUSTMENT (điều chỉnh)
   - Link với purchase_orders, sales_orders
   - Auto-update stock balances

5. **StockBalances** (Tồn kho hiện tại)
   - Real-time balance theo product + warehouse
   - quantity, value

6. **StockCounts** (Kiểm kê)
   - Physical count vs system balance
   - Adjustment entries

7. **StockTransfers** (Chuyển kho)
   - From warehouse → To warehouse
   - Status: pending, in-transit, received

8. **StockAdjustments** (Điều chỉnh)
   - Increase/decrease quantity
   - Reasons: damaged, expired, lost, found

### Business Logic:
- **FIFO Costing**: First-in-first-out cho xuất kho
- **Weighted Average**: Giá vốn bình quân gia quyền
- **Auto Journal Entries**: Tự động sinh bút toán
  - Nhập kho: Nợ TK 156, Có TK 331
  - Xuất kho: Nợ TK 632, Có TK 156
- **Stock Reservation**: Giữ hàng cho đơn hàng
- **Negative Stock Warning**: Cảnh báo tồn kho âm

---

## 🧾 Module 4: E-Invoice (Hóa đơn điện tử - Nghị định 123/2020)

### Entities cần tạo:
1. **Invoices** (Đã có table)
   - invoice_number: Số hóa đơn (TCGP cấp)
   - invoice_template: Mẫu số (01GTKT, 02GTTT...)
   - invoice_series: Ký hiệu (AA/24E, BB/24E...)
   - invoice_date: Ngày lập
   - invoice_type: sales, purchase, adjustment
   - status: draft, signed, sent_to_cqt, cqt_accepted, cancelled

2. **InvoiceItems**
   - Link to product
   - Quantity, unit_price, tax_rate, line_total

3. **InvoiceHistory** (Lịch sử)
   - Tracking: created → signed → sent → accepted/rejected

4. **InvoiceProviderConfigs** (Cấu hình nhà cung cấp)
   - Provider: VNPT, Viettel, FPT, MobiFone, MISA
   - API credentials, certificates

5. **InvoiceSignatures** (Chữ ký số)
   - Digital signature
   - Certificate info
   - Signing algorithm (RSA, ECDSA)

### Business Logic:
- **XML Generation**: Theo chuẩn Nghị định 123/2020
- **Digital Signature**: Ký số XML
- **Send to CQT**: Gửi lên Cơ quan thuế
- **Invoice Cancellation**: Hủy hóa đơn (phải có lý do)
- **Invoice Adjustment**: Điều chỉnh hóa đơn (tạo hóa đơn điều chỉnh)
- **Invoice Replacement**: Thay thế hóa đơn (tạo hóa đơn thay thế)

### XML Template (Example):
```xml
<Invoice>
  <InvoiceNumber>0000001</InvoiceNumber>
  <InvoiceTemplate>01GTKT</InvoiceTemplate>
  <InvoiceSeries>AA/24E</InvoiceSeries>
  <InvoiceDate>2024-01-15</InvoiceDate>
  <Seller>
    <TaxCode>0100000000</TaxCode>
    <Name>CÔNG TY DEMO</Name>
  </Seller>
  <Buyer>
    <TaxCode>0200000000</TaxCode>
    <Name>KHÁCH HÀNG A</Name>
  </Buyer>
  <Items>
    <Item>
      <Name>Sản phẩm A</Name>
      <Quantity>10</Quantity>
      <UnitPrice>100000</UnitPrice>
      <TaxRate>10</TaxRate>
      <Amount>1100000</Amount>
    </Item>
  </Items>
  <TotalAmount>1100000</TotalAmount>
</Invoice>
```

---

## 📊 Module 5: Accounting (Kế toán - TT133/2016)

### Entities cần tạo:
1. **ChartOfAccounts** (Đã có 14 TK)
   - Cần thêm TK cấp 2, cấp 3 (1311, 1312, 13111...)
   - parent_id: Hierarchical structure

2. **FiscalPeriods** (Đã có)
   - year, start_date, end_date
   - status: open, closed

3. **JournalEntries** (Bút toán)
   - entry_date, entry_number
   - type: manual, auto_sales, auto_purchase, auto_inventory
   - status: draft, posted, reversed

4. **JournalEntryLines** (Chi tiết bút toán)
   - account_id (TK nợ/có)
   - debit_amount, credit_amount
   - description

5. **AccountBalances** (Số dư)
   - account_id, fiscal_period_id
   - opening_balance, debit, credit, closing_balance

6. **CashTransactions** (Sổ quỹ)
   - type: receipt (thu), payment (chi)
   - TK 111 (Tiền mặt)

7. **BankTransactions** (Sổ ngân hàng)
   - bank_account, transaction_number
   - TK 112 (Tiền gửi NH)

8. **BankReconciliations** (Đối soát NH)
   - Reconcile bank statement vs system

### Business Logic:
- **Auto Journal Entries từ Sales:**
  - Bán hàng: Nợ TK 131, Có TK 511 (doanh thu)
  - Giá vốn: Nợ TK 632, Có TK 156
  - VAT đầu ra: Nợ TK 131, Có TK 33311

- **Auto Journal Entries từ Purchases:**
  - Mua hàng: Nợ TK 156, Có TK 331
  - VAT đầu vào: Nợ TK 1331, Có TK 331

- **Financial Reports:**
  - Balance Sheet (Bảng cân đối kế toán)
  - Income Statement (Báo cáo kết quả kinh doanh)
  - Cash Flow Statement (Báo cáo lưu chuyển tiền tệ)
  - General Ledger (Sổ cái)
  - Trial Balance (Bảng cân đối số phát sinh)

---

## 🎯 Thứ tự triển khai đề xuất:

### Bước 1: Inventory (1-2 ngày)
- Ưu tiên cao vì Sales/Purchases cần connect
- Implement FIFO costing
- Stock transactions

### Bước 2: Accounting (1-2 ngày)
- Auto journal entries
- Chart of accounts hierarchy
- Basic reports

### Bước 3: E-Invoice (2-3 ngày)
- XML generation
- Digital signature (phức tạp)
- CQT integration (cần test với sandbox)

### Bước 4: Frontend (3-5 ngày)
- Next.js pages cho tất cả modules
- Ant Design forms + tables
- State management với Zustand

---

## 📝 Commands để tiếp tục:

### Tạo Inventory entities:
```bash
# Tạo warehouse entity
# Tạo stock transactions service với FIFO logic
# Connect với sales-orders và purchase-orders
```

### Tạo Accounting entities:
```bash
# Enhance chart-of-accounts với hierarchy
# Tạo journal entries service
# Auto-generate entries từ sales/purchases
```

### Tạo E-Invoice:
```bash
# Invoice service với XML generation
# Digital signature service
# CQT integration service
```

---

## 💾 Database đã có:
- ✅ 60+ tables
- ✅ RLS policies
- ✅ Foreign keys
- ✅ Indexes
- ✅ Demo data (14 COA, 1 warehouse, 2 fiscal periods)

## 🚀 Backend đã có:
- ✅ Multi-tenancy
- ✅ Authentication
- ✅ Quotations (7 APIs)
- ✅ Sales Orders (6 APIs)
- ✅ Purchase Orders (6 APIs)
- ✅ Auto-calculate totals
- ✅ Status validation

## ⏳ Còn lại:
- Inventory (8 entities)
- E-Invoice (5 entities)
- Accounting (5 entities + reports)
- Frontend (toàn bộ UI)

Bạn muốn tiếp tục với module nào trước? **Inventory**, **Accounting**, hay **E-Invoice**?
