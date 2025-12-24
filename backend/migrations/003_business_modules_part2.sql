-- =====================================================
-- MIGRATION 003: E-INVOICE & ACCOUNTING MODULES
-- Hóa đơn điện tử và Kế toán
-- =====================================================

-- =====================================================
-- 4. E-INVOICE MODULE (HÓA ĐƠN ĐIỆN TỬ)
-- =====================================================

-- Bảng hóa đơn điện tử
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Thông tin hóa đơn
    invoice_number VARCHAR(50) NOT NULL, -- Số hóa đơn: 0000001
    invoice_series VARCHAR(20) NOT NULL, -- Ký hiệu: AA/25E
    invoice_template VARCHAR(20) NOT NULL, -- Mẫu: 01GTKT, 02GTTT
    invoice_type VARCHAR(50) DEFAULT 'VAT', -- VAT, Sales, Asset
    
    -- Reference
    sales_order_id UUID REFERENCES sales_orders(id),
    delivery_note_id UUID REFERENCES delivery_notes(id),
    
    -- Người mua
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT,
    customer_tax_code VARCHAR(20),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Ngày tháng
    invoice_date DATE NOT NULL,
    issue_date TIMESTAMP, -- Ngày phát hành CQT
    
    -- Trạng thái
    status VARCHAR(30) DEFAULT 'draft', -- draft, signed, issued, sent, cancelled, replaced, adjusted
    
    -- Chữ ký số
    signed_by VARCHAR(255),
    signed_at TIMESTAMP,
    signature_value TEXT, -- Chữ ký điện tử
    
    -- Mã CQT
    tax_authority_code VARCHAR(50), -- Mã của CQT cấp
    lookup_code VARCHAR(50), -- Mã tra cứu
    
    -- Số tiền
    subtotal DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    amount_in_words VARCHAR(500), -- Bằng chữ
    
    -- Hình thức thanh toán
    payment_method VARCHAR(50),
    
    -- File đính kèm
    xml_file_path TEXT,
    pdf_file_path TEXT,
    
    -- Hóa đơn thay thế/điều chỉnh
    replaced_invoice_id UUID REFERENCES invoices(id),
    adjustment_type VARCHAR(50), -- increase, decrease
    adjustment_reason TEXT,
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, invoice_series, invoice_number)
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, invoice_date DESC);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_tax_code ON invoices(tax_authority_code);

-- Chi tiết hóa đơn
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(50),
    description TEXT,
    unit VARCHAR(50),
    
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    
    amount_before_tax DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Lịch sử hóa đơn (Audit trail)
CREATE TABLE IF NOT EXISTS invoice_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    action VARCHAR(50) NOT NULL, -- created, signed, issued, sent, viewed, cancelled
    
    from_status VARCHAR(30),
    to_status VARCHAR(30),
    
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_history_invoice ON invoice_history(invoice_id, performed_at DESC);

-- Cấu hình nhà cung cấp hóa đơn
CREATE TABLE IF NOT EXISTS invoice_provider_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    provider_name VARCHAR(50) NOT NULL, -- VNPT, Viettel, FPT, MISA
    provider_code VARCHAR(20),
    
    api_endpoint TEXT,
    api_username VARCHAR(255),
    api_password VARCHAR(255),
    api_key TEXT,
    
    certificate_path TEXT, -- Đường dẫn chữ ký số .pfx
    certificate_password VARCHAR(255),
    certificate_serial VARCHAR(255),
    certificate_valid_from DATE,
    certificate_valid_to DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, provider_name)
);

-- =====================================================
-- 5. ACCOUNTING MODULE (KẾ TOÁN)
-- =====================================================

-- Hệ thống tài khoản
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    account_code VARCHAR(20) NOT NULL, -- 111, 112, 131...
    account_name VARCHAR(255) NOT NULL,
    account_name_en VARCHAR(255),
    
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    account_category VARCHAR(50), -- current_asset, fixed_asset, etc.
    
    parent_code VARCHAR(20), -- Tài khoản cha
    level INTEGER DEFAULT 1, -- Cấp độ: 1 (111), 2 (1111), 3 (11111)
    
    is_detail BOOLEAN DEFAULT TRUE, -- Có phải TK chi tiết không
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Tính chất
    normal_balance VARCHAR(10) DEFAULT 'debit', -- debit, credit
    
    -- Áp dụng
    accounting_standard VARCHAR(20), -- TT133, TT200, both
    
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, account_code)
);

