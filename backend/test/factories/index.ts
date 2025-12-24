import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// MOCK DATA FACTORIES FOR TESTING
// ============================================================================

// ----------------------------------------------------------------------------
// User Factory
// ----------------------------------------------------------------------------
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  email: 'test@example.com',
  passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNO',
  fullName: 'Nguyễn Văn A',
  phone: '0901234567',
  avatarUrl: null,
  isEmailVerified: true,
  isActive: true,
  roleId: uuidv4(),
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  tenants: [],
  ...overrides,
});

// ----------------------------------------------------------------------------
// Tenant Factory
// ----------------------------------------------------------------------------
export const createMockTenant = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  companyName: 'Công ty TNHH ABC',
  taxCode: '0123456789',
  subdomain: 'abc',
  status: 'active',
  subscriptionPlan: 'pro',
  subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  users: [],
  ...overrides,
});

// ----------------------------------------------------------------------------
// Customer Factory
// ----------------------------------------------------------------------------
export const createMockCustomer = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  tenantId: uuidv4(),
  code: 'KH001',
  name: 'Khách hàng Test',
  type: 'business',
  taxCode: '0123456789',
  email: 'customer@example.com',
  phone: '0901234567',
  address: '123 Nguyễn Huệ, Q1, TP.HCM',
  city: 'Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  contactPerson: 'Nguyễn Văn B',
  contactPhone: '0901234568',
  contactEmail: 'contact@example.com',
  receivableAccount: '131',
  paymentTerms: '30 ngày',
  creditLimit: 100000000,
  balance: 0,
  customerGroup: 'VIP',
  source: 'website',
  salesPersonId: null,
  notes: 'Khách hàng tiềm năng',
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: uuidv4(),
  updatedBy: uuidv4(),
  ...overrides,
});

// ----------------------------------------------------------------------------
// Supplier Factory
// ----------------------------------------------------------------------------
export const createMockSupplier = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  tenantId: uuidv4(),
  code: 'NCC001',
  name: 'Nhà cung cấp Test',
  type: 'business',
  taxCode: '0123456788',
  email: 'supplier@example.com',
  phone: '0901234569',
  address: '456 Lê Lợi, Q1, TP.HCM',
  city: 'Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Thành',
  contactPerson: 'Trần Văn C',
  contactPhone: '0901234570',
  contactEmail: 'contact.supplier@example.com',
  bankAccount: '1234567890',
  bankName: 'Vietcombank',
  bankBranch: 'Chi nhánh TP.HCM',
  payableAccount: '331',
  paymentTerms: '30 ngày',
  balance: 0,
  supplierGroup: 'Nguyên liệu',
  purchasingPersonId: null,
  notes: 'Nhà cung cấp uy tín',
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: uuidv4(),
  updatedBy: uuidv4(),
  ...overrides,
});

// ----------------------------------------------------------------------------
// Product Factory
// ----------------------------------------------------------------------------
export const createMockProduct = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  tenantId: uuidv4(),
  code: 'SP001',
  name: 'Sản phẩm Test',
  type: 'product',
  barcode: '1234567890123',
  categoryId: uuidv4(),
  unitId: uuidv4(),
  unit: 'Cái',
  description: 'Mô tả sản phẩm',
  specifications: 'Quy cách: 10x20x30cm',
  origin: 'Việt Nam',
  price: 100000,
  cost: 70000,
  salePrice: 100000,
  costPrice: 70000,
  vatRate: 10,
  taxRate: 10,
  revenueAccount: '511',
  cogsAccount: '632',
  inventoryAccount: '156',
  manageStock: true,
  manageInventory: true,
  manageBatch: false,
  manageSerial: false,
  manageExpiry: false,
  minStock: 10,
  maxStock: 1000,
  reorderPoint: 20,
  images: [],
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: uuidv4(),
  updatedBy: uuidv4(),
  ...overrides,
});

