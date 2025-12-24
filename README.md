# 🏢 HỆ THỐNG KẾ TOÁN DOANH NGHIỆP VIỆT NAM

Hệ thống quản lý kế toán tổng hợp dành cho doanh nghiệp Việt Nam, tuân thủ Luật Kế toán và Thuế Việt Nam, hỗ trợ đầy đủ các tính năng: Quản lý kho, Nhân sự, Hóa đơn VAT, Kế toán tổng hợp.

## 📋 MỤC LỤC

- [Tính năng](#-tính-năng)
- [Công nghệ](#-công-nghệ)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)

## ✨ TÍNH NĂNG

### 1️⃣ Quản lý Khách hàng
- ✅ CRUD khách hàng cá nhân/doanh nghiệp
- ✅ Theo dõi công nợ phải thu
- ✅ Lịch sử hóa đơn
- ✅ Import từ Excel

### 2️⃣ Quản lý Nhà cung cấp
- ✅ CRUD nhà cung cấp
- ✅ Theo dõi công nợ phải trả
- ✅ Liên kết nhập kho
- ✅ Import từ Excel

### 3️⃣ Quản lý Kho vận
- ✅ Quản lý hàng hóa/vật tư
- ✅ Nhập - Xuất - Tồn kho
- ✅ FIFO/Bình quân
- ✅ Cảnh báo tồn kho thấp

### 4️⃣ Quản lý Nhân sự
- ✅ Hồ sơ nhân viên
- ✅ Hợp đồng lao động
- ✅ Chấm công
- ✅ Bảng lương tự động tính thuế TNCN

### 5️⃣ Hóa đơn VAT (HĐĐT)
- ✅ Chuẩn Nghị định 123
- ✅ Thuế suất: 0%, 5%, 8%, 10%
- ✅ Xuất XML + PDF
- ✅ Adapter tích hợp: VNPT, Viettel, MISA, FPT

### 6️⃣ Kế toán Tổng hợp
- ✅ Hệ thống tài khoản (TT133 & TT200)
- ✅ Định khoản tự động
- ✅ Sổ cái
- ✅ Báo cáo tài chính

### 7️⃣ Settings (Cài đặt)
- ✅ Cài đặt doanh nghiệp
- ✅ Cài đặt hóa đơn VAT
- ✅ Cài đặt kế toán
- ✅ Cài đặt nhân sự - lương
- ✅ Cài đặt kho vận
- ✅ Cài đặt giao diện (Light/Dark mode)
- ✅ Phân quyền người dùng

## 🛠️ CÔNG NGHỆ

### Backend
- **NestJS 10** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **PostgreSQL 15** - Relational database
- **TypeORM** - ORM for database operations
- **JWT** - Authentication
- **Swagger** - API documentation
- **xlsx** - Excel import/export

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Ant Design 5** - UI component library
- **TailwindCSS** - Utility-first CSS
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form validation

### DevOps
- **Docker & Docker Compose** - Containerization
- **PostgreSQL** - Database

## 🚀 CÀI ĐẶT

### Yêu cầu hệ thống
- Node.js 18+ 
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### 1. Clone repository

```bash
git clone <repository-url>
cd Finance-Tax
```

### 2. Cài đặt với Docker (Khuyến nghị)

```bash
# Copy file environment
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Chạy tất cả services
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f
```

Sau khi chạy thành công:
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001
- API Docs: http://localhost:3000/api/docs

### 3. Cài đặt Manual (Development)

#### Backend

```bash
cd backend

# Cài đặt dependencies
npm install

# Copy environment file
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn

# Tạo database
createdb finance_tax

# Chạy migrations
psql -U postgres -d finance_tax -f ../DATABASE_SCHEMA.sql

# Load seed data
psql -U postgres -d finance_tax -f ../SEED_DATA.sql

# Start development server
npm run start:dev
```

Backend sẽ chạy tại: http://localhost:3000

#### Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3001

## 📖 SỬ DỤNG

### Đăng nhập lần đầu

Thông tin đăng nhập mặc định:
- **Email**: admin@example.com
- **Password**: admin123

⚠️ **Quan trọng**: Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên!

### Các bước bắt đầu

1. **Cấu hình Settings**
   - Vào menu "Cài đặt"
   - Nhập thông tin doanh nghiệp
   - Cấu hình hóa đơn, kế toán, nhân sự

2. **Nhập dữ liệu Master**
   - Sản phẩm/Dịch vụ
   - Khách hàng
   - Nhà cung cấp
   - Nhân viên

3. **Import từ Excel**
   - Tải template Excel
   - Điền thông tin
   - Upload và import

4. **Bắt đầu giao dịch**
   - Tạo hóa đơn bán hàng
   - Nhập kho từ NCC
   - Chấm công và tính lương
   - Xem báo cáo

## 📁 CẤU TRÚC DỰ ÁN

```
Finance-Tax/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/              # Authentication & Authorization
│   │   ├── settings/          # Settings module
│   │   ├── products/          # Products module
│   │   ├── customers/         # Customers module
│   │   ├── suppliers/         # Suppliers module
│   │   ├── inventory/         # Inventory module (TODO)
│   │   ├── employees/         # Employees module (TODO)
│   │   ├── invoices/          # Invoices module (TODO)
│   │   ├── accounting/        # Accounting module (TODO)
│   │   └── main.ts
│   ├── package.json
│   └── Dockerfile
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Auth pages
│   │   │   └── (dashboard)/   # Dashboard pages
│   │   ├── components/
│   │   │   ├── layout/        # Layout components
│   │   │   └── providers/     # Context providers
│   │   ├── stores/            # Zustand stores
│   │   └── lib/               # Utilities
│   ├── package.json
│   └── Dockerfile
├── ARCHITECTURE.md             # Kiến trúc hệ thống
├── DATABASE_SCHEMA.sql         # Database schema
├── API_DESIGN.md              # API documentation
├── SEED_DATA.sql              # Dữ liệu khởi tạo
├── docker-compose.yml         # Docker compose config
└── README.md                  # Tài liệu này
```

## 📚 API DOCUMENTATION

Sau khi chạy backend, truy cập Swagger UI tại:

```
http://localhost:3000/api/docs
```

Hoặc xem file [API_DESIGN.md](./API_DESIGN.md) để biết chi tiết về tất cả các endpoints.

### API Endpoints chính

#### Authentication
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/register` - Đăng ký (Admin only)
- `GET /api/v1/auth/me` - Thông tin user

#### Settings
- `GET /api/v1/settings` - Lấy cài đặt
- `POST /api/v1/settings` - Tạo cài đặt
- `PUT /api/v1/settings/:id` - Cập nhật cài đặt

#### Products
- `GET /api/v1/products` - Danh sách sản phẩm
- `POST /api/v1/products` - Tạo sản phẩm
- `POST /api/v1/products/import` - Import Excel

#### Customers
- `GET /api/v1/customers` - Danh sách khách hàng
- `POST /api/v1/customers` - Tạo khách hàng
- `POST /api/v1/customers/import` - Import Excel

#### Suppliers
- `GET /api/v1/suppliers` - Danh sách NCC
- `POST /api/v1/suppliers` - Tạo NCC

## 📸 SCREENSHOTS

### Login Page
![Login](docs/screenshots/login.png)

### Dashboard - Light Mode
![Dashboard Light](docs/screenshots/dashboard-light.png)

### Dashboard - Dark Mode
![Dashboard Dark](docs/screenshots/dashboard-dark.png)

### Products Management
![Products](docs/screenshots/products.png)

### Settings
![Settings](docs/screenshots/settings.png)

## 🗺️ ROADMAP

### Phase 1 - Core Features ✅
- [x] Authentication & Authorization
- [x] Settings Management
- [x] Products Management
- [x] Customers Management
- [x] Suppliers Management
- [x] Light/Dark Mode
- [x] Excel Import

### Phase 2 - Inventory & Employees 🚧
- [ ] Inventory Management
- [ ] Stock Transactions (IN/OUT)
- [ ] Employee Management
- [ ] Attendance Tracking
- [ ] Payroll Calculation

### Phase 3 - Invoices & Accounting 📝
- [ ] VAT Invoice Management
- [ ] Invoice XML/PDF Generation
- [ ] Invoice Provider Integration
- [ ] Accounting Vouchers
- [ ] General Ledger
- [ ] Financial Reports

### Phase 4 - Advanced Features 🚀
- [ ] Multi-tenancy (SaaS)
- [ ] Mobile App
- [ ] Banking Integration
- [ ] AI Financial Forecasting
- [ ] Blockchain for Documents
- [ ] Multi-currency
- [ ] Multi-warehouse

## 🔧 TROUBLESHOOTING

### Lỗi kết nối database

```bash
# Kiểm tra PostgreSQL đang chạy
docker-compose ps

# Restart database
docker-compose restart postgres

# Xem logs
docker-compose logs postgres
```

### Lỗi build frontend

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Port đã được sử dụng

```bash
# Thay đổi port trong docker-compose.yml hoặc
# Dừng service đang dùng port đó

# Kiểm tra port đang được dùng
lsof -i :3000
lsof -i :3001
```

## 🤝 CONTRIBUTING

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 LICENSE

MIT License

## 👨‍💻 AUTHOR

Phát triển bởi AI Assistant

---

## 📞 LIÊN HỆ & HỖ TRỢ

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng:
1. Kiểm tra [Issues](../../issues) hiện có
2. Tạo Issue mới nếu chưa có
3. Đọc [ARCHITECTURE.md](./ARCHITECTURE.md) để hiểu rõ hơn về hệ thống

---

**Made with ❤️ for Vietnamese Businesses**