CREATE INDEX idx_coa_tenant ON chart_of_accounts(tenant_id, account_code);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_code);

-- Kỳ kế toán
CREATE TABLE IF NOT EXISTS fiscal_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    period_code VARCHAR(20) NOT NULL, -- 01/2025, 02/2025
    period_name VARCHAR(100) NOT NULL, -- Tháng 1/2025
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    year INTEGER NOT NULL,
    month INTEGER,
    quarter INTEGER,
    
    status VARCHAR(20) DEFAULT 'open', -- open, closed, locked
    
    closed_by UUID REFERENCES users(id),
    closed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, period_code)
);

CREATE INDEX idx_fiscal_periods_tenant ON fiscal_periods(tenant_id, start_date);

-- Chứng từ ghi sổ (Journal Entries)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    entry_number VARCHAR(50) NOT NULL, -- Số chứng từ
    entry_date DATE NOT NULL,
    fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    
    entry_type VARCHAR(50) NOT NULL, -- manual, sales, purchase, payment, receipt, salary, depreciation
    
    -- Reference
    reference_type VARCHAR(50), -- sales_order, invoice, payment, etc.
    reference_id UUID,
    reference_number VARCHAR(50),
    
    description TEXT NOT NULL,
    
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    
    status VARCHAR(20) DEFAULT 'draft', -- draft, posted, approved, voided
    
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    posted_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, entry_number)
);

CREATE INDEX idx_journal_entries_tenant ON journal_entries(tenant_id, entry_date DESC);
CREATE INDEX idx_journal_entries_period ON journal_entries(fiscal_period_id);
CREATE INDEX idx_journal_entries_type ON journal_entries(entry_type);

-- Chi tiết chứng từ (Journal Entry Lines)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    account_code VARCHAR(20) NOT NULL,
    
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    
    description TEXT,
    
    -- Tracking dimensions
    customer_id UUID REFERENCES customers(id),
    supplier_id UUID REFERENCES suppliers(id),
    product_id UUID REFERENCES products(id),
    department_id UUID, -- TODO: Add departments table
    project_id UUID, -- TODO: Add projects table
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);

-- Số dư tài khoản (Account Balances) - Snapshot
CREATE TABLE IF NOT EXISTS account_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    fiscal_period_id UUID NOT NULL REFERENCES fiscal_periods(id),
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    
    opening_debit DECIMAL(15,2) DEFAULT 0,
    opening_credit DECIMAL(15,2) DEFAULT 0,
    
    period_debit DECIMAL(15,2) DEFAULT 0,
    period_credit DECIMAL(15,2) DEFAULT 0,
    
    ending_debit DECIMAL(15,2) DEFAULT 0,
    ending_credit DECIMAL(15,2) DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, fiscal_period_id, account_id)
);

CREATE INDEX idx_account_balances_tenant ON account_balances(tenant_id, fiscal_period_id);

-- Phiếu thu/chi (Cash Receipts/Payments)
CREATE TABLE IF NOT EXISTS cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    transaction_number VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- receipt, payment
    transaction_date DATE NOT NULL,
    
    -- Đối tượng
    customer_id UUID REFERENCES customers(id),
    supplier_id UUID REFERENCES suppliers(id),
    contact_name VARCHAR(255),
    
    -- Tài khoản tiền
    cash_account_code VARCHAR(20), -- 111 (Tiền mặt), 112 (Tiền gửi)
    bank_account VARCHAR(50),
    bank_name VARCHAR(255),
    
    amount DECIMAL(15,2) NOT NULL,
    amount_in_words VARCHAR(500),
    
    description TEXT,
    notes TEXT,
    
    -- Chứng từ kế toán
    journal_entry_id UUID REFERENCES journal_entries(id),
    
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, cancelled
    
    created_by UUID REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, transaction_number)
);

CREATE INDEX idx_cash_transactions_tenant ON cash_transactions(tenant_id, transaction_date DESC);
CREATE INDEX idx_cash_transactions_type ON cash_transactions(transaction_type);

-- Enable RLS cho các bảng mới
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

