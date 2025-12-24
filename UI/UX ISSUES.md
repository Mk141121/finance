# 🎨 UI/UX ISSUES - DANH SÁCH VẤN ĐỀ CHO AGENT FIX

**Ngày tạo**:  2025-12-24  
**Frontend**: Next.js 14 + React + Ant Design 5 + TailwindCSS  
**Trạng thái**: 🔴 CRITICAL - Nhiều trang còn thiếu hoàn toàn

---

## 📊 TỔNG QUAN TÌNH HÌNH

### Frontend Pages Status

```
┌────────────────────────────────┬──────────┬──────────┬────────────┐
│ Page/Module                    │ Status   │ Priority │ Effort     │
├────────────────────────────────┼──────────┼──────────┼────────────┤
│ Login/Register                 │ ✅ Done  │ -        │ -          │
│ Dashboard Overview             │ ⚠️ Basic │ 🔴 P0    │ 2 days     │
│ Sales Orders List              │ ✅ Done  │ -        │ -          │
│ E-Invoices List                │ ✅ Done  │ -        │ -          │
│ Journal Entries List           │ ✅ Done  │ -        │ -          │
│ Quotations (CRUD)              │ ❌ NONE  │ 🔴 P0    │ 3 days     │
│ Purchase Orders (CRUD)         │ ❌ NONE  │ 🔴 P0    │ 3 days     │
│ Customers (CRUD)               │ ❌ NONE  │ 🔴 P0    │ 2 days     │
│ Suppliers (CRUD)               │ ❌ NONE  │ 🔴 P0    │ 2 days     │
│ Products (CRUD)                │ ❌ NONE  │ 🔴 P0    │ 3 days     │
│ Inventory Management           │ ❌ NONE  │ 🟡 P1    │ 4 days     │
│ Chart of Accounts              │ ❌ NONE  │ 🟡 P1    │ 2 days     │
│ Settings                       │ ❌ NONE  │ 🟠 P2    │ 1 day      │
│ User Profile                   │ ❌ NONE  │ 🟠 P2    │ 1 day      │
│ Reports/Analytics              │ ❌ NONE  │ 🟠 P2    │ 5 days     │
└────────────────────────────────┴──────────┴──────────┴────────────┘
```

**Tổng kết**:
- ✅ **Hoàn thành**:  4/15 pages (27%)
- ⚠️ **Cơ bản**: 1/15 pages (7%)
- ❌ **Thiếu hoàn toàn**: 10/15 pages (66%)

---

## 🔴 PRIORITY 0 - CRITICAL PAGES (CẦN NGAY)

### Issue #UI-1: Dashboard Page - Chỉ Có Skeleton

**File**: `frontend/src/app/(dashboard)/dashboard/page.tsx`

#### ❌ Vấn đề Hiện Tại

```tsx
// Current:  Chỉ có 4 cards với giá trị = 0 (hard-coded)
<Statistic title="Đơn hàng" value={0} />
<Statistic title="Hóa đơn" value={0} />
<Statistic title="Tồn kho" value={0} />
<Statistic title="Doanh thu" value={0} suffix="VND" />
```

**Problems**:
- ❌ Không fetch data thực từ API
- ❌ Thiếu charts/graphs (doanh thu theo tháng, top products, etc.)
- ❌ Thiếu recent activities feed
- ❌ Thiếu quick actions (tạo đơn mới, xuất hóa đơn)
- ❌ Thiếu alerts (tồn kho thấp, hóa đơn chờ duyệt)
- ❌ Không responsive tốt

#### ✅ Giải pháp

