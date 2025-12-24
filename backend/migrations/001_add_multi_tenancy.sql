-- =====================================================
-- MIGRATION 001: ADD MULTI-TENANCY SUPPORT
-- Thêm hỗ trợ SaaS Multi-tenant
-- =====================================================

-- 1. Tạo bảng tenants (Doanh nghiệp)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    company_name_short VARCHAR(100),
    tax_code VARCHAR(20) UNIQUE NOT NULL,
    subdomain VARCHAR(50) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    representative VARCHAR(255), -- Người đại diện pháp luật
    
    -- Subscription
    subscription_plan VARCHAR(50) DEFAULT 'trial', -- trial, basic, professional, enterprise
    subscription_status VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled
    subscription_started_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    
    -- Limits
    max_users INTEGER DEFAULT 5,
    max_products INTEGER DEFAULT 1000,
    max_transactions_per_month INTEGER DEFAULT 1000,
    
    -- Settings
    accounting_standard VARCHAR(20) DEFAULT 'TT133', -- TT133 hoặc TT200
    fiscal_year_start_month INTEGER DEFAULT 1,
    currency VARCHAR(3) DEFAULT 'VND',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Index
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain) WHERE deleted_at IS NULL;

-- 2. Tạo bảng user_tenants (Mapping user - tenant)
CREATE TABLE IF NOT EXISTS user_tenants (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id),
    is_default BOOLEAN DEFAULT FALSE, -- Tenant mặc định của user
    is_owner BOOLEAN DEFAULT FALSE, -- Chủ sở hữu
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP,
    PRIMARY KEY (user_id, tenant_id)
);

CREATE INDEX idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant ON user_tenants(tenant_id);

-- 3. Thêm cột tenant_id vào các bảng nghiệp vụ

-- Settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_settings_tenant ON settings(tenant_id);

-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_products_tenant ON products(tenant_id, created_at);
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_code_key;
ALTER TABLE products ADD CONSTRAINT products_tenant_code_unique UNIQUE (tenant_id, code);

-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id, created_at);
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_code_key;
ALTER TABLE customers ADD CONSTRAINT customers_tenant_code_unique UNIQUE (tenant_id, code);

-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id, created_at);
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_code_key;
ALTER TABLE suppliers ADD CONSTRAINT suppliers_tenant_code_unique UNIQUE (tenant_id, code);

-- Warehouses (nếu có)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses') THEN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
        CREATE INDEX IF NOT EXISTS idx_warehouses_tenant ON warehouses(tenant_id);
    END IF;
END $$;

-- 4. Tạo function để set tenant_id vào session
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql;

-- 5. Tạo function để get current tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', TRUE)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Enable Row Level Security (RLS) cho các bảng nghiệp vụ
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- 7. Tạo policies cho RLS
-- Settings
CREATE POLICY tenant_isolation_settings ON settings
    USING (tenant_id = get_current_tenant());

-- Products
CREATE POLICY tenant_isolation_products ON products
    USING (tenant_id = get_current_tenant());

-- Customers
CREATE POLICY tenant_isolation_customers ON customers
    USING (tenant_id = get_current_tenant());

-- Suppliers
CREATE POLICY tenant_isolation_suppliers ON suppliers
    USING (tenant_id = get_current_tenant());

-- 8. Tạo trigger để tự động update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert demo tenant cho development
INSERT INTO tenants (
    id,
    company_name,
    company_name_short,
    tax_code,
    subdomain,
    address,
    phone,
    email,
    representative,
    subscription_plan,
    subscription_status,
    subscription_started_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Công ty TNHH ABC',
    'ABC Co.',
    '0123456789',
    'abc-company',
    '123 Đường ABC, Quận 1, TP.HCM',
    '028 1234 5678',
    'info@abc.com',
    'Nguyễn Văn A',
    'professional',
    'active',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 10. Gán admin user vào tenant demo
INSERT INTO user_tenants (user_id, tenant_id, role_id, is_default, is_owner)
SELECT 
    u.id,
    '00000000-0000-0000-0000-000000000001'::UUID,
    u.role_id,
    TRUE,
    TRUE
FROM users u
WHERE u.email = 'admin@example.com'
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- 11. Update existing data với tenant_id
UPDATE settings SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE products SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE customers SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

UPDATE suppliers SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

COMMIT;