-- Tạo policies cho RLS
CREATE POLICY tenant_isolation_quotations ON quotations USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_sales_orders ON sales_orders USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_delivery_notes ON delivery_notes USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_purchase_requests ON purchase_requests USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_purchase_orders ON purchase_orders USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_goods_receipts ON goods_receipts USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_warehouses ON warehouses USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_product_batches ON product_batches USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_product_serials ON product_serials USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_stock_transactions ON stock_transactions USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_stock_balances ON stock_balances USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_stock_counts ON stock_counts USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_stock_transfers ON stock_transfers USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_invoices ON invoices USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_invoice_provider_configs ON invoice_provider_configs USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_chart_of_accounts ON chart_of_accounts USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_fiscal_periods ON fiscal_periods USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_journal_entries ON journal_entries USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_account_balances ON account_balances USING (tenant_id = get_current_tenant());
CREATE POLICY tenant_isolation_cash_transactions ON cash_transactions USING (tenant_id = get_current_tenant());

-- Insert demo data: Chart of Accounts (Hệ thống tài khoản chuẩn TT133)
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, level, is_detail, normal_balance, accounting_standard) VALUES
('00000000-0000-0000-0000-000000000001', '111', 'Tiền mặt', 'asset', 1, TRUE, 'debit', 'both'),
('00000000-0000-0000-0000-000000000001', '112', 'Tiền gửi ngân hàng', 'asset', 1, TRUE, 'debit', 'both'),
('00000000-0000-0000-0000-000000000001', '131', 'Phải thu của khách hàng', 'asset', 1, TRUE, 'debit', 'both'),
('00000000-0000-0000-0000-000000000001', '156', 'Hàng hóa', 'asset', 1, TRUE, 'debit', 'both'),
('00000000-0000-0000-0000-000000000001', '1331', 'Thuế GTGT được khấu trừ', 'asset', 1, TRUE, 'debit', 'both'),
('00000000-0000-0000-0000-000000000001', '331', 'Phải trả cho người bán', 'liability', 1, TRUE, 'credit', 'both'),
('00000000-0000-0000-0000-000000000001', '3331', 'Thuế GTGT phải nộp', 'liability', 1, TRUE, 'credit', 'both'),
('00000000-0000-0000-0000-000000000001', '3334', 'Thuế thu nhập cá nhân', 'liability', 1, TRUE, 'credit', 'both'),
('00000000-0000-0000-0000-000000000001', '411', 'Vốn đầu tư của chủ sở hữu', 'equity', 1, TRUE, 'credit', 'both'),
('00000000-0000-0000-0000-000000000001', '421', 'Lợi nhuận chưa phân phối', 'equity', 1, TRUE, 'credit', 'both'),
('00000000-0000-0000-0000-000000000001', '511', 'Doanh thu bán hàng', 'revenue', 1, TRUE, 'credit', 'both'),
('00000000-0000-0000-0000-000000000001', '632', 'Giá vốn hàng bán', 'expense', 1, TRUE, 'debit', 'both'),
('00000000-0000-0000-0000-000000000001', '641', 'Chi phí bán hàng', 'expense', 1, TRUE, 'debit', 'both'),
('00000000-0000-0000-0000-000000000001', '642', 'Chi phí quản lý doanh nghiệp', 'expense', 1, TRUE, 'debit', 'both'),
('00000000-0000-0000-0000-000000000001', '911', 'Xác định kết quả kinh doanh', 'expense', 1, TRUE, 'debit', 'both')
ON CONFLICT (tenant_id, account_code) DO NOTHING;

-- Insert demo fiscal period
INSERT INTO fiscal_periods (tenant_id, period_code, period_name, start_date, end_date, year, month, quarter, status)
VALUES 
('00000000-0000-0000-0000-000000000001', '01/2025', 'Tháng 1 năm 2025', '2025-01-01', '2025-01-31', 2025, 1, 1, 'open'),
('00000000-0000-0000-0000-000000000001', '12/2024', 'Tháng 12 năm 2024', '2024-12-01', '2024-12-31', 2024, 12, 4, 'closed')
ON CONFLICT (tenant_id, period_code) DO NOTHING;

-- Insert demo warehouse
INSERT INTO warehouses (tenant_id, code, name, type, address, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'WH01', 'Kho chính', 'main', '123 Đường ABC, Quận 1, TP.HCM', TRUE)
ON CONFLICT (tenant_id, code) DO NOTHING;

COMMIT;
