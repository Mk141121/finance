-- =====================================================
-- MIGRATION 002: BUSINESS MODULES
-- Sales, Purchases, Inventory, E-Invoice, Accounting
-- =====================================================

-- =====================================================
-- 1. SALES MODULE (BÁN HÀNG)
-- =====================================================

-- Bảng báo giá
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    quotation_date DATE NOT NULL,
    valid_until DATE,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
    
    -- Totals
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    
    notes TEXT,
    terms_conditions TEXT,
    
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_quotations_tenant ON quotations(tenant_id, created_at);
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_status ON quotations(status);

-- Bảng chi tiết báo giá
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 10,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotation_items_quotation ON quotation_items(quotation_id);

-- Bảng đơn hàng bán
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    quotation_id UUID REFERENCES quotations(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, processing, completed, cancelled
    
    -- Shipping
    shipping_address TEXT,
    shipping_method VARCHAR(50),
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    
    -- Payment
    payment_method VARCHAR(50), -- cash, bank_transfer, card, cod
    payment_terms VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
    
    -- Totals
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_sales_orders_tenant ON sales_orders(tenant_id, order_date DESC);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);

-- Bảng chi tiết đơn hàng
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    delivered_quantity DECIMAL(15,3) DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 10,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_order_items_order ON sales_order_items(sales_order_id);

-- Bảng phiếu xuất kho (Delivery Notes)
CREATE TABLE IF NOT EXISTS delivery_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    warehouse_id UUID REFERENCES warehouses(id),
    delivery_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, delivered, cancelled
    
    shipped_by VARCHAR(100),
    received_by VARCHAR(100),
    vehicle_number VARCHAR(50),
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_delivery_notes_tenant ON delivery_notes(tenant_id, delivery_date DESC);
CREATE INDEX idx_delivery_notes_order ON delivery_notes(sales_order_id);

-- Bảng chi tiết phiếu xuất kho
CREATE TABLE IF NOT EXISTS delivery_note_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_note_id UUID NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_code VARCHAR(50),
    serial_number VARCHAR(50),
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delivery_note_items_note ON delivery_note_items(delivery_note_id);

-- =====================================================
-- 2. PURCHASES MODULE (MUA HÀNG)
-- =====================================================

-- Bảng yêu cầu mua hàng
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    request_date DATE NOT NULL,
    required_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, ordered
    
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_purchase_requests_tenant ON purchase_requests(tenant_id, request_date DESC);

-- Chi tiết yêu cầu mua hàng
CREATE TABLE IF NOT EXISTS purchase_request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    estimated_price DECIMAL(15,2),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng đơn mua hàng
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    purchase_request_id UUID REFERENCES purchase_requests(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, receiving, completed, cancelled
    
    payment_method VARCHAR(50),
    payment_terms VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id, order_date DESC);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);

-- Chi tiết đơn mua hàng
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    received_quantity DECIMAL(15,3) DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 10,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);

-- Bảng phiếu nhập kho (Goods Receipts)
CREATE TABLE IF NOT EXISTS goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    purchase_order_id UUID REFERENCES purchase_orders(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    warehouse_id UUID REFERENCES warehouses(id),
    receipt_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, cancelled
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_goods_receipts_tenant ON goods_receipts(tenant_id, receipt_date DESC);

-- Chi tiết phiếu nhập kho
CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_code VARCHAR(50),
    serial_number VARCHAR(50),
    expiry_date DATE,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goods_receipt_items_receipt ON goods_receipt_items(goods_receipt_id);

-- =====================================================
-- 3. INVENTORY MODULE (KHO NÂNG CAO)
-- =====================================================

-- Bảng kho
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'main', -- main, branch, virtual
    address TEXT,
    phone VARCHAR(20),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_warehouses_tenant ON warehouses(tenant_id);

-- Bảng lô hàng (Batches)
CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    batch_code VARCHAR(50) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,
    quantity_received DECIMAL(15,3) NOT NULL,
    quantity_available DECIMAL(15,3) NOT NULL,
    unit_cost DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, batch_code)
);

CREATE INDEX idx_product_batches_product ON product_batches(product_id);
CREATE INDEX idx_product_batches_warehouse ON product_batches(warehouse_id);

-- Bảng serial numbers
CREATE TABLE IF NOT EXISTS product_serials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    batch_id UUID REFERENCES product_batches(id),
    serial_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- available, sold, defective, returned
    unit_cost DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, serial_number)
);

CREATE INDEX idx_product_serials_product ON product_serials(product_id);

-- Bảng giao dịch kho (Stock Transactions)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    transaction_type VARCHAR(50) NOT NULL, -- in, out, transfer, adjustment
    reference_type VARCHAR(50), -- sales_order, purchase_order, transfer, adjustment
    reference_id UUID,
    batch_code VARCHAR(50),
    serial_number VARCHAR(50),
    
    quantity DECIMAL(15,3) NOT NULL,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    
    balance_before DECIMAL(15,3),
    balance_after DECIMAL(15,3),
    
    transaction_date TIMESTAMP NOT NULL,
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_transactions_tenant ON stock_transactions(tenant_id, transaction_date DESC);
CREATE INDEX idx_stock_transactions_product ON stock_transactions(product_id);
CREATE INDEX idx_stock_transactions_warehouse ON stock_transactions(warehouse_id);

-- Bảng tồn kho (Stock Balances) - Real-time
CREATE TABLE IF NOT EXISTS stock_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    
    quantity DECIMAL(15,3) DEFAULT 0,
    reserved_quantity DECIMAL(15,3) DEFAULT 0, -- Đã đặt nhưng chưa xuất
    available_quantity DECIMAL(15,3) DEFAULT 0, -- quantity - reserved
    
    average_cost DECIMAL(15,2) DEFAULT 0, -- Bình quân gia quyền
    total_cost DECIMAL(15,2) DEFAULT 0,
    
    last_transaction_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, product_id, warehouse_id)
);

CREATE INDEX idx_stock_balances_tenant ON stock_balances(tenant_id);
CREATE INDEX idx_stock_balances_product ON stock_balances(product_id);

-- Phiếu kiểm kê kho
CREATE TABLE IF NOT EXISTS stock_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    count_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, adjusted
    
    total_items INTEGER DEFAULT 0,
    total_difference_value DECIMAL(15,2) DEFAULT 0,
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

-- Chi tiết kiểm kê
CREATE TABLE IF NOT EXISTS stock_count_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    system_quantity DECIMAL(15,3) NOT NULL,
    counted_quantity DECIMAL(15,3) NOT NULL,
    difference_quantity DECIMAL(15,3) NOT NULL,
    
    unit_cost DECIMAL(15,2),
    difference_value DECIMAL(15,2),
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phiếu chuyển kho
CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    transfer_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, in_transit, completed, cancelled
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    received_by UUID REFERENCES users(id),
    received_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

-- Chi tiết chuyển kho
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_transfer_id UUID NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_code VARCHAR(50),
    quantity DECIMAL(15,3) NOT NULL,
    received_quantity DECIMAL(15,3) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
