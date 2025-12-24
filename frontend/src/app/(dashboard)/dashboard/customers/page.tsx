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
  Popconfirm,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api-client';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Customer {
  id: string;
  name: string;
  taxCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  customerType: 'individual' | 'company';
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchText, typeFilter, statusFilter, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/customers');
      setCustomers(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchText) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          c.phone?.includes(searchText) ||
          c.taxCode?.includes(searchText)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.customerType === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.isActive === (statusFilter === 'active'));
    }

    setFilteredCustomers(filtered);
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    form.resetFields();
    form.setFieldsValue({ customerType: 'company', isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingCustomer) {
        await apiClient.put(`/customers/${editingCustomer.id}`, values);
        message.success('Cập nhật khách hàng thành công');
      } else {
        await apiClient.post('/customers', values);
        message.success('Tạo khách hàng mới thành công');
      }
      setModalVisible(false);
      fetchCustomers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu khách hàng');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/customers/${id}`);
      message.success('Xóa khách hàng thành công');
      fetchCustomers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa khách hàng');
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/customers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Xuất dữ liệu thành công');
    } catch (error: any) {
      message.error('Không thể xuất dữ liệu');
    }
  };

  const validatePhone = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(value)) {
      return Promise.reject('Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)');
    }
    return Promise.resolve();
  };

  const validateTaxCode = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    const taxCodeRegex = /^\d{10,13}$/;
    if (!taxCodeRegex.test(value)) {
      return Promise.reject('Mã số thuế không hợp lệ (10-13 chữ số)');
    }
    return Promise.resolve();
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'Tên khách hàng',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (text: string, record: Customer) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'customerType',
      key: 'customerType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'company' ? 'blue' : 'green'}>
          {type === 'company' ? 'Công ty' : 'Cá nhân'}
        </Tag>
      ),
    },
    {
      title: 'Mã số thuế',
      dataIndex: 'taxCode',
      key: 'taxCode',
      width: 130,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
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
            title="Xóa khách hàng"
            description="Bạn có chắc muốn xóa khách hàng này?"
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
          <UserOutlined className="mr-2" />
          Khách hàng
        </Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Xuất Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
            Tạo khách hàng mới
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Tìm theo tên, email, số điện thoại, mã số thuế"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
          allowClear
        />
        <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả loại</Option>
          <Option value="company">Công ty</Option>
          <Option value="individual">Cá nhân</Option>
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="active">Hoạt động</Option>
          <Option value="inactive">Không hoạt động</Option>
        </Select>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredCustomers}
        rowKey="id"
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} khách hàng`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingCustomer ? 'Sửa khách hàng' : 'Tạo khách hàng mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Tên khách hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
          >
            <Input placeholder="Nhập tên khách hàng" />
          </Form.Item>

          <Form.Item
            name="customerType"
            label="Loại khách hàng"
            rules={[{ required: true, message: 'Vui lòng chọn loại khách hàng' }]}
          >
            <Select>
              <Option value="company">Công ty</Option>
              <Option value="individual">Cá nhân</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="taxCode"
            label="Mã số thuế"
            rules={[{ validator: validateTaxCode }]}
          >
            <Input placeholder="10-13 chữ số" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ validator: validatePhone }]}
          >
            <Input placeholder="0987654321" />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <TextArea rows={2} placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item name="contactPerson" label="Người liên hệ">
            <Input placeholder="Tên người liên hệ" />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Select>
              <Option value={true}>Hoạt động</Option>
              <Option value={false}>Không hoạt động</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={3} placeholder="Ghi chú thêm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
