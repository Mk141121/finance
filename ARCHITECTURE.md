# KIẾN TRÚC HỆ THỐNG KẾ TOÁN DOANH NGHIỆP

## 1. TỔNG QUAN KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────────┐
│                      NGƯỜI DÙNG                              │
│              (Admin, Kế toán, Kho, Nhân sự)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 14)                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │Dashboard │Khách hàng│   Kho    │  Lương   │  HĐĐT    │  │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤  │
│  │ Settings │    NCC   │  Sản phẩm│Kế toán TH│  Reports │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│  📦 UI: Ant Design + TailwindCSS                            │
│  🌓 Theme: Light/Dark Mode (Zustand + localStorage)         │
│  🌍 i18n: 100% Tiếng Việt                                   │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JWT)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (NestJS)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AUTHENTICATION & RBAC                    │  │
│  │         JWT + Role-based Access Control               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────┬──────────────┬─────────────┬──────────┐   │
│  │  Settings  │   Products   │  Customers  │ Suppliers│   │
│  │   Module   │    Module    │   Module    │  Module  │   │
│  ├────────────┼──────────────┼─────────────┼──────────┤   │
│  │ Inventory  │   Invoice    │  Accounting │  Payroll │   │
│  │   Module   │    Module    │   Module    │  Module  │   │
│  └────────────┴──────────────┴─────────────┴──────────┘   │
│                                                              │
│  📦 Framework: NestJS                                        │
│  🔐 Auth: Passport JWT                                       │
│  ✅ Validation: class-validator                              │
│  📤 Excel: xlsx                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ TypeORM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL 15+)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Users | Roles | Permissions | AuditLogs             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Settings (JSONB)                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Products | Categories | Units                        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Customers | Suppliers | Accounts Payable/Receivable  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Inventory | Warehouses | Stock Transactions          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Employees | Attendance | Payroll | Contracts         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Invoices | Invoice Items | VAT                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Accounting Entries | Chart of Accounts | Ledgers     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2. CÔNG NGHỆ SỬ DỤNG

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Ant Design 5.x
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Form**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Language**: TypeScript

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **ORM**: TypeORM
- **Authentication**: Passport JWT
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Excel**: xlsx

### Database
- **Database**: PostgreSQL 15+
- **Migration**: TypeORM migrations
- **Indexing**: Composite indexes cho performance

### DevOps
- **Container**: Docker + Docker Compose
- **Environment**: .env files
- **Version Control**: Git

## 3. CẤU TRÚC THỨ MỤC

```
finance-tax/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   └── jwt.config.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── filters/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── strategies/
│   │   ├── settings/
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   ├── settings.module.ts
│   │   │   └── entities/
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.module.ts
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── inventory/
│   │   ├── employees/
│   │   ├── invoices/
│   │   ├── accounting/
│   │   └── database/
│   │       └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx
│   │   │       ├── dashboard/
│   │   │       ├── settings/
│   │   │       ├── products/
│   │   │       ├── customers/
│   │   │       ├── suppliers/
│   │   │       ├── inventory/
│   │   │       ├── employees/
│   │   │       ├── invoices/
│   │   │       └── accounting/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   └── forms/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── axios.ts
│   │   │   └── utils.ts
│   │   ├── stores/
│   │   │   ├── auth.store.ts
│   │   │   └── theme.store.ts
│   │   ├── types/
│   │   └── constants/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
├── docker-compose.yml
└── README.md
```

## 4. LUỒNG HOẠT ĐỘNG CHÍNH

### 4.1 Authentication Flow
```
1. User → Login (email/password)
2. Backend validate → Generate JWT token
3. Frontend store token → localStorage
4. Mọi request → Header: Authorization: Bearer <token>
5. Backend verify token → RBAC check → Response
```

### 4.2 Settings Flow
```
1. Admin → Settings page
2. Chọn loại cài đặt (Doanh nghiệp, Hóa đơn, Kế toán...)
3. Submit form → API POST/PUT /api/settings
4. Backend validate → Save to settings table (JSONB)
5. Frontend update UI
```

### 4.3 Import Excel Flow
```
1. User upload file .xlsx
2. Frontend → API POST /api/{module}/import
3. Backend:
   - Parse Excel (xlsx)
   - Validate từng row
   - Check mã trùng → Update hoặc Insert
   - Collect errors
4. Return success count + error file (nếu có)
```

### 4.4 Accounting Entry Flow (Định khoản tự động)
```
1. User tạo transaction (bán hàng, mua hàng, lương...)
2. Backend trigger accounting service
3. Load settings → chart of accounts
4. Apply rule:
   - Bán hàng: Nợ 131/112, Có 511, Nợ 632, Có 156
   - Mua hàng: Nợ 152/156, Có 331
   - Lương: Nợ 622/642, Có 334
5. Create accounting entries
6. Post to ledger
```

## 5. BẢO MẬT & PHÂN QUYỀN

### 5.1 Roles
- **Admin**: Full access
- **Kế toán**: Quản lý kế toán, hóa đơn, báo cáo
- **Kho**: Quản lý kho, nhập xuất
- **Nhân sự**: Quản lý nhân sự, lương
- **Quản lý**: Chỉ xem báo cáo

### 5.2 RBAC Implementation
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'accountant')
@Controller('accounting')
```

### 5.3 Audit Log
Mọi thao tác quan trọng được log:
- User ID
- Action (create, update, delete)
- Module
- Entity ID
- Changes (old → new)
- Timestamp
- IP Address

## 6. PERFORMANCE OPTIMIZATION

### 6.1 Database
- Index cho các trường tìm kiếm thường xuyên (mã, tên, MST)
- Composite index cho queries phức tạp
- Partitioning cho bảng lớn (transactions, logs)

### 6.2 API
- Pagination mặc định (limit: 20)
- Query optimization (select only needed fields)
- Caching với Redis (optional)

### 6.3 Frontend
- Code splitting (Next.js automatic)
- Image optimization
- Lazy loading components
- Virtual scrolling cho tables lớn

## 7. DEPLOYMENT

### Local Development
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev

# Database
docker-compose up -d postgres
```

### Production
```bash
docker-compose up -d
```

## 8. TƯƠNG LAI MỞ RỘNG

- [ ] Multi-tenancy (SaaS)
- [ ] Mobile app (React Native)
- [ ] Tích hợp ngân hàng (banking API)
- [ ] AI cho dự đoán dòng tiền
- [ ] Blockchain cho chứng từ
- [ ] Multi-currency
- [ ] Multi-warehouse
