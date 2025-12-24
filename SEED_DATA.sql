-- =====================================================
-- SEED DATA - Dữ liệu khởi tạo
-- =====================================================

-- Tạo admin user (password: admin123)
INSERT INTO users (id, email, password_hash, full_name, role_id, is_active)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  '$2b$10$B0qiN5pL82VuTTetZIwJB.SXhTQTNyEuy.7vpqFlKXwiPLkVw7kcm', -- admin123
  'Quản trị viên',
  r.id,
  TRUE
FROM roles r WHERE r.name = 'admin';

-- Seed Settings - Thông tin doanh nghiệp
INSERT INTO settings (category, key, value, description) VALUES
(
  'company',
  'info',
  '{
    "name": "Công ty TNHH ABC",
    "tax_code": "0123456789",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "phone": "028 1234 5678",
    "email": "info@abc.com",
    "logo": "/logo.png",
    "representative": "Nguyễn Văn A",
    "accounting_standard": "TT133",
    "accounting_period": "monthly",
    "currency": "VND"
  }',
  'Thông tin doanh nghiệp'
);

-- Seed Settings - Cài đặt hóa đơn
INSERT INTO settings (category, key, value, description) VALUES
(
  'invoice',
  'config',
  '{
    "template": "01GTKT",
    "series": "AA/22E",
    "start_number": 1,
    "default_vat_rate": 10,
    "has_code": true,
    "provider": "vnpt"
  }',
  'Cài đặt hóa đơn điện tử'
);

-- Seed Settings - Cài đặt kế toán
INSERT INTO settings (category, key, value, description) VALUES
(
  'accounting',
  'config',
  '{
    "inventory_method": "FIFO",
    "rounding": 0,
    "default_accounts": {
      "cash": "111",
      "bank": "112",
      "receivable": "131",
      "inventory": "156",
      "payable": "331",
      "revenue": "511",
      "cogs": "632"
    }
  }',
  'Cài đặt kế toán'
);

-- Seed Settings - Cài đặt nhân sự
INSERT INTO settings (category, key, value, description) VALUES
(
  'payroll',
  'config',
  '{
    "pay_cycle": "monthly",
    "social_insurance_rate": 8,
    "health_insurance_rate": 1.5,
    "unemployment_insurance_rate": 1,
    "personal_deduction": 11000000,
    "dependent_deduction": 4400000
  }',
  'Cài đặt lương và bảo hiểm'
);

-- Seed Settings - Cài đặt kho
INSERT INTO settings (category, key, value, description) VALUES
(
  'inventory',
  'config',
  '{
    "allow_negative": false,
    "low_stock_warning": true,
    "manage_by_lot": false,
    "manage_expiry": false
  }',
  'Cài đặt kho vận'
);

-- Seed Settings - Cài đặt giao diện
INSERT INTO settings (category, key, value, description) VALUES
(
  'ui',
  'config',
  '{
    "language": "vi",
    "theme": "light",
    "system_name": "Hệ thống Kế toán Doanh nghiệp",
    "logo_sidebar": "/logo-sidebar.png"
  }',
  'Cài đặt giao diện'
);

-- Seed Product Categories
INSERT INTO product_categories (code, name, description) VALUES
('CAT001', 'Điện tử', 'Sản phẩm điện tử'),
('CAT002', 'Văn phòng phẩm', 'Văn phòng phẩm'),
('CAT003', 'Thực phẩm', 'Thực phẩm và đồ uống'),
('CAT004', 'Dịch vụ', 'Các loại dịch vụ');

-- Seed example products
INSERT INTO products (code, name, type, category_id, unit_id, sale_price, cost_price, vat_rate, revenue_account, cogs_account, inventory_account) 
SELECT 
  'SP001',
  'Laptop Dell XPS 13',
  'product',
  pc.id,
  u.id,
  25000000,
  20000000,
  10,
  '511',
  '632',
  '156'
FROM product_categories pc, units u
WHERE pc.code = 'CAT001' AND u.code = 'cai';

INSERT INTO products (code, name, type, category_id, unit_id, sale_price, cost_price, vat_rate, revenue_account, cogs_account, inventory_account) 
SELECT 
  'SP002',
  'Bút bi Thiên Long',
  'product',
  pc.id,
  u.id,
  5000,
  3000,
  10,
  '511',
  '632',
  '156'
FROM product_categories pc, units u
WHERE pc.code = 'CAT002' AND u.code = 'cai';

INSERT INTO products (code, name, type, category_id, unit_id, sale_price, cost_price, vat_rate, revenue_account, cogs_account, inventory_account) 
SELECT 
  'DV001',
  'Dịch vụ tư vấn',
  'service',
  pc.id,
  u.id,
  5000000,
  0,
  10,
  '511',
  NULL,
  NULL
FROM product_categories pc, units u
WHERE pc.code = 'CAT004' AND u.code = 'lan';

-- Seed example customers
INSERT INTO customers (code, name, type, tax_code, email, phone, address) VALUES
('KH001', 'Công ty TNHH XYZ', 'company', '0987654321', 'contact@xyz.com', '028 9876 5432', '456 Đường XYZ, Quận 2, TP.HCM'),
('KH002', 'Nguyễn Văn B', 'individual', '', 'nguyenb@gmail.com', '0901234567', '789 Đường ABC, Quận 3, TP.HCM');

-- Seed example suppliers
INSERT INTO suppliers (code, name, type, tax_code, bank_account, bank_name, email, phone, address) VALUES
('NCC001', 'Công ty Cung cấp ABC', 'company', '0123456789', '1234567890', 'Vietcombank', 'abc@supplier.com', '028 1111 2222', '111 Đường Supplier, Quận 1, TP.HCM');

-- Seed warehouses
INSERT INTO warehouses (code, name, address) VALUES
('KHO001', 'Kho chính', '123 Đường Kho, Quận Tân Bình, TP.HCM'),
('KHO002', 'Kho phụ', '456 Đường Kho, Quận 2, TP.HCM');

-- Seed departments
INSERT INTO departments (code, name, description) VALUES
('PB001', 'Phòng Kế toán', 'Phòng kế toán và tài chính'),
('PB002', 'Phòng Kinh doanh', 'Phòng kinh doanh'),
('PB003', 'Phòng Kho', 'Phòng quản lý kho'),
('PB004', 'Phòng Hành chính', 'Phòng hành chính nhân sự');

-- Seed positions
INSERT INTO positions (code, name, description) VALUES
('CV001', 'Giám đốc', 'Giám đốc điều hành'),
('CV002', 'Kế toán trưởng', 'Trưởng phòng kế toán'),
('CV003', 'Kế toán viên', 'Nhân viên kế toán'),
('CV004', 'Nhân viên kinh doanh', 'Nhân viên kinh doanh'),
('CV005', 'Thủ kho', 'Nhân viên kho');

-- =====================================================
-- KẾT THÚC SEED DATA
-- =====================================================
