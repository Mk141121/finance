-- =====================================================
-- HỆ THỐNG KẾ TOÁN DOANH NGHIỆP - DATABASE SCHEMA
-- PostgreSQL 15+
-- =====================================================

-- Bật UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. AUTHENTICATION & AUTHORIZATION
-- =====================================================

-- Bảng vai trò
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- admin, accountant, warehouse, hr, manager
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng quyền
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- products.create, products.read, etc.
    module VARCHAR(50) NOT NULL, -- products, customers, inventory, etc.
    action VARCHAR(20) NOT NULL, -- create, read, update, delete
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng vai trò - quyền (Many-to-Many)
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Bảng người dùng
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role_id UUID REFERENCES roles(id),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Bảng log hoạt động
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- create, update, delete, login, logout
    module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. SETTINGS (Cài đặt hệ thống)
-- =====================================================

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL, -- company, invoice, accounting, payroll, inventory, ui, user
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    UNIQUE(category, key)
);

-- Index cho settings
CREATE INDEX idx_settings_category ON settings(category);
CREATE INDEX idx_settings_key ON settings(key);

-- =====================================================
-- 3. DANH MỤC SẢN PHẨM
-- =====================================================

-- Bảng nhóm sản phẩm
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES product_categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đơn vị tính
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng sản phẩm
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- product (hàng hóa), service (dịch vụ), material (nguyên vật liệu)
    category_id UUID REFERENCES product_categories(id),
    unit_id UUID REFERENCES units(id),
    sale_price DECIMAL(18, 2) DEFAULT 0,
    cost_price DECIMAL(18, 2) DEFAULT 0,
    vat_rate DECIMAL(5, 2) DEFAULT 10.00, -- 0, 5, 8, 10
    revenue_account VARCHAR(20), -- Tài khoản doanh thu (511, 512...)
    cogs_account VARCHAR(20), -- Tài khoản giá vốn (632)
    inventory_account VARCHAR(20), -- Tài khoản kho (152, 156...)
    manage_inventory BOOLEAN DEFAULT TRUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Index cho products
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- =====================================================
-- 4. KHÁCH HÀNG
-- =====================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- individual (cá nhân), company (doanh nghiệp)
    tax_code VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    receivable_account VARCHAR(20) DEFAULT '131', -- Tài khoản công nợ
    payment_terms VARCHAR(100), -- Điều khoản thanh toán
    credit_limit DECIMAL(18, 2) DEFAULT 0,
    balance DECIMAL(18, 2) DEFAULT 0, -- Số dư công nợ
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Index cho customers
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_tax_code ON customers(tax_code);
CREATE INDEX idx_customers_active ON customers(is_active);

-- =====================================================
-- 5. NHÀ CUNG CẤP
-- =====================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- individual, company
    tax_code VARCHAR(20),
    bank_account VARCHAR(50),
    bank_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    payable_account VARCHAR(20) DEFAULT '331', -- Tài khoản công nợ
    balance DECIMAL(18, 2) DEFAULT 0, -- Số dư công nợ
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Index cho suppliers
CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_tax_code ON suppliers(tax_code);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- =====================================================
-- 6. KHO VẬN
-- =====================================================

-- Bảng kho
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng tồn kho
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id),
    product_id UUID REFERENCES products(id),
    quantity DECIMAL(18, 3) DEFAULT 0,
    unit_cost DECIMAL(18, 2) DEFAULT 0, -- Giá vốn bình quân
    total_value DECIMAL(18, 2) DEFAULT 0,
    min_quantity DECIMAL(18, 3) DEFAULT 0, -- Số lượng cảnh báo tồn kho thấp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, product_id)
);

-- Bảng phiếu nhập/xuất kho
CREATE TABLE stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL, -- IN (nhập), OUT (xuất), TRANSFER (chuyển kho), ADJUST (điều chỉnh)
    warehouse_id UUID REFERENCES warehouses(id),
    reference_type VARCHAR(50), -- purchase_order, sale_order, production, adjustment
    reference_id UUID,
    transaction_date DATE NOT NULL,
    total_amount DECIMAL(18, 2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP
);

-- Bảng chi tiết phiếu nhập/xuất
CREATE TABLE stock_transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES stock_transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity DECIMAL(18, 3) NOT NULL,
    unit_cost DECIMAL(18, 2) NOT NULL,
    total_amount DECIMAL(18, 2) NOT NULL,
    lot_number VARCHAR(50), -- Số lô
    expiry_date DATE, -- Hạn sử dụng
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index cho inventory
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_stock_trans_date ON stock_transactions(transaction_date);
CREATE INDEX idx_stock_trans_type ON stock_transactions(type);
CREATE INDEX idx_stock_trans_no ON stock_transactions(transaction_no);

-- =====================================================
-- 7. NHÂN SỰ
-- =====================================================

-- Bảng phòng ban
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES users(id),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chức vụ
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng nhân viên
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    id_number VARCHAR(20), -- CMND/CCCD
    tax_code VARCHAR(20), -- Mã số thuế
    birth_date DATE,
    gender VARCHAR(10), -- male, female, other
    address TEXT,
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    hire_date DATE,
    contract_type VARCHAR(50), -- permanent (chính thức), contract (hợp đồng), probation (thử việc)
    salary_account VARCHAR(20), -- Tài khoản lương (334)
    social_insurance_number VARCHAR(20),
    health_insurance_number VARCHAR(20),
    bank_account VARCHAR(50),
    bank_name VARCHAR(255),
    dependents INTEGER DEFAULT 0, -- Số người phụ thuộc
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Bảng hợp đồng lao động
CREATE TABLE employee_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    contract_no VARCHAR(50) UNIQUE NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    base_salary DECIMAL(18, 2) NOT NULL,
    allowances JSONB, -- Các khoản phụ cấp
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Bảng chấm công
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    attendance_date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    work_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present', -- present, absent, leave, sick, business_trip
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, attendance_date)
);

-- Bảng bảng lương
CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_no VARCHAR(50) UNIQUE NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    pay_date DATE,
    total_amount DECIMAL(18, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, paid
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    UNIQUE(month, year)
);

-- Bảng chi tiết lương
CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID REFERENCES payrolls(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    base_salary DECIMAL(18, 2) DEFAULT 0,
    allowances DECIMAL(18, 2) DEFAULT 0, -- Phụ cấp
    bonus DECIMAL(18, 2) DEFAULT 0, -- Thưởng
    total_income DECIMAL(18, 2) DEFAULT 0, -- Tổng thu nhập
    social_insurance DECIMAL(18, 2) DEFAULT 0, -- BHXH (8%)
    health_insurance DECIMAL(18, 2) DEFAULT 0, -- BHYT (1.5%)
    unemployment_insurance DECIMAL(18, 2) DEFAULT 0, -- BHTN (1%)
    personal_income_tax DECIMAL(18, 2) DEFAULT 0, -- Thuế TNCN
    total_deductions DECIMAL(18, 2) DEFAULT 0, -- Tổng khấu trừ
    net_salary DECIMAL(18, 2) DEFAULT 0, -- Lương thực lĩnh
    work_days DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index cho employees
CREATE INDEX idx_employees_code ON employees(code);
CREATE INDEX idx_employees_name ON employees(full_name);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);

-- =====================================================
-- 8. HÓA ĐƠN VAT
-- =====================================================

-- Bảng hóa đơn
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_template VARCHAR(20), -- Mẫu số (01GTKT, 02GTTT...)
    invoice_series VARCHAR(20), -- Ký hiệu (AA/22E...)
    invoice_date DATE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_tax_code VARCHAR(20),
    customer_address TEXT,
    payment_method VARCHAR(50), -- cash, transfer, card
    subtotal DECIMAL(18, 2) DEFAULT 0, -- Tiền hàng chưa VAT
    vat_amount DECIMAL(18, 2) DEFAULT 0, -- Tiền VAT
    total_amount DECIMAL(18, 2) DEFAULT 0, -- Tổng tiền
    amount_in_words TEXT, -- Số tiền bằng chữ
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, issued, cancelled
    issued_at TIMESTAMP,
    issued_by UUID REFERENCES users(id),
    xml_file_path TEXT, -- Đường dẫn file XML
    pdf_file_path TEXT, -- Đường dẫn file PDF
    digital_signature TEXT, -- Chữ ký số
    provider VARCHAR(50), -- vnpt, viettel, misa, fpt
    provider_invoice_id VARCHAR(100), -- Mã hóa đơn trên hệ thống nhà cung cấp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Bảng chi tiết hóa đơn
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_code VARCHAR(50),
    product_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    quantity DECIMAL(18, 3) NOT NULL,
    unit_price DECIMAL(18, 2) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL, -- quantity * unit_price
    vat_rate DECIMAL(5, 2) NOT NULL,
    vat_amount DECIMAL(18, 2) NOT NULL,
    total_amount DECIMAL(18, 2) NOT NULL, -- amount + vat_amount
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index cho invoices
CREATE INDEX idx_invoices_no ON invoices(invoice_no);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- =====================================================
-- 9. KẾ TOÁN TỔNG HỢP
-- =====================================================

-- Bảng hệ thống tài khoản (TT133, TT200)
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    parent_code VARCHAR(20),
    level INTEGER NOT NULL, -- Cấp tài khoản (1, 2, 3)
    is_detail BOOLEAN DEFAULT FALSE, -- Tài khoản chi tiết
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng chứng từ kế toán
CREATE TABLE accounting_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_no VARCHAR(50) UNIQUE NOT NULL,
    voucher_type VARCHAR(20) NOT NULL, -- PC (phiếu chi), PT (phiếu thu), PK (phiếu kho), KC (kết chuyển)
    voucher_date DATE NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- invoice, payment, salary, etc.
    reference_id UUID,
    total_amount DECIMAL(18, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft', -- draft, posted, cancelled
    posted_at TIMESTAMP,
    posted_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Bảng định khoản kế toán
CREATE TABLE accounting_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES accounting_vouchers(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    debit_account VARCHAR(20) NOT NULL, -- Tài khoản Nợ
    credit_account VARCHAR(20) NOT NULL, -- Tài khoản Có
    amount DECIMAL(18, 2) NOT NULL,
    description TEXT,
    customer_id UUID REFERENCES customers(id),
    supplier_id UUID REFERENCES suppliers(id),
    employee_id UUID REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng sổ cái
CREATE TABLE general_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(20) NOT NULL,
    entry_date DATE NOT NULL,
    voucher_id UUID REFERENCES accounting_vouchers(id),
    description TEXT,
    debit_amount DECIMAL(18, 2) DEFAULT 0,
    credit_amount DECIMAL(18, 2) DEFAULT 0,
    balance DECIMAL(18, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index cho accounting
CREATE INDEX idx_coa_code ON chart_of_accounts(account_code);
CREATE INDEX idx_voucher_no ON accounting_vouchers(voucher_no);
CREATE INDEX idx_voucher_date ON accounting_vouchers(voucher_date);
CREATE INDEX idx_voucher_type ON accounting_vouchers(voucher_type);
CREATE INDEX idx_entries_debit ON accounting_entries(debit_account);
CREATE INDEX idx_entries_credit ON accounting_entries(credit_account);
CREATE INDEX idx_entries_date ON accounting_entries(entry_date);
CREATE INDEX idx_ledger_account_date ON general_ledger(account_code, entry_date);

-- =====================================================
-- 10. SEED DATA - ROLES
-- =====================================================

INSERT INTO roles (name, display_name, description) VALUES
('admin', 'Quản trị hệ thống', 'Toàn quyền truy cập hệ thống'),
('accountant', 'Kế toán', 'Quản lý kế toán, hóa đơn, báo cáo tài chính'),
('warehouse', 'Thủ kho', 'Quản lý kho, nhập xuất hàng'),
('hr', 'Nhân sự', 'Quản lý nhân sự, chấm công, lương'),
('manager', 'Quản lý', 'Xem báo cáo, thống kê');

-- =====================================================
-- 11. SEED DATA - UNITS
-- =====================================================

INSERT INTO units (code, name) VALUES
('cai', 'Cái'),
('chiec', 'Chiếc'),
('hop', 'Hộp'),
('thung', 'Thùng'),
('kg', 'Kilogram'),
('lit', 'Lít'),
('met', 'Mét'),
('m2', 'Mét vuông'),
('m3', 'Mét khối'),
('tan', 'Tấn'),
('bao', 'Bao'),
('goi', 'Gói'),
('vien', 'Viên'),
('chai', 'Chai'),
('hop', 'Hộp'),
('lan', 'Lần'),
('gio', 'Giờ'),
('ngay', 'Ngày'),
('thang', 'Tháng');

-- =====================================================
-- 12. SEED DATA - CHART OF ACCOUNTS (TT133 - Mẫu cơ bản)
-- =====================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, level, is_detail) VALUES
-- TÀI SẢN (ASSET)
('111', 'Tiền mặt', 'asset', 1, TRUE),
('112', 'Tiền gửi ngân hàng', 'asset', 1, TRUE),
('131', 'Phải thu của khách hàng', 'asset', 1, TRUE),
('152', 'Nguyên liệu, vật liệu', 'asset', 1, TRUE),
('155', 'Thành phẩm', 'asset', 1, TRUE),
('156', 'Hàng hóa', 'asset', 1, TRUE),
('211', 'Tài sản cố định hữu hình', 'asset', 1, FALSE),
('214', 'Hao mòn tài sản cố định', 'asset', 1, TRUE),

-- NỢ PHẢI TRẢ (LIABILITY)
('331', 'Phải trả cho người bán', 'liability', 1, TRUE),
('334', 'Phải trả người lao động', 'liability', 1, TRUE),
('3382', 'Thuế GTGT phải nộp', 'liability', 2, TRUE),
('3383', 'Thuế TNDN phải nộp', 'liability', 2, TRUE),

-- VỐN CHỦ SỞ HỮU (EQUITY)
('411', 'Vốn đầu tư của chủ sở hữu', 'equity', 1, TRUE),
('421', 'Lợi nhuận chưa phân phối', 'equity', 1, TRUE),

-- DOANH THU (REVENUE)
('511', 'Doanh thu bán hàng và cung cấp dịch vụ', 'revenue', 1, TRUE),
('515', 'Doanh thu hoạt động tài chính', 'revenue', 1, TRUE),
('521', 'Các khoản giảm trừ doanh thu', 'revenue', 1, TRUE),

-- GIÁ VỐN & CHI PHÍ (EXPENSE)
('632', 'Giá vốn hàng bán', 'expense', 1, TRUE),
('641', 'Chi phí bán hàng', 'expense', 1, TRUE),
('642', 'Chi phí quản lý doanh nghiệp', 'expense', 1, TRUE),
('622', 'Chi phí nhân công trực tiếp', 'expense', 1, TRUE),
('627', 'Chi phí sản xuất chung', 'expense', 1, TRUE),
('811', 'Chi phí khác', 'expense', 1, TRUE);

-- =====================================================
-- 13. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger cho các bảng cần
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 14. VIEWS - BÁO CÁO
-- =====================================================

-- View: Tổng hợp công nợ khách hàng
CREATE VIEW customer_receivables AS
SELECT 
    c.id,
    c.code,
    c.name,
    c.balance as current_balance,
    COUNT(i.id) as total_invoices,
    COALESCE(SUM(i.total_amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN i.status = 'issued' THEN i.total_amount ELSE 0 END), 0) as unpaid_amount
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
WHERE c.is_active = TRUE
GROUP BY c.id, c.code, c.name, c.balance;

-- View: Tồn kho theo sản phẩm
CREATE VIEW inventory_summary AS
SELECT 
    p.code as product_code,
    p.name as product_name,
    w.name as warehouse_name,
    i.quantity,
    i.unit_cost,
    i.total_value,
    i.min_quantity,
    CASE 
        WHEN i.quantity <= i.min_quantity THEN 'low_stock'
        WHEN i.quantity = 0 THEN 'out_of_stock'
        ELSE 'normal'
    END as stock_status
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE p.is_active = TRUE;

-- View: Tổng hợp lương theo tháng
CREATE VIEW payroll_summary AS
SELECT 
    p.month,
    p.year,
    p.status,
    COUNT(pi.id) as total_employees,
    SUM(pi.total_income) as total_income,
    SUM(pi.total_deductions) as total_deductions,
    SUM(pi.net_salary) as total_net_salary
FROM payrolls p
JOIN payroll_items pi ON p.id = pi.payroll_id
GROUP BY p.id, p.month, p.year, p.status;

-- =====================================================
-- KẾT THÚC DATABASE SCHEMA
-- =====================================================