**1. Fetch Real Data**

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Statistic, List, Avatar, Button, Space } from 'antd';
import {
  ShoppingCartOutlined,
  FileTextOutlined,
  InboxOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import apiClient from '@/lib/api-client';

const { Title } = Typography;

interface DashboardStats {
  totalOrders: number;
  ordersGrowth: number;
  totalInvoices: number;
  invoicesGrowth: number;
  totalInventory: number;
  inventoryGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'invoice' | 'payment';
  title: string;
  description: string;
  amount?:  number;
  createdAt: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    ordersGrowth: 0,
    totalInvoices: 0,
    invoicesGrowth: 0,
    totalInventory: 0,
    inventoryGrowth: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await apiClient.get('/dashboard/stats');
      setStats(statsResponse.data);

      // Fetch recent activities
      const activitiesResponse = await apiClient. get('/dashboard/recent-activities');
      setRecentActivities(activitiesResponse. data);

      // Fetch revenue chart data (last 12 months)
      const revenueResponse = await apiClient.get('/dashboard/revenue-chart');
      setRevenueChart(revenueResponse.data);

      // Fetch top selling products
      const productsResponse = await apiClient.get('/dashboard/top-products');
      setTopProducts(productsResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <RiseOutlined style={{ color:  '#3f8600' }} />
    ) : (
      <FallOutlined style={{ color: '#cf1322' }} />
    );
  };

  const revenueChartConfig = {
    data: revenueChart,
    xField: 'month',
    yField: 'revenue',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 5,
      shape: 'circle',
    },
  };

  const topProductsChartConfig = {
    data:  topProducts,
    xField:  'productName',
    yField: 'quantity',
    color: '#52c41a',
    label: {
      position: 'top',
      style: {
        fill: '#000',
        opacity: 0.6,
      },
    },
  };

  return (
    <div>
      {/* Header with Quick Actions */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Tổng quan</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} href="/dashboard/sales-orders/new">
            Tạo đơn hàng
          </Button>
          <Button icon={<FileTextOutlined />} href="/dashboard/e-invoices/new">
            Xuất hóa đơn
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Đơn hàng"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
              suffix={
                <span style={{ fontSize: '14px', marginLeft: '8px' }}>
                  {getGrowthIcon(stats.ordersGrowth)} {Math.abs(stats.ordersGrowth)}%
                </span>
              }
              valueStyle={{ color: '#3f8600' }}
            />
            <div className="text-gray-500 text-sm mt-2">So với tháng trước</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Hóa đơn"
              value={stats.totalInvoices}
              prefix={<FileTextOutlined />}
              suffix={
                <span style={{ fontSize: '14px', marginLeft:  '8px' }}>
                  {getGrowthIcon(stats.invoicesGrowth)} {Math.abs(stats.invoicesGrowth)}%
                </span>
              }
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="text-gray-500 text-sm mt-2">So với tháng trước</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tồn kho"
              value={stats.totalInventory}
              prefix={<InboxOutlined />}
              suffix=" sản phẩm"
              valueStyle={{ color: '#cf1322' }}
            />
            <div className="text-gray-500 text-sm mt-2">Tổng số sản phẩm</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Doanh thu"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value as number)}
              suffix={
                <span style={{ fontSize:  '14px', marginLeft: '8px' }}>
                  {getGrowthIcon(stats.revenueGrowth)} {Math.abs(stats.revenueGrowth)}%
                </span>
              }
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="text-gray-500 text-sm mt-2">So với tháng trước</div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="Doanh thu 12 tháng gần nhất" loading={loading}>
            <Line {... revenueChartConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Top sản phẩm bán chạy" loading={loading}>
            <Column {...topProductsChartConfig} />
          </Card>
        </Col>
      </Row>

      {/* Recent Activities & Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Hoạt động gần đây" loading={loading}>
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item. Meta
                    avatar={
                      <Avatar
                        icon={
                          item.type === 'order' ?  (
                            <ShoppingCartOutlined />
                          ) : item.type === 'invoice' ?  (
                            <FileTextOutlined />
                          ) : (
                            <DollarOutlined />
                          )
                        }
                      />
                    }
                    title={item.title}
                    description={
                      <>
                        <div>{item.description}</div>
                        {item.amount && (
                          <div className="text-green-600 font-medium">
                            {formatCurrency(item.amount)}
                          </div>
                        )}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Cảnh báo" loading={loading}>
            <List
              dataSource={[
                {
                  title: 'Tồn kho thấp',
                  description:  '5 sản phẩm dưới mức tồn kho tối thiểu',
                  type: 'warning',
                },
                {
                  title:  'Hóa đơn chờ duyệt',
                  description: '3 hóa đơn cần phê duyệt',
                  type: 'info',
                },
                {
                  title: 'Đơn hàng trễ',
                  description: '2 đơn hàng quá hạn giao',
                  type: 'error',
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item.title} description={item.description} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

**Dependencies cần thêm**:
```bash
npm install @ant-design/plots dayjs
```

#### 📋 Checklist

```bash
- [ ] Install @ant-design/plots
- [ ] Create /dashboard/stats API endpoint (backend)
- [ ] Create /dashboard/recent-activities API endpoint
- [ ] Create /dashboard/revenue-chart API endpoint
- [ ] Create /dashboard/top-products API endpoint
- [ ] Implement frontend với code trên
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test loading states
- [ ] Test error handling
- [ ] Commit:  "feat(ui): complete dashboard with real-time stats and charts"
```

#### ⏱️ Estimated Time:  2 days

---

### Issue #UI-2: Quotations Page - HOÀN TOÀN THIẾU

**File**: `frontend/src/app/(dashboard)/dashboard/quotations/page.tsx` ❌ **KHÔNG TỒN TẠI**

#### ❌ Vấn đề

- ❌ Page hoàn toàn không có
- ❌ Menu sidebar có link nhưng 404
- ❌ Backend API đã sẵn sàng nhưng không có UI

#### ✅ Giải pháp

**Tạo file mới**:  `frontend/src/app/(dashboard)/dashboard/quotations/page.tsx`

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import apiClient, { handleApiError } from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  customerName: string;
  status: 'draft' | 'sent' | 'confirmed' | 'rejected' | 'expired';
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
}

export default function QuotationsPage() {
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [form] = Form. useForm();
  const router = useRouter();

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/quotations');
      setQuotations(response. data);
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleCreate = () => {
    setEditingQuotation(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Quotation) => {
    setEditingQuotation(record);
    form.setFieldsValue({
      ... record,
      quotationDate: dayjs(record.quotationDate),
      validUntil: dayjs(record.validUntil),
    });
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingQuotation) {
        await apiClient. put(`/quotations/${editingQuotation.id}`, values);
        message.success('Cập nhật báo giá thành công');
      } else {
        await apiClient.post('/quotations', values);
        message.success('Tạo báo giá thành công');
      }
      setModalVisible(false);
      fetchQuotations();
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  const handleSend = async (id: string) => {
    Modal.confirm({
      title: 'Gửi báo giá',
      content: 'Bạn có chắc muốn gửi báo giá này cho khách hàng? ',
      onOk: async () => {
        try {
          await apiClient.post(`/quotations/${id}/send`);
          message.success('Gửi báo giá thành công');
          fetchQuotations();
        } catch (error) {
          message.error(handleApiError(error));
        }
      },
    });
  };

  const handleConfirm = async (id: string) => {
    Modal.confirm({
      title: 'Xác nhận báo giá',
      content:  'Xác nhận báo giá này?  Báo giá sẽ được chuyển thành đơn hàng.',
      onOk: async () => {
        try {
          await apiClient.post(`/quotations/${id}/confirm`);
          message.success('Xác nhận báo giá thành công');
          router.push('/dashboard/sales-orders');
        } catch (error) {
          message.error(handleApiError(error));
        }
      },
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/quotations/${id}`);
      message.success('Xóa báo giá thành công');
      fetchQuotations();
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  const getStatusColor = (status: string) => {
    const colors:  Record<string, string> = {
      draft: 'default',
      sent: 'blue',
      confirmed: 'green',
      rejected: 'red',
      expired: 'orange',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: 'Nháp',
      sent: 'Đã gửi',
      confirmed: 'Đã xác nhận',
      rejected: 'Từ chối',
      expired:  'Hết hạn',
    };
    return texts[status] || status;
  };

  const columns: ColumnsType<Quotation> = [
    {
      title: 'Số báo giá',
      dataIndex: 'quotationNumber',
      key: 'quotationNumber',
      width: 130,
    },
    {
      title: 'Ngày báo giá',
      dataIndex: 'quotationDate',
      key: 'quotationDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Hạn báo giá',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title:  'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status:  string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 150,
      align: 'right',
      render: (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(amount),
    },
    {
      title: 'Thao tác',
      key:  'actions',
      width:  200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/dashboard/quotations/${record.id}`)}
          />
          {record.status === 'draft' && (
            <>
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
              <Button
                type="text"
                icon={<SendOutlined />}
                onClick={() => handleSend(record.id)}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
              />
            </>
          )}
          {record.status === 'sent' && (
            <Button
              type="text"
              icon={<CheckOutlined />}
              onClick={() => handleConfirm(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Báo giá</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Tạo báo giá mới
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={quotations}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} báo giá`,
        }}
      />

      <Modal
        title={editingQuotation ? 'Sửa báo giá' :  'Tạo báo giá mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="customerId"
            label="Khách hàng"
            rules={[{ required: true, message: 'Vui lòng chọn khách hàng' }]}
          >
            <Select placeholder="Chọn khách hàng" showSearch>
              {/* Load customers from API */}
            </Select>
          </Form. Item>

          <Form.Item
            name="quotationDate"
            label="Ngày báo giá"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="validUntil"
            label="Hạn báo giá"
            rules={[{ required: true, message:  'Vui lòng chọn hạn báo giá' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          {/* Add items table here */}
        </Form>
      </Modal>
    </div>
  );
}
```

#### 📋 Checklist

```bash
- [ ] Create frontend/src/app/(dashboard)/dashboard/quotations/page.tsx
- [ ] Create frontend/src/app/(dashboard)/dashboard/quotations/[id]/page.tsx (detail view)
- [ ] Create frontend/src/app/(dashboard)/dashboard/quotations/new/page.tsx (create form)
- [ ] Test CRUD operations
- [ ] Test status transitions (draft → sent → confirmed)
- [ ] Test PDF export
- [ ] Test email sending
- [ ] Commit: "feat(ui): add Quotations management pages"
```

#### ⏱️ Estimated Time: 3 days

---

### Issue #UI-3: Customers Page - HOÀN TOÀN THIẾU

**File**: `frontend/src/app/(dashboard)/dashboard/customers/page.tsx` ❌ **KHÔNG TỒN TẠI**

#### ✅ Giải pháp (Template)

Similar to Quotations page với:
- ✅ List view với filters (search, type, isActive)
- ✅ Create/Edit modal form
- ✅ Delete with confirmation
- ✅ Vietnamese phone validation (0987654321)
- ✅ Tax code validation (10-13 digits)
- ✅ Export to Excel
- ✅ Import from Excel

#### 📋 Checklist

```bash
- [ ] Create customers/page.tsx (list)
- [ ] Create customers/[id]/page.tsx (detail)
- [ ] Create customers/new/page.tsx (create form)
- [ ] Implement search & filters
- [ ] Implement Excel import/export
- [ ] Test validations
- [ ] Commit: "feat(ui): add Customers management pages"
```

#### ⏱️ Estimated Time: 2 days

---

### Issue #UI-4: Products Page - HOÀN TOÀN THIẾU

**File**: `frontend/src/app/(dashboard)/dashboard/products/page.tsx` ❌ **KHÔNG TỒN TẠI**

#### ✅ Giải pháp (Key Features)

- ✅ Product list with image thumbnails
- ✅ Filters:  category, type, isActive, low stock
- ✅ Create/Edit form with: 
  - Product info (name, SKU, barcode)
  - Pricing (cost, selling price, VAT rate)
  - Inventory (min/max stock levels)
  - Batch/Serial tracking options
  - Expiry date management
- ✅ Bulk operations (delete, update prices)
- ✅ Stock status indicators
- ✅ Excel import/export

#### 📋 Checklist

```bash
- [ ] Create products/page.tsx
- [ ] Create products/[id]/page.tsx
- [ ] Create products/new/page.tsx
- [ ] Implement image upload
- [ ] Implement stock management
- [ ] Test VAT calculations
- [ ] Commit: "feat(ui): add Products management pages"
```

#### ⏱️ Estimated Time: 3 days

---

### Issue #UI-5: Purchase Orders Page - HOÀN TOÀN THIẾU

**File**: `frontend/src/app/(dashboard)/dashboard/purchase-orders/page.tsx` ❌ **KHÔNG TỒN TẠI**

#### ✅ Giải pháp (Key Features)

- ✅ PO list with status workflow
- ✅ Create PO with items
- ✅ Status transitions:  DRAFT → SENT → APPROVED → RECEIVED
- ✅ Supplier selection
- ✅ Expected delivery date
- ✅ Auto stock IN when status = RECEIVED
- ✅ Print/Export PO

#### 📋 Checklist

```bash
- [ ] Create purchase-orders/page.tsx
- [ ] Create purchase-orders/[id]/page.tsx
- [ ] Create purchase-orders/new/page.tsx
- [ ] Implement status workflow UI
- [ ] Test stock integration
- [ ] Commit: "feat(ui): add Purchase Orders pages"
```

#### ⏱️ Estimated Time: 3 days

---

## 🟡 PRIORITY 1 - IMPORTANT PAGES

### Issue #UI-6: Inventory Management Pages

**Files needed**:
- `frontend/src/app/(dashboard)/dashboard/inventory/warehouses/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/inventory/transactions/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/inventory/balances/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/inventory/adjustments/page.tsx`

#### Features: 
- ✅ Warehouse management
- ✅ Stock IN/OUT transactions
- ✅ Stock balances by product/warehouse
- ✅ Stock adjustments (damage, loss)
- ✅ Batch tracking
- ✅ Expiry date alerts
- ✅ FIFO costing

#### ⏱️ Estimated Time: 4 days

---

### Issue #UI-7: Chart of Accounts Page

**File**: `frontend/src/app/(dashboard)/dashboard/chart-of-accounts/page.tsx`

#### Features:
- ✅ Tree view of accounts (TT133/2016 compliant)
- ✅ Add/Edit/Delete accounts
- ✅ Account types:  ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- ✅ Account balance display
- ✅ Account search & filter

#### ⏱️ Estimated Time: 2 days

---

## 🟠 PRIORITY 2 - NICE TO HAVE

### Issue #UI-8: Settings Page

**Features**:
- Company settings
- Tax settings (VAT rates)
- Invoice settings (template, signature)
- User preferences
- System preferences

#### ⏱️ Estimated Time: 1 day

---

### Issue #UI-9: User Profile Page

**Features**:
- View/Edit profile
- Change password
- Avatar upload
- Activity history

#### ⏱️ Estimated Time: 1 day

---

### Issue #UI-10: Reports & Analytics

**Files needed**:
- Sales reports
- Purchase reports
- Inventory reports
- Financial reports (P&L, Balance Sheet)
- Tax reports (VAT)

#### ⏱️ Estimated Time: 5 days

---

## 🐛 UI/UX BUGS & IMPROVEMENTS

### Bug #1: Login Page - Duplicate Form Code

**File**: `frontend/src/app/(auth)/login/page.tsx`

#### ❌ Problem

```tsx
// Lines 38-77:  First form definition
<Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
  {/* ... */}
</Form>

// Lines 80-118:  DUPLICATE form definition (same code!)
<Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
  {/* ... */}
</Form>
```

**Vấn đề**: Code bị duplicate, gây confusion

#### ✅ Fix

Xóa code duplicate (lines 80-118), chỉ giữ lại một form. 

```bash
- [ ] Remove duplicate form code in login page
- [ ] Test login still works
- [ ] Commit:  "fix(ui): remove duplicate form code in login page"
```

---

### Bug #2: Dashboard Layout - Double Sidebar Definitions

**File**: `frontend/src/app/(dashboard)/layout.tsx`

#### ❌ Problem

Có 2 files layout: 
1. `frontend/src/components/layout/DashboardLayout.tsx` (123 lines)
2. `frontend/src/app/(dashboard)/layout.tsx` (123 lines)

Code giống nhau → confusing!

#### ✅ Fix

Consolidate into one file, remove duplicate.

```bash
- [ ] Consolidate dashboard layout into one file
- [ ] Remove unused file
- [ ] Test navigation still works
- [ ] Commit:  "refactor(ui): consolidate dashboard layout"
```

---

### Improvement #1: Missing Loading States

**Problem**: Nhiều pages không có proper loading skeleton

#### ✅ Fix

```tsx
import { Skeleton, Card } from 'antd';

{loading ?  (
  <Card>
    <Skeleton active paragraph={{ rows: 4 }} />
  </Card>
) : (
  <Table dataSource={data} columns={columns} />
)}
```

---

### Improvement #2: Missing Error Boundaries

**Problem**: Không có error boundaries → app crash khi có lỗi

#### ✅ Fix

Create `frontend/src/components/ErrorBoundary.tsx`:

```tsx
'use client';

import React from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React. Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Có lỗi xảy ra"
          subTitle="Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại."
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
```

---

### Improvement #3: Missing Empty States

**Problem**: Tables không có empty state khi không có data

#### ✅ Fix

```tsx
<Table
  dataSource={data}
  columns={columns}
  locale={{
    emptyText: (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có dữ liệu"
      >
        <Button type="primary" onClick={handleCreate}>
          Tạo mới
        </Button>
      </Empty>
    ),
  }}
/>
```

---

### Improvement #4: Missing Responsive Design

**Problem**:  Nhiều pages không responsive tốt trên mobile

#### ✅ Fix

```tsx
// Use Ant Design responsive utilities
import { Grid } from 'antd';
const { useBreakpoint } = Grid;

const screens = useBreakpoint();

<Table
  columns={columns}
  dataSource={data}
  scroll={{ x: screens.xs ? 800 : undefined }}
  pagination={{
    pageSize: screens.xs ? 10 : 20,
    simple: screens.xs,
  }}
/>
```

---

### Improvement #5: Missing Internationalization (i18n)

**Problem**: Hard-coded Vietnamese text → không thể đổi ngôn ngữ

#### ✅ Fix (Optional - Low Priority)

Setup next-i18next for multi-language support. 

---

## 📊 PROGRESS TRACKER

### Week-by-Week Plan

**Week 1** (Priority 0):
```
Day 1-2: Dashboard with real data & charts
Day 3-5: Quotations CRUD pages
```

**Week 2** (Priority 0):
```
Day 1-2: Customers CRUD pages
Day 3-5: Products CRUD pages
```

**Week 3** (Priority 0 & 1):
```
Day 1-3: Purchase Orders CRUD pages
Day 4-5: Start Inventory pages
```

**Week 4** (Priority 1 & 2):
```
Day 1-2: Complete Inventory pages
Day 3-4: Chart of Accounts page
Day 5: Settings & Profile pages
```

**Week 5** (Priority 2 & Bugs):
```
Day 1-3: Reports & Analytics
Day 4-5: Fix bugs & improvements
```

**Total**: ~5 weeks to complete all UI/UX

---

## ✅ COMPLETION CHECKLIST

### Priority 0 (Must have - 2 weeks)
- [ ] Dashboard with real data
- [ ] Quotations CRUD
- [ ] Customers CRUD
- [ ] Products CRUD  
- [ ] Purchase Orders CRUD

### Priority 1 (Important - 1 week)
- [ ] Inventory Management
- [ ] Chart of Accounts

### Priority 2 (Nice to have - 1 week)
- [ ] Settings
- [ ] User Profile
- [ ] Reports & Analytics

### Bugs & Improvements (1 week)
- [ ] Fix duplicate code
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Add empty states
- [ ] Improve responsive design

---

## 🎯 SUCCESS METRICS

### After Completion:
- ✅ 15/15 pages implemented (100%)
- ✅ All CRUD operations working
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Proper error handling
- ✅ Loading states everywhere
- ✅ Empty states for all lists
- ✅ Vietnamese language support
- ✅ Print/Export functionality
- ✅ Real-time data updates

---

**🚀 START WITH:  Dashboard + Quotations (Week 1)**

**Last Updated**: 2025-12-24  
**Status**: 🔴 URGENT - 66% UI missing, bắt đầu ngay! 