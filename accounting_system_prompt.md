# 🧠 PROMPT FINAL V3 - HỆ THỐNG KẾ TOÁN DOANH NGHIỆP VIỆT NAM

> **Version:** 3.0  
> **Date:** 2025-01-09  
> **Purpose:** Xây dựng hệ thống kế toán SaaS Multi-tenant cho doanh nghiệp Việt Nam  
> **Tech Stack:** NestJS + PostgreSQL + React + React Native + AI

---

## 📋 MỤC LỤC

1. [Vai trò & Phạm vi](#1-vai-trò--phạm-vi)
2. [Mục tiêu hệ thống](#2-mục-tiêu-hệ-thống)
3. [Module nghiệp vụ chính](#3-module-nghiệp-vụ-chính)
4. [Module Settings](#4-module-settings-bắt-buộc)
5. [Master Data](#5-master-data)
6. [Multi-tenancy](#6-multi-tenancy-saas)
7. [Mobile App](#7-mobile-app-react-native)
8. [Yêu cầu kỹ thuật](#8-yêu-cầu-kỹ-thuật)
9. [Output bắt buộc](#9-output-bắt-buộc)
10. [Ràng buộc quan trọng](#10-ràng-buộc-cực-kỳ-quan-trọng)
11. [Hướng dẫn triển khai](#11-hướng-dẫn-triển-khai)
12. [Checklist hoàn thành](#12-checklist-hoàn-thành)

---

## 1. VAI TRÒ & PHẠM VI

### 🎭 Vai trò của AI Agent

Bạn là **Senior Software Architect** + **Senior Accountant (Việt Nam)** với nhiệm vụ:

- ✅ Thiết kế kiến trúc hệ thống kế toán SaaS quy mô doanh nghiệp
- ✅ Viết code **CHẠY ĐƯỢC 100%** (không pseudo code)
- ✅ Tuân thủ pháp luật kế toán & thuế Việt Nam
- ✅ Áp dụng best practices: Clean Code, SOLID, Design Patterns
- ✅ Tối ưu performance, security, scalability

### 📊 Phạm vi dự án

**Hệ thống kế toán doanh nghiệp Việt Nam** bao gồm:

- 🏢 **SaaS Multi-tenant** – nhiều công ty, cách ly dữ liệu tuyệt đối
- 🌐 **Web Application** – Desktop-first, responsive
- 📱 **Mobile App** – React Native (iOS + Android)
- 🏦 **Banking Integration** – đồng bộ sao kê, đối soát tự động
- 🤖 **AI Analytics** – dự đoán dòng tiền, phân tích chi phí
- 📄 **E-Invoice** – hóa đơn điện tử theo Nghị định 123/2020
- 📊 **Accounting Core** – sổ sách kế toán đầy đủ theo TT133/TT200

---

## 2. MỤC TIÊU HỆ THỐNG

### 🎯 Mục tiêu Nghiệp vụ

- ✅ Phần mềm kế toán **thực tế**, sử dụng được ngay tại Việt Nam
- ✅ Tuân thủ **100% pháp luật VN**:
  - Luật Kế toán 88/2015/QH13
  - Thông tư 133/2016/TT-BTC (DN nhỏ và vừa)
  - Thông tư 200/2014/TT-BTC (DN lớn)
  - Nghị định 123/2020/NĐ-CP (Hóa đơn điện tử)
  - Bộ luật Lao động 2019
  - Luật Thuế GTGT, TNDN, TNCN
- ✅ Giao diện **100% Tiếng Việt** (thuật ngữ kế toán chuẩn)
- ✅ **Settings đầy đủ** – không cần sửa code khi thay đổi nghiệp vụ
- ✅ **Import Excel** cập nhật dữ liệu hàng loạt

### ⚙️ Mục tiêu Kỹ thuật

- ✅ **Multi-tenancy** – hỗ trợ 10,000+ tenants
- ✅ **Scalability** – horizontal scaling
- ✅ **High Availability** – uptime 99.9%
- ✅ **Security** – mã hóa dữ liệu, audit trail đầy đủ
- ✅ **Performance** – response time < 200ms (P95)
- ✅ **Maintainability** – code clean, documented, tested

### 🎨 Mục tiêu Trải nghiệm

- ✅ **Light / Dark Mode** – lưu theo user
- ✅ **Responsive** – Desktop-first, hỗ trợ Tablet
- ✅ **Intuitive UI** – dễ sử dụng, ít đào tạo
- ✅ **Fast Loading** – skeleton screens, lazy loading
- ✅ **Error Handling** – messages rõ ràng bằng tiếng Việt

---

## 3. MODULE NGHIỆP VỤ CHÍNH

### 1️⃣ BÁN HÀNG (Sales)

**Entities:**
- Khách hàng (Customers)
- Báo giá (Quotations)
- Đơn hàng bán (Sales Orders)
- Phiếu xuất kho (Delivery Notes)
- Công nợ phải thu (Accounts Receivable)

**Flow:**
```
Báo giá → Đơn hàng → Phiếu xuất kho → Hóa đơn → Thu tiền
```

**Định khoản tự động:**
```sql
-- Bán hàng (đã VAT 10%)
Nợ 131 (Phải thu KH): 110,000,000
    Có 511 (Doanh thu):   100,000,000
    Có 3331 (VAT đầu ra): 10,000,000

-- Xuất kho (FIFO/Bình quân)
Nợ 632 (Giá vốn): 70,000,000
    Có 156 (Hàng hóa): 70,000,000
```

---

### 2️⃣ MUA HÀNG (Purchasing)

**Entities:**
- Nhà cung cấp (Suppliers)
- Yêu cầu mua hàng (Purchase Requests)
- Đơn mua hàng (Purchase Orders)
- Phiếu nhập kho (Goods Receipts)
- Công nợ phải trả (Accounts Payable)

**Flow:**
```
Yêu cầu mua → Đơn mua hàng → Nhập kho → Hóa đơn mua → Thanh toán
```

**Định khoản tự động:**
```sql
-- Mua hàng (đã VAT 10%)
Nợ 156 (Hàng hóa): 100,000,000
Nợ 1331 (VAT đầu vào): 10,000,000
    Có 331 (Phải trả NCC): 110,000,000
```

---

### 3️⃣ KHO (Inventory)

**Entities:**
- Danh mục hàng hóa (Items)
- Kho (Warehouses)
- Phiếu nhập/xuất/chuyển kho
- Phiếu kiểm kê (Stock Count)
- Tồn kho (Stock Balance)

**Phương pháp tính giá:**
- ✅ **FIFO** (First In First Out)
- ✅ **Bình quân gia quyền** (Weighted Average)
- ✅ **Định mức** (Standard Cost) – cho sản xuất

**Tính năng nâng cao:**
- Quản lý theo **Lô (Batch)** / **Serial Number**
- Quản lý **hạn sử dụng** (Expiry Date)
- **Barcode / QR Code** scanning
- Cảnh báo tồn kho **tối thiểu / tối đa**

---

### 4️⃣ HÓA ĐƠN ĐIỆN TỬ (E-Invoice)

**Chuẩn tuân thủ:**
- ✅ Nghị định 123/2020/NĐ-CP
- ✅ Thông tư 78/2021/TT-BTC
- ✅ Format XML chuẩn Cục Quản lý Thuế

**Loại hóa đơn:**
- Hóa đơn GTGT (VAT Invoice)
- Hóa đơn bán hàng (Sales Invoice)
- Hóa đơn bán tài sản

**Trạng thái:**
```
Dự thảo → Chờ ký → Đã ký → Đã gửi CQT → Đã gửi khách
         ↓
    Điều chỉnh / Thay thế / Hủy
```

**Tích hợp NCC HĐĐT (Adapter Pattern):**
- VNPT Invoice
- Viettel Sinvoice
- FPT Invoice
- MISA MeInvoice
- Bkav, VnInvoice
- **Custom Adapter**

**Chức năng:**
- ✅ Tạo, ký, gửi HĐĐT
- ✅ Xuất XML + PDF
- ✅ Kiểm tra chữ ký số
- ✅ Điều chỉnh/Thay thế/Hủy theo quy định
- ✅ Gửi email tự động
- ✅ Đồng bộ với CQT

---

### 5️⃣ KẾ TOÁN (Accounting)

**Chế độ kế toán:**
- ✅ Thông tư 133/2016/TT-BTC (DN nhỏ và vừa)
- ✅ Thông tư 200/2014/TT-BTC (DN lớn)

**Hệ thống tài khoản:**
```
TK 1xx: Tài sản ngắn hạn
TK 2xx: Tài sản dài hạn
TK 3xx: Nợ phải trả
TK 4xx: Vốn chủ sở hữu
TK 5xx: Doanh thu
TK 6xx: Chi phí sản xuất kinh doanh
TK 7xx: Thu nhập khác
TK 8xx: Chi phí khác
TK 9xx: Xác định KQKD
```

**Sổ sách kế toán:**
- Sổ nhật ký chung
- Sổ cái
- Sổ chi tiết tài khoản
- Sổ quỹ tiền mặt
- Sổ tiền gửi ngân hàng
- Thẻ kho
- Bảng tổng hợp chi tiết

**Kết chuyển cuối kỳ:**
```sql
-- Kết chuyển doanh thu
Nợ 511, 515, 711
    Có 911

-- Kết chuyển chi phí
Nợ 911
    Có 632, 641, 642, 811

-- Kết chuyển lãi lỗ
Nợ 911
    Có 421 (Lãi chưa phân phối)
```

**Báo cáo tài chính:**
- Bảng cân đối kế toán (Balance Sheet)
- Báo cáo KQHĐKD (Income Statement)
- Báo cáo lưu chuyển tiền tệ (Cash Flow)
- Thuyết minh BCTC

---

### 6️⃣ NHÂN SỰ - LƯƠNG (HR & Payroll)

**Quản lý nhân sự:**
- Hồ sơ nhân viên
- Hợp đồng lao động
- Quyết định bổ nhiệm/miễn nhiệm
- Khen thưởng/Kỷ luật

**Chấm công:**
- Công chuẩn/tháng
- Ca làm việc
- Tăng ca (150%, 200%, 300%)
- Nghỉ phép, nghỉ không lương

**Bảng lương:**
```
LƯƠNG CƠ BẢN
+ Phụ cấp (ăn trưa, xăng xe, điện thoại...)
+ Thưởng
+ Lương tăng ca
= TỔNG THU NHẬP

- BHXH (8%)
- BHYT (1.5%)
- BHTN (1%)
- Thuế TNCN (biểu lũy tiến)
- Các khoản khấu trừ khác
= LƯƠNG THỰC LĨNH
```

**Thuế TNCN (biểu lũy tiến):**
```
≤ 5 triệu:       5%
> 5 - 10 triệu:  10%
> 10 - 18 triệu: 15%
> 18 - 32 triệu: 20%
> 32 - 52 triệu: 25%
> 52 - 80 triệu: 30%
> 80 triệu:      35%

Giảm trừ:
- Bản thân: 11,000,000đ/tháng
- Người phụ thuộc: 4,400,000đ/người/tháng
```

---

### 7️⃣ NGÂN HÀNG (Banking Integration)

**Kết nối ngân hàng (Open Banking API):**
- Vietcombank, VietinBank, BIDV
- Techcombank, MBBank, ACB
- VPBank, Sacombank
- **Custom Adapter**

**Chức năng:**
- ✅ Kết nối tài khoản (OAuth2)
- ✅ Đồng bộ sao kê tự động
- ✅ Phân loại giao dịch (AI)
- ✅ Gợi ý phiếu thu/phiếu chi
- ✅ Đối soát công nợ
- ✅ Theo dõi số dư real-time

**Đối soát tự động:**
```
Sao kê ngân hàng ←→ Phiếu thu/chi ←→ Công nợ
```

---

### 8️⃣ AI PHÂN TÍCH (AI Analytics)

**⚠️ QUAN TRỌNG: AI chỉ phân tích & gợi ý, KHÔNG tự động ghi sổ**

#### A. Dự đoán dòng tiền (Cash Flow Forecasting)

**Thời gian:**
- 7 ngày tới
- 30 ngày tới
- 90 ngày tới

**Dữ liệu đầu vào:**
- Lịch sử thu chi
- Công nợ phải thu (tuổi nợ, tỷ lệ thu hồi)
- Công nợ phải trả (lịch thanh toán)
- Đơn hàng chưa thực hiện
- Chi phí cố định

**Thuật toán:**
- Time Series: ARIMA, Prophet
- Machine Learning: XGBoost, LSTM

**Đầu ra:**
- Biểu đồ dự đoán
- Cảnh báo thiếu tiền
- Gợi ý hành động

#### B. Phân tích khách hàng

**Phân loại:**
- Khách hàng VIP
- Khách hàng tiềm năng
- Khách hàng rủi ro

**Cảnh báo:**
- Trả chậm > 30/60/90 ngày
- Dấu hiệu nợ xấu
- Giảm doanh thu đột ngột

#### C. Phân tích chi phí

**Phát hiện bất thường:**
- Chi phí tăng đột biến
- Chi phí không hợp lý
- So sánh cùng kỳ năm trước

#### D. Trợ lý ảo (Chatbot)

**Chức năng:**
- Trả lời câu hỏi nghiệp vụ
- Hướng dẫn sử dụng
- Tra cứu thông tin nhanh
- Tạo báo cáo bằng ngôn ngữ tự nhiên

---

## 4. MODULE SETTINGS (BẮT BUỘC)

### A. Cài đặt Doanh nghiệp

**Thông tin cơ bản:**
- Tên công ty (đầy đủ)
- Tên viết tắt
- Mã số thuế (MST)
- Địa chỉ trụ sở
- SĐT, Email, Website
- Logo (upload + preview)
- Người đại diện pháp luật

**Kế toán:**
- Chế độ kế toán: TT133 / TT200
- Kỳ kế toán: MM/YYYY
- Ngày bắt đầu kỳ đầu tiên
- Trạng thái kỳ: Đang mở / Đã khóa
- Đồng tiền hạch toán: VND
- Năm tài chính

---

### B. Cài đặt Hóa đơn

**Hóa đơn điện tử:**
- Mẫu hóa đơn: 01GTKT, 02GTTT, 03XKNB
- Ký hiệu: AA/25T
- Số bắt đầu: 0000001
- Thuế suất mặc định: 0%/5%/8%/10%
- Loại: Có mã CQT / Không mã

**Nhà cung cấp HĐĐT:**
- Chọn NCC: VNPT/Viettel/FPT/MISA
- API Endpoint
- Username/Password/API Key
- Chữ ký số (.pfx + password)
- Test connection

**Thông tin trên hóa đơn:**
- Footer message
- Thông tin tài khoản NH
- QR code (VietQR)

---

### C. Cài đặt Kế toán

**Phương pháp tính giá:**
- Giá xuất kho: FIFO / Bình quân / Định mức
- Áp dụng: Tất cả / Từng sản phẩm

**Tài khoản mặc định:**
- TK Doanh thu: 511
- TK Giá vốn: 632
- TK Hàng hóa: 156
- TK Phải thu: 131
- TK Phải trả: 331
- TK Tiền mặt: 111
- TK Tiền gửi NH: 112
- TK VAT đầu vào: 1331
- TK VAT đầu ra: 3331

**Làm tròn:**
- Ngưỡng: 100đ / 1,000đ / 10,000đ
- Áp dụng: Tất cả / Chỉ báo cáo

**Khóa sổ:**
- Cho phép khóa sổ theo tháng
- Ngày khóa tự động: Ngày 5
- Người mở khóa: KT.Trưởng / Admin

---

### D. Cài đặt Kho

**Quản lý kho:**
- Cho phép xuất âm kho: Có / Không
- Tồn kho tối thiểu / tối đa
- Ngưỡng cảnh báo (%)

**Quản lý nâng cao:**
- Quản lý theo Lô: Có / Không
- Quản lý Serial: Có / Không
- Quản lý hạn sử dụng: Có / Không
- Cảnh báo hết hạn trước: X ngày

**Kiểm kê:**
- Định kỳ: Tháng / Quý / Năm
- Kiểm kê tuần hoàn

---

### E. Cài đặt Nhân sự - Lương

**Lương:**
- Chu kỳ: Tháng / Tuần / Ngày
- Ngày chốt: Ngày X
- Ngày trả: Ngày X
- Công thức tính lương

**Phụ cấp mặc định:**
- Ăn trưa: X đ/ngày
- Xăng xe: X đ/tháng
- Điện thoại: X đ/tháng
- Nhà ở: X đ/tháng

**BHXH - BHYT - BHTN:**
- BHXH: 8% (NLĐ), 17.5% (DN)
- BHYT: 1.5% (NLĐ), 3% (DN)
- BHTN: 1% (NLĐ), 1% (DN)
- Mức lương tối thiểu vùng

**Thuế TNCN:**
- Giảm trừ bản thân: 11,000,000đ
- Giảm trừ người phụ thuộc: 4,400,000đ
- Biểu thuế lũy tiến

---

### F. Cài đặt Giao diện

**Ngôn ngữ:**
- ✅ CHỈ Tiếng Việt (vi-VN)
- ⚠️ KHÔNG có tiếng Anh trong UI

**Theme:**
- Light Mode (mặc định)
- Dark Mode
- Tự động theo hệ thống
- Lưu theo: User + localStorage

**Tùy chỉnh:**
- Logo sidebar
- Tên hệ thống
- Màu chủ đạo
- Font chữ: Roboto / Inter / Be Vietnam Pro
- Kích thước font: S / M / L

**Hiển thị:**
- Số dòng/trang: 10/20/50/100
- Định dạng số: `1.000.000,00`
- Định dạng ngày: `DD/MM/YYYY`

---

### G. Người dùng & Phân quyền

**Vai trò:**
- Admin
- Kế toán trưởng
- Kế toán viên
- Thủ quỹ
- Thủ kho
- Nhân viên bán hàng
- Nhân viên mua hàng
- Nhân sự
- Người xem (Viewer)

**Phân quyền CRUD:**
| Module | Admin | KT.Trưởng | KT.Viên | Thủ quỹ | Thủ kho | Viewer |
|--------|-------|-----------|---------|---------|---------|--------|
| Khách hàng | CRUD | CRUD | CRU | R | R | R |
| Đơn hàng | CRUD | CRU | CR | R | R | R |
| Kho | CRUD | CRU | CR | R | CRUD | R |
| Kế toán | CRUD | CRUD | CRU | CR | R | R |
| Lương | CRUD | CRU | R | CR | R | R |
| Settings | CRUD | CR | R | R | R | R |

**Audit Trail:**
- Log mọi hành động: CRUD, Login, Export
- Thông tin: User, Tenant, IP, Timestamp, Action, Old/New Value
- Lưu trữ: Minimum 5 năm

---

## 5. MASTER DATA

### 1️⃣ Sản phẩm / Hàng hóa

**Bắt buộc:**
- Mã sản phẩm (unique)
- Tên sản phẩm
- Loại: Hàng hóa / Dịch vụ / NVL / Thành phẩm
- Đơn vị tính

**Tùy chọn:**
- Mã vạch (Barcode)
- Nhóm sản phẩm
- Xuất xứ, Quy cách
- Trọng lượng, Kích thước
- Giá bán, Giá vốn
- Thuế GTGT: 0%/5%/8%/10%
- TK Doanh thu/Giá vốn/Kho
- Quản lý kho/lô/serial
- Tồn kho tối thiểu/tối đa
- Hình ảnh, Mô tả
- Trạng thái, Ghi chú

**Import Excel:**
- Upload .xlsx
- Validate: Mã không trùng, Tên không trống
- Update theo Mã (upsert)
- Trả file lỗi
- Download template

---

### 2️⃣ Khách hàng

**Bắt buộc:**
- Mã khách hàng (unique)
- Tên khách hàng
- Loại: Cá nhân / Doanh nghiệp

**Tùy chọn:**
- MST (bắt buộc nếu DN)
- Địa chỉ, Email, SĐT
- Người liên hệ
- TK công nợ: 131
- Hạn mức công nợ
- Thời hạn thanh toán
- Điều khoản thanh toán
- Chiết khấu mặc định
- Nhóm KH, Nguồn KH
- Nhân viên phụ trách
- Trạng thái, Ghi chú

**Import Excel:** tương tự Sản phẩm

---

### 3️⃣ Nhà cung cấp

**Bắt buộc:**
- Mã NCC (unique)
- Tên NCC
- Loại: Cá nhân / Doanh nghiệp

**Tùy chọn:**
- MST (bắt buộc nếu DN)
- Địa chỉ, Email, SĐT
- Số TK, Ngân hàng
- TK công nợ: 331
- Thời hạn thanh toán
- Nhóm NCC
- Nhân viên phụ trách
- Trạng thái, Ghi chú

**Import Excel:** tương tự

---

### 4️⃣ Danh mục khác

- **Đơn vị tính:** Cái, Kg, Lít, m, m²...
- **Nhóm sản phẩm:** Phân cấp cha → con
- **Kho:** Mã, Tên, Địa chỉ, Thủ kho
- **Phòng ban:** Mã, Tên, Trưởng phòng
- **Chức vụ:** Giám đốc, Trưởng phòng...
- **Loại tài sản:** Nhà, Xe, Máy móc...
- **Khoản mục chi phí:** Điện, Nước, VPP...

---

## 6. MULTI-TENANCY (SAAS)

### Kiến trúc

**Phương pháp:** Shared Database + Tenant Isolation

**Nguyên tắc:**
- ✅ Mỗi bảng nghiệp vụ có `tenant_id` (UUID)
- ✅ Index trên `(tenant_id, id)`
- ✅ Row Level Security (PostgreSQL)
- ✅ JWT payload chứa `tenant_id`
- ✅ Middleware kiểm tra `tenant_id`
- ✅ KHÔNG query chéo tenant
- ✅ Backup riêng theo tenant

**Bảng không có tenant_id:**
- `tenants`
- `users`
- `user_tenants` (mapping user → tenant)
- `system_settings`

### Schema Example

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  tax_code VARCHAR(20) UNIQUE,
  subdomain VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  subscription_plan VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_tenants (
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  role VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tax_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id, created_at);

-- Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### JWT Payload

```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "role": "accountant",
  "permissions": ["customer:read", "customer:create"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Middleware

```typescript
async function tenantMiddleware(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];
  const payload = verifyJWT(token);
  
  req.tenantId = payload.tenant_id;
  req.userId = payload.user_id;
  req.role = payload.role;
  
  // Set PostgreSQL session variable
  await db.query(`SET app.tenant_id = '${payload.tenant_id}'`);
  
  next();
}
```

---

## 7. MOBILE APP (REACT NATIVE)

### Phạm vi chức năng

**⚠️ Mobile chỉ XEM & THAO TÁC NHẸ, không nhập liệu phức tạp**

**Hỗ trợ:**
1. **Dashboard** – Doanh thu, Chi phí, Lợi nhuận, Tồn quỹ
2. **Công nợ** – Danh sách KH có nợ, Chi tiết, Gọi điện/SMS
3. **Dòng tiền** – Lịch sử, Dự đoán AI, Cảnh báo
4. **Hóa đơn** – Danh sách, Xem PDF, Gửi email
5. **Tồn kho** – Danh sách hàng, Quét barcode, Cảnh báo
6. **Thông báo** – Push notifications
7. **Cài đặt** – Profile, Đổi mật khẩu, Light/Dark mode

**KHÔNG hỗ trợ:**
- ❌ Nhập đơn hàng phức tạp
- ❌ Nhập phiếu kho
- ❌ Ghi sổ kế toán
- ❌ Chấm công, tính lương
- ❌ Settings hệ thống

**Tech Stack:**
- React Native (Expo/Bare)
- React Navigation
- Redux/Zustand
- Axios
- AsyncStorage
- React Native Paper/Native Base
- React Native Chart Kit

---

## 8. YÊU CẦU KỸ THUẬT

### Backend

**Framework:** NestJS (khuyến nghị) hoặc FastAPI

**Structure:**
```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── filters/
│   ├── config/
│   ├── modules/
│   │   ├── auth/
│   │   ├── tenants/
│   │   ├── users/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── products/
│   │   ├── sales/
│   │   ├── purchases/
│   │   ├── inventory/
│   │   ├── invoices/
│   │   ├── accounting/
│   │   ├── payroll/
│   │   ├── banking/
│   │   └── ai-analytics/
│   └── database/
│       ├── migrations/
│       └── seeds/
```

**Patterns bắt buộc:**
- ✅ Repository Pattern
- ✅ Adapter Pattern (Hóa đơn, Ngân hàng)
- ✅ Strategy Pattern (Tính giá kho)
- ✅ Factory Pattern (Tạo chứng từ)
- ✅ Observer Pattern (Event-driven)

**API Standards:**
- REST API
- OpenAPI (Swagger) docs
- Versioning: `/api/v1/...`
- Response format:
```json
{
  "success": true,
  "data": {...},
  "message": "Success",
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Authentication:**
- JWT (Access + Refresh Token)
- Access Token: 15 phút
- Refresh Token: 7 ngày
- RBAC

**Validation:**
- Class-validator (NestJS)
- Pydantic (FastAPI)
- Custom validators (MST, email VN)

---

### Database

**RDBMS:** PostgreSQL 15+

**Lý do:**
- ✅ JSONB support
- ✅ Row Level Security
- ✅ Full-text search (tiếng Việt)
- ✅ Partition tables
- ✅ Mature ecosystem

**Design Principles:**
- ✅ Chuẩn hóa 3NF
- ✅ Soft delete (deleted_at)
- ✅ Audit columns: created_at, updated_at, created_by, updated_by
- ✅ UUID primary keys
- ✅ Foreign keys + ON DELETE CASCADE/RESTRICT
- ✅ Check constraints
- ✅ Indexes hợp lý

**Migration:**
- TypeORM / Prisma / Alembic
- Mỗi migration có up & down
- Test trên staging trước
- Version control trong Git

**Settings Storage:**
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  category VARCHAR(50), -- company/invoice/accounting
  key VARCHAR(100),
  value JSONB,
  description TEXT,
  created_at TIMESTAMP,
  UNIQUE (tenant_id, category, key)
);
```

**Backup:**
- Daily automated
- Point-in-time recovery (PITR)
- Test restore monthly
- Retention: 30 ngày

---

### Frontend

**Framework:** React 18+ hoặc Next.js 14+

**UI Library:**
- Ant Design (khuyến nghị) – component phong phú
- MUI – hiện đại
- Tailwind CSS – flexible

**State Management:**
- Redux Toolkit (app phức tạp)
- Zustand (nhẹ)
- React Query (server state)

**Form:**
- React Hook Form + Yup/Zod

**Charts:**
- Recharts / Chart.js / ApexCharts

**Excel:**
- SheetJS (xlsx)

**PDF:**
- @react-pdf/renderer

**i18n:**
- ⚠️ Chỉ Tiếng Việt
- Có thể dùng i18n nếu mở rộng sau

**Theme:**
```typescript
const theme = {
  mode: 'light', // 'light' | 'dark'
  primaryColor: '#1890ff',
  fontFamily: 'Be Vietnam Pro, sans-serif',
  fontSize: {
    small: '12px',
    medium: '14px',
    large: '16px'
  }
};

localStorage.setItem(`theme_${userId}`, JSON.stringify(theme));
```

**Responsive:**
- Desktop-first (≥ 1280px)
- Tablet (768-1279px)
- Mobile (< 768px) – giới hạn

---

## 9. OUTPUT BẮT BUỘC

**Thứ tự thực hiện:**

### 1️⃣ Kiến trúc tổng thể
- System Architecture (3-tier)
- Component Diagram
- Deployment Diagram
- Tech Stack summary

### 2️⃣ Database Schema
- Tất cả bảng + relationships (SQL DDL)
- Indexes
- Constraints
- Sample data (INSERT statements)

### 3️⃣ API Design
- Endpoints list (OpenAPI/Swagger)
- Request/Response examples
- Authentication flow
- Error codes

### 4️⃣ Backend Code
- NestJS hoặc FastAPI
- Modules đầy đủ
- **CHẠY ĐƯỢC 100%**
- Unit tests (≥ 70% coverage)

### 5️⃣ Frontend Scaffold
- Login page
- Dashboard
- 1-2 module mẫu (Khách hàng, Đơn hàng)
- Settings UI
- Light/Dark mode demo

### 6️⃣ Mobile App Scaffold
- React Native
- Login
- Dashboard
- 1-2 màn hình mẫu

### 7️⃣ Flow nghiệp vụ
- Flowchart: Bán hàng → Hóa đơn → Ghi sổ
- Flowchart: Mua hàng → Hóa đơn → Ghi sổ
- Flowchart: Xuất kho → Tính giá vốn

### 8️⃣ Data mock + seed
- 10 khách hàng
- 10 nhà cung cấp
- 20 sản phẩm
- 5 đơn hàng mẫu

### 9️⃣ Hướng dẫn chạy local
- README.md
- Prerequisites
- Installation steps
- Environment variables
- Run commands
- Test commands

---

## 10. RÀNG BUỘC CỰC KỲ QUAN TRỌNG

### ❌ KHÔNG ĐƯỢC:

1. ❌ Viết pseudo code – phải **CHẠY ĐƯỢC 100%**
2. ❌ Bỏ qua Settings – core requirement
3. ❌ Bỏ qua Import Excel – business cần
4. ❌ Bỏ qua Multi-tenancy – SaaS bắt buộc
5. ❌ Dùng tiếng Anh trong UI – **100% tiếng Việt**
6. ❌ AI tự động ghi sổ – chỉ phân tích & gợi ý
7. ❌ Hard-code logic – dùng Settings
8. ❌ Bỏ qua validation
9. ❌ Bỏ qua error handling
10. ❌ Bỏ qua logging

### ✅ BẮT BUỘC PHẢI CÓ:

1. ✅ Code chạy được: `npm install && npm start`
2. ✅ Database migration scripts
3. ✅ .env.example
4. ✅ README.md chi tiết
5. ✅ API documentation (Swagger)
6. ✅ Settings UI đầy đủ
7. ✅ Import Excel template + validate
8. ✅ Multi-tenancy middleware
9. ✅ JWT authentication
10. ✅ RBAC
11. ✅ Audit trail
12. ✅ Light/Dark mode
13. ✅ Responsive design
14. ✅ Error messages tiếng Việt
15. ✅ Loading states
16. ✅ Empty states
17. ✅ Form validation
18. ✅ Confirm dialogs
19. ✅ Toast notifications
20. ✅ Breadcrumbs

---

## 11. HƯỚNG DẪN TRIỂN KHAI

### Quy trình làm việc

**Bước 1: Phân tích & Thiết kế**
- Đọc kỹ requirements
- Thiết kế Database Schema
- Thiết kế API endpoints

**Bước 2: Implement theo priority**

**Priority 1 - Foundation (Tuần 1-2):**
1. Database Schema + Migrations
2. Authentication & Authorization
3. Multi-tenancy middleware
4. Settings module
5. User management + Roles

**Priority 2 - Master Data (Tuần 3-4):**
6. Khách hàng (CRUD + Import)
7. Nhà cung cấp (CRUD + Import)
8. Sản phẩm (CRUD + Import)
9. Kho, Phòng ban, Chức vụ

**Priority 3 - Business (Tuần 5-8):**
10. Bán hàng
11. Mua hàng
12. Kho (Nhập/Xuất/Kiểm kê)
13. Kế toán (Định khoản, Sổ sách)

**Priority 4 - Advanced (Tuần 9-12):**
14. Hóa đơn điện tử
15. Nhân sự - Lương
16. Banking
17. AI Analytics

**Priority 5 - Polish (Tuần 13-14):**
18. Mobile App
19. Testing
20. Documentation
21. Deployment

### Mỗi lần output:

- Chỉ làm **1-2 modules** để tránh quá dài
- Code phải **chạy được 100%**
- Có comment giải thích ngắn gọn
- Có ví dụ cách sử dụng

---

## 12. CHECKLIST HOÀN THÀNH

### Backend:
- [ ] Tất cả API endpoints
- [ ] JWT authentication
- [ ] Multi-tenancy middleware
- [ ] RBAC
- [ ] Validation đầy đủ
- [ ] Error handling
- [ ] Logging
- [ ] Unit tests ≥ 70%
- [ ] API docs (Swagger)
- [ ] Migrations chạy được
- [ ] Seed data chạy được

### Database:
- [ ] Schema hoàn chỉnh
- [ ] Foreign keys
- [ ] Indexes
- [ ] Constraints
- [ ] Migration up/down
- [ ] Seed data có ý nghĩa

### Frontend:
- [ ] Login/Logout
- [ ] Routing
- [ ] CRUD operations
- [ ] Form validation
- [ ] Light/Dark mode
- [ ] Import Excel
- [ ] Export Excel
- [ ] Settings UI
- [ ] Responsive
- [ ] 100% tiếng Việt
- [ ] Loading states
- [ ] Error messages
- [ ] Empty states
- [ ] Toast notifications

### Mobile:
- [ ] Login
- [ ] Dashboard
- [ ] API integration
- [ ] Dark mode
- [ ] Push notifications

### Documentation:
- [ ] README.md
- [ ] .env.example
- [ ] API docs
- [ ] Architecture diagram
- [ ] DB schema diagram
- [ ] User guide

### Deployment:
- [ ] Dockerfile Backend
- [ ] Dockerfile Frontend
- [ ] docker-compose.yml
- [ ] CI/CD pipeline
- [ ] Environment variables

---

## 13. BẢO MẬT (SECURITY)

### Authentication:
- ✅ bcrypt (cost ≥ 12)
- ✅ JWT secret mạnh
- ✅ Refresh token rotation
- ✅ Rate limiting: 5 attempts / 15 phút
- ✅ Account lockout
- ✅ Password: min 8 ký tự, có hoa/thường/số/đặc biệt
- ✅ 2FA (optional)

### Authorization:
- ✅ RBAC strict
- ✅ Validate tenant_id

### Data Protection:
- ✅ HTTPS only (TLS 1.2+)
- ✅ Encrypt sensitive data
- ✅ PII anonymization
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ CORS config

### Audit:
- ✅ Log mọi hành động quan trọng
- ✅ Monitor failed logins
- ✅ Alert bất thường
- ✅ Security audits

---

## 14. PERFORMANCE

### Database:
- ✅ Indexes trên FK
- ✅ Indexes cho search
- ✅ Connection pooling
- ✅ Query optimization
- ✅ Pagination
- ✅ Soft delete

### Backend:
- ✅ Caching (Redis): Settings, Master data, Sessions
- ✅ Rate limiting
- ✅ Compression (gzip)
- ✅ Lazy loading
- ✅ Background jobs (Bull/BullMQ): Email, Reports, Import, AI

### Frontend:
- ✅ Code splitting
- ✅ Lazy components
- ✅ Image optimization
- ✅ Debounce search
- ✅ Virtual scrolling
- ✅ Service Worker (PWA)
- ✅ Local caching

### Monitoring:
- ✅ APM: New Relic / DataDog
- ✅ Metrics: Response time, Error rate
- ✅ Alerts

---

## 15. LOCALIZATION & COMPLIANCE

### Tiếng Việt:
- ✅ 100% text tiếng Việt
- ✅ Thuật ngữ kế toán chuẩn
- ✅ Format số: `1.000.000,00`
- ✅ Format ngày: `DD/MM/YYYY`
- ✅ Đơn vị: `đ` hoặc `VND`

### Tuân thủ:
- ✅ Luật Kế toán 88/2015/QH13
- ✅ TT133/2016, TT200/2014
- ✅ NĐ123/2020 (HĐĐT)
- ✅ Bộ luật Lao động 2019
- ✅ Luật Thuế GTGT, TNDN, TNCN

### Retention:
- ✅ Dữ liệu kế toán: 10 năm
- ✅ Hóa đơn: 10 năm
- ✅ Chứng từ: 10 năm
- ✅ Sổ sách: Vĩnh viễn
- ✅ BCTC: Vĩnh viễn

---

## 16. TESTING

### Unit Tests:
- ✅ Coverage ≥ 70%
- ✅ Test business logic
- ✅ Test edge cases
- ✅ Mock dependencies

### Integration Tests:
- ✅ API endpoints
- ✅ Database operations
- ✅ Auth flow
- ✅ Multi-tenancy isolation

### E2E Tests:
- ✅ Critical flows: Login, Tạo đơn, Xuất hóa đơn
- ✅ Tools: Cypress / Playwright

### Performance Tests:
- ✅ Load: 1000 concurrent users
- ✅ Response: P95 < 200ms

### Security Tests:
- ✅ OWASP Top 10
- ✅ Penetration testing
- ✅ Dependency scanning

---

## 17. DEPLOYMENT

### Infrastructure:

**Development:**
- Docker Compose
- Local PostgreSQL

**Staging/Production:**
- AWS / Google Cloud / Azure
- Managed PostgreSQL
- Redis
- Load Balancer
- Kubernetes (optional)
- CDN
- WAF

### CI/CD:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup Node
      - Install deps
      - Run tests
      - Run linter
  
  build:
    needs: test
    steps:
      - Build Docker images
      - Push to registry
  
  deploy:
    needs: build
    steps:
      - Deploy to K8s
      - Run migrations
      - Health check
```

### Monitoring:
- ✅ APM: New Relic / DataDog
- ✅ Logs: ELK / CloudWatch
- ✅ Metrics: Prometheus + Grafana
- ✅ Alerting: PagerDuty
- ✅ Uptime: Pingdom

---

## 18. CODING BEST PRACTICES

### Clean Code:
- ✅ Tên biến/hàm rõ ràng
- ✅ Hàm nhỏ, 1 việc
- ✅ Tránh magic numbers
- ✅ Comment khi cần (WHY)
- ✅ DRY, KISS

### SOLID:
- ✅ Single Responsibility
- ✅ Open/Closed
- ✅ Liskov Substitution
- ✅ Interface Segregation
- ✅ Dependency Inversion

### Git Workflow:
```
main (production)
  ↑
staging
  ↑
develop
  ↑
feature/ABC-123-ten-tinh-nang
```

**Commit format:**
```
type(scope): subject

[body]

[footer]

# Example:
feat(invoice): add e-invoice generation

- Implement XML per ND123
- Add signature verification
- Integrate VNPT adapter

Closes #123
```

---

## 19. PHỤ LỤC

### A. API Endpoints (Overview)

```
Authentication:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

Tenants:
GET    /api/v1/tenants
POST   /api/v1/tenants
GET    /api/v1/tenants/:id
PUT    /api/v1/tenants/:id

Settings:
GET    /api/v1/settings
GET    /api/v1/settings/:category
PUT    /api/v1/settings/:category/:key

Customers:
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PUT    /api/v1/customers/:id
DELETE /api/v1/customers/:id
POST   /api/v1/customers/import
GET    /api/v1/customers/export
GET    /api/v1/customers/template

Sales Orders:
GET    /api/v1/sales-orders
POST   /api/v1/sales-orders
GET    /api/v1/sales-orders/:id
PUT    /api/v1/sales-orders/:id
POST   /api/v1/sales-orders/:id/confirm

Invoices:
GET    /api/v1/invoices
POST   /api/v1/invoices
POST   /api/v1/invoices/:id/sign
POST   /api/v1/invoices/:id/send
GET    /api/v1/invoices/:id/pdf
GET    /api/v1/invoices/:id/xml

Accounting:
GET    /api/v1/journal-entries
POST   /api/v1/journal-entries
GET    /api/v1/ledger
GET    /api/v1/income-statement
GET    /api/v1/balance-sheet

Banking:
GET    /api/v1/banks
POST   /api/v1/banks/connect
GET    /api/v1/banks/:id/transactions

AI:
GET    /api/v1/ai/cash-flow-forecast?days=30
GET    /api/v1/ai/customer-insights
POST   /api/v1/ai/chat

... (60+ endpoints)
```

### B. Database Tables (Overview)

**Core:** tenants, users, user_tenants, roles, permissions, settings, audit_logs

**Master:** customers, suppliers, products, warehouses, departments

**Sales:** quotations, sales_orders, delivery_notes

**Purchases:** purchase_requests, purchase_orders, goods_receipts

**Inventory:** stock_transactions, stock_balances, batches

**Invoices:** invoices, invoice_items, invoice_signatures

**Accounting:** chart_of_accounts, journal_entries, fiscal_periods

**Payroll:** employees, attendances, payrolls

**Banking:** bank_connections, bank_transactions

**AI:** cash_flow_forecasts, customer_insights

*Total: 60-80 tables*

### C. Business Flow Example

**Bán hàng → Hóa đơn → Ghi sổ:**

```
1. Tạo Báo giá → Status: Draft
2. Tạo Đơn hàng → Status: Confirmed, Check tồn kho
3. Xuất kho → Cập nhật Stock Balance (FIFO)
4. Tạo Hóa đơn điện tử → Generate XML → Ký → Gửi CQT
5. Ghi sổ tự động:
   Nợ 131: 110M
       Có 511: 100M
       Có 3331: 10M
   Nợ 632: 70M
       Có 156: 70M
6. Khách thanh toán → Phiếu thu → Đối soát NH
7. Báo cáo → Cập nhật real-time
```

---

## 🎉 KẾT LUẬN

**Đây là PROMPT FINAL V3 - hoàn chỉnh nhất cho:**

✅ Kế toán doanh nghiệp VN (đầy đủ nghiệp vụ)  
✅ SaaS Multi-tenant (scale được)  
✅ Web + Mobile (UX tốt)  
✅ Banking Integration (Open Banking)  
✅ AI Analytics (dự đoán & phân tích)  
✅ 100% Tuân thủ pháp lý VN  

**Yêu cầu:**
✅ Code chạy được 100%  
✅ Production-ready  
✅ Secure, scalable, maintainable  
✅ Well-documented  
✅ Tested  

---

## 🚀 BẮT ĐẦU

**Agent Claude, hãy bắt đầu implement theo prompt này!**

**Câu hỏi:**

1. **Bắt đầu từ module nào?**
   - [ ] Kiến trúc + Database Schema
   - [ ] Authentication + Multi-tenancy
   - [ ] Settings module
   - [ ] Master Data (KH, NCC, SP)
   - [ ] Business modules (Sales, Purchases)

2. **Tech stack:**
   - [ ] NestJS + PostgreSQL + React + Ant Design
   - [ ] FastAPI + PostgreSQL + Next.js + MUI

3. **Output format:**
   - [ ] Từng module chi tiết
   - [ ] Tổng quan toàn bộ

**Sẵn sàng triển khai! 🚀**

---

*End of Document*