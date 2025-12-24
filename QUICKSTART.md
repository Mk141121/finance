# 🚀 HƯỚNG DẪN CHẠY NHANH

## Phương pháp 1: Docker (Khuyến nghị - Dễ nhất)

### Bước 1: Cài đặt Docker
Tải và cài đặt Docker Desktop từ: https://www.docker.com/products/docker-desktop

### Bước 2: Chạy hệ thống

```bash
# Clone hoặc cd vào thư mục dự án
cd Finance-Tax

# Chạy tất cả (database + backend + frontend)
docker-compose up -d

# Đợi khoảng 1-2 phút để các service khởi động
# Kiểm tra trạng thái
docker-compose ps

# Xem logs nếu có lỗi
docker-compose logs -f
```

### Bước 3: Truy cập

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs

**Đăng nhập:**
- Email: admin@example.com
- Password: admin123

### Tắt hệ thống

```bash
docker-compose down
```

---

## Phương pháp 2: Chạy Local (Development)

### Yêu cầu
- Node.js 18+
- PostgreSQL 15+

### Bước 1: Cài đặt PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Tải và cài đặt từ: https://www.postgresql.org/download/windows/

### Bước 2: Tạo Database

```bash
# Tạo database
createdb finance_tax

# Import schema
psql -U postgres -d finance_tax -f DATABASE_SCHEMA.sql

# Import seed data
psql -U postgres -d finance_tax -f SEED_DATA.sql
```

### Bước 3: Chạy Backend

```bash
cd backend

# Cài đặt
npm install

# Copy .env
cp .env.example .env

# Chỉnh sửa .env nếu cần (database credentials)

# Chạy
npm run start:dev
```

Backend chạy tại: http://localhost:3000

### Bước 4: Chạy Frontend

Mở terminal mới:

```bash
cd frontend

# Cài đặt
npm install

# Copy .env
cp .env.local.example .env.local

# Chạy
npm run dev
```

Frontend chạy tại: http://localhost:3001

---

## Kiểm tra hệ thống hoạt động

### 1. Kiểm tra Backend API

```bash
curl http://localhost:3000/api/v1/settings
```

Hoặc mở browser: http://localhost:3000/api/docs

### 2. Kiểm tra Frontend

Mở browser: http://localhost:3001

### 3. Test Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Nếu trả về `access_token` → Thành công! ✅

---

## Các lệnh hữu ích

### Docker

```bash
# Xem logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Restart một service
docker-compose restart backend

# Stop tất cả
docker-compose down

# Stop và xóa volumes (xóa database)
docker-compose down -v

# Rebuild images
docker-compose up --build
```

### Backend

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm run test

# Generate migration
npm run migration:generate src/database/migrations/MigrationName

# Run migration
npm run migration:run
```

### Frontend

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Lint
npm run lint
```

---

## Troubleshooting Nhanh

### ❌ Port đã được sử dụng

**Backend (3000):**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Frontend (3001):**
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### ❌ Không kết nối được database

```bash
# Kiểm tra PostgreSQL đang chạy
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Kiểm tra connection
psql -U postgres -d finance_tax -c "SELECT 1"
```

### ❌ npm install lỗi

```bash
# Xóa cache và cài lại
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### ❌ Docker build lỗi

```bash
# Clean docker
docker system prune -a
docker-compose build --no-cache
docker-compose up
```

---

## Import dữ liệu mẫu từ Excel

### 1. Tải template Excel

Vào menu "Sản phẩm" → Click "Import" → Tải template

### 2. Điền dữ liệu theo format

| Mã sản phẩm | Tên sản phẩm | Loại | Giá bán | Giá vốn | Thuế GTGT (%) |
|-------------|--------------|------|---------|---------|---------------|
| SP003       | iPhone 15    | product | 30000000 | 25000000 | 10 |

### 3. Upload file

Vào menu "Sản phẩm" → Click "Import" → Chọn file → Upload

---

## Thay đổi Port

### Backend

Sửa file `backend/.env`:
```env
PORT=4000
```

Và `docker-compose.yml`:
```yaml
backend:
  ports:
    - '4000:4000'
```

### Frontend

Sửa file `frontend/package.json`:
```json
"dev": "next dev --port 3002"
```

Và `docker-compose.yml`:
```yaml
frontend:
  ports:
    - '3002:3002'
```

---

## Next Steps

1. ✅ Đăng nhập hệ thống
2. ✅ Vào "Cài đặt" → Nhập thông tin doanh nghiệp
3. ✅ Import dữ liệu sản phẩm, khách hàng
4. ✅ Bắt đầu tạo hóa đơn

**Chúc bạn sử dụng thành công! 🎉**

---

Nếu gặp vấn đề, xem thêm [README.md](./README.md) hoặc [ARCHITECTURE.md](./ARCHITECTURE.md)