// ----------------------------------------------------------------------------
// Quotation Factory
// ----------------------------------------------------------------------------
export const createMockQuotation = (overrides: Partial<any> = {}) => {
  const customerId = uuidv4();
  return {
    id: uuidv4(),
    tenantId: uuidv4(),
    code: 'BG-2025-0001',
    customerId,
    customer: createMockCustomer({ id: customerId }),
    date: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'draft' as any,
    currency: 'VND',
    exchangeRate: 1,
    subtotal: 1000000,
    discountRate: 5,
    discountAmount: 50000,
    taxRate: 10,
    taxAmount: 95000,
    total: 1045000,
    notes: 'Báo giá có giá trị trong 30 ngày',
    terms: 'Thanh toán trong 7 ngày',
    paymentTerms: 'Thanh toán trong 7 ngày',
    deliveryTerms: 'Giao hàng trong 3 ngày',
    items: [],
    sentAt: null,
    sentBy: null,
    approvedBy: null,
    approvedAt: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: uuidv4(),
    updatedBy: uuidv4(),
    ...overrides,
  };
};

// ----------------------------------------------------------------------------
// Quotation Item Factory
// ----------------------------------------------------------------------------
export const createMockQuotationItem = (overrides: Partial<any> = {}) => ({
  id: uuidv4(),
  quotationId: uuidv4(),
  productId: uuidv4(),
  product: createMockProduct(),
  description: 'Sản phẩm ABC',
  quantity: 10,
  unit: 'Cái',
  unitPrice: 100000,
  subtotal: 1000000,
  discountRate: 0,
  discountAmount: 0,
  taxRate: 10,
  taxAmount: 100000,
  total: 1100000,
  notes: '',
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ----------------------------------------------------------------------------
// Purchase Order Factory
// ----------------------------------------------------------------------------
export const createMockPurchaseOrder = (overrides: Partial<any> = {}) => {
  const supplierId = uuidv4();
  return {
    id: uuidv4(),
    tenantId: uuidv4(),
    code: 'PO-2025-0001',
    supplierId,
    supplier: createMockSupplier({ id: supplierId }),
    date: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'draft' as any,
    currency: 'VND',
    exchangeRate: 1,
    subtotal: 2000000,
    discountRate: 0,
    discountAmount: 0,
    taxRate: 10,
    taxAmount: 200000,
    total: 2200000,
    shippingCost: 0,
    notes: 'Đơn mua hàng test',
    terms: 'Thanh toán trong 30 ngày',
    warehouseId: uuidv4(),
    deliveryAddress: '456 Lê Lợi, Q1, TP.HCM',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'unpaid',
    approvedBy: null,
    approvedAt: null,
    items: [],
    sentAt: null,
    confirmedAt: null,
    receivedAt: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: uuidv4(),
    updatedBy: uuidv4(),
    ...overrides,
  };
};

// ----------------------------------------------------------------------------
// Sales Order Factory
// ----------------------------------------------------------------------------
export const createMockSalesOrder = (overrides: Partial<any> = {}) => {
  const customerId = uuidv4();
  return {
    id: uuidv4(),
    tenantId: uuidv4(),
    code: 'SO-2025-0001',
    customerId,
    customer: createMockCustomer({ id: customerId }),
    quotationId: null,
    date: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'draft',
    currency: 'VND',
    exchangeRate: 1,
    subtotal: 5000000,
    discountRate: 10,
    discountAmount: 500000,
    taxRate: 10,
    taxAmount: 450000,
    total: 4950000,
    shippingCost: 50000,
    notes: 'Đơn hàng test',
    terms: 'Thanh toán khi nhận hàng',
    warehouseId: uuidv4(),
    salesPersonId: uuidv4(),
    items: [],
    confirmedAt: null,
    completedAt: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: uuidv4(),
    updatedBy: uuidv4(),
    ...overrides,
  };
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
export const createMockQuotationWithItems = (itemCount: number = 2) => {
  const quotation = createMockQuotation();
  const items = Array.from({ length: itemCount }, (_, i) =>
    createMockQuotationItem({
      quotationId: quotation.id,
      sortOrder: i + 1,
    })
  );
  return { ...quotation, items };
};

export const createMockPurchaseOrderWithItems = (itemCount: number = 2) => {
  const po = createMockPurchaseOrder();
  const items = Array.from({ length: itemCount }, (_, i) => ({
    id: uuidv4(),
    purchaseOrderId: po.id,
    productId: uuidv4(),
    description: `Product ${i + 1}`,
    quantity: 10,
    unit: 'Cái',
    unitPrice: 100000,
    subtotal: 1000000,
    taxRate: 10,
    taxAmount: 100000,
    total: 1100000,
    sortOrder: i + 1,
  }));
  return { ...po, items };
};
