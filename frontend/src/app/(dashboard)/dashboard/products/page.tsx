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
  Select,
  InputNumber,
  Popconfirm,
  Upload,
  Image,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  InboxOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api-client';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  minStockLevel: number;
  maxStockLevel: number;
  currentStock: number;
  description?: string;
  isActive: boolean;
  hasBatch: boolean;
  hasSerial: boolean;
  hasExpiry: boolean;
  imageUrl?: string;
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchText, categoryFilter, statusFilter, stockFilter, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchText) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchText.toLowerCase()) ||
          p.barcode?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.isActive === (statusFilter === 'active'));
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter((p) => p.currentStock < p.minStockLevel);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter((p) => p.currentStock === 0);
    }

    setFilteredProducts(filtered);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      hasBatch: false,
      hasSerial: false,
      hasExpiry: false,
      taxRate: 10,
      unit: 'Cái',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, values);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await apiClient.post('/products', values);
        message.success('Tạo sản phẩm mới thành công');
      }
      setModalVisible(false);
      fetchProducts();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu sản phẩm');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/products/${id}`);
      message.success('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Xuất dữ liệu thành công');
    } catch (error: any) {
      message.error('Không thể xuất dữ liệu');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) {
      return { color: 'red', text: 'Hết hàng' };
    } else if (product.currentStock < product.minStockLevel) {
      return { color: 'orange', text: 'Tồn kho thấp' };
    } else if (product.currentStock > product.maxStockLevel) {
      return { color: 'blue', text: 'Tồn kho cao' };
    }
    return { color: 'green', text: 'Bình thường' };
  };

  const columns: ColumnsType<Product> = [
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (url: string) =>
        url ? (
          <Image src={url} alt="Product" width={50} height={50} style={{ objectFit: 'cover' }} />
        ) : (
          <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded">
            <InboxOutlined />
          </div>
        ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (text: string, record: Product) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: 'Mã vạch',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 120,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: 'Giá vốn',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Giá bán',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right',
      render: (value: number, record: Product) => {
        const status = getStockStatus(record);
        return (
          <Space>
            {value}
            {value < record.minStockLevel && <WarningOutlined style={{ color: '#ff4d4f' }} />}
          </Space>
        );
      },
    },
    {
      title: 'Trạng thái kho',
      key: 'stockStatus',
      width: 120,
      render: (_, record: Product) => {
        const status = getStockStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngừng bán'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Sửa"
          />
          <Popconfirm
            title="Xóa sản phẩm"
            description="Bạn có chắc muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="Xóa" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <InboxOutlined className="mr-2" />
          Sản phẩm
        </Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Xuất Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
            Tạo sản phẩm mới
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Input
          placeholder="Tìm theo tên, SKU, mã vạch"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select value={categoryFilter} onChange={setCategoryFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả danh mục</Option>
          {/* Categories will be loaded from API */}
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="active">Hoạt động</Option>
          <Option value="inactive">Ngừng bán</Option>
        </Select>
        <Select value={stockFilter} onChange={setStockFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả tồn kho</Option>
          <Option value="low">Tồn kho thấp</Option>
          <Option value="out">Hết hàng</Option>
        </Select>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        scroll={{ x: 1600 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} sản phẩm`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingProduct ? 'Sửa sản phẩm' : 'Tạo sản phẩm mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={900}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Tên sản phẩm"
              rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
            >
              <Input placeholder="Nhập tên sản phẩm" />
            </Form.Item>

            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: 'Vui lòng nhập SKU' }]}
            >
              <Input placeholder="Mã sản phẩm" />
            </Form.Item>

            <Form.Item name="barcode" label="Mã vạch">
              <Input placeholder="Mã vạch (nếu có)" />
            </Form.Item>

            <Form.Item name="category" label="Danh mục">
              <Select placeholder="Chọn danh mục">
                <Option value="electronics">Điện tử</Option>
                <Option value="furniture">Nội thất</Option>
                <Option value="food">Thực phẩm</Option>
                <Option value="clothing">Quần áo</Option>
                <Option value="other">Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="unit"
              label="Đơn vị tính"
              rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
            >
              <Select placeholder="Chọn đơn vị">
                <Option value="Cái">Cái</Option>
                <Option value="Chiếc">Chiếc</Option>
                <Option value="Bộ">Bộ</Option>
                <Option value="Kg">Kg</Option>
                <Option value="Lít">Lít</Option>
                <Option value="Mét">Mét</Option>
                <Option value="Hộp">Hộp</Option>
                <Option value="Thùng">Thùng</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="costPrice"
              label="Giá vốn (VND)"
              rules={[{ required: true, message: 'Vui lòng nhập giá vốn' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="sellingPrice"
              label="Giá bán (VND)"
              rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item name="taxRate" label="Thuế suất VAT (%)">
              <Select>
                <Option value={0}>0%</Option>
                <Option value={5}>5%</Option>
                <Option value={10}>10%</Option>
              </Select>
            </Form.Item>

            <Form.Item name="minStockLevel" label="Tồn kho tối thiểu">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <Form.Item name="maxStockLevel" label="Tồn kho tối đa">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái">
              <Select>
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Ngừng bán</Option>
              </Select>
            </Form.Item>

            <Form.Item name="hasBatch" label="Quản lý theo lô" valuePropName="checked">
              <Select>
                <Option value={true}>Có</Option>
                <Option value={false}>Không</Option>
              </Select>
            </Form.Item>

            <Form.Item name="hasSerial" label="Quản lý theo serial" valuePropName="checked">
              <Select>
                <Option value={true}>Có</Option>
                <Option value={false}>Không</Option>
              </Select>
            </Form.Item>

            <Form.Item name="hasExpiry" label="Có hạn sử dụng" valuePropName="checked">
              <Select>
                <Option value={true}>Có</Option>
                <Option value={false}>Không</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả sản phẩm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
