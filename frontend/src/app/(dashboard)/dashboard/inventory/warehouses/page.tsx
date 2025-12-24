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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api-client';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  capacity?: number;
  currentUtilization?: number;
  notes?: string;
}

export default function WarehousesPage() {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    filterWarehouses();
  }, [searchText, statusFilter, warehouses]);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/warehouses');
      setWarehouses(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách kho');
    } finally {
      setLoading(false);
    }
  };

  const filterWarehouses = () => {
    let filtered = [...warehouses];

    if (searchText) {
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(searchText.toLowerCase()) ||
          w.code.toLowerCase().includes(searchText.toLowerCase()) ||
          w.city.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((w) => w.isActive === (statusFilter === 'active'));
    }

    setFilteredWarehouses(filtered);
  };

  const handleCreate = () => {
    setEditingWarehouse(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (record: Warehouse) => {
    setEditingWarehouse(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingWarehouse) {
        await apiClient.put(`/warehouses/${editingWarehouse.id}`, values);
        message.success('Cập nhật kho thành công');
      } else {
        await apiClient.post('/warehouses', values);
        message.success('Tạo kho mới thành công');
      }
      setModalVisible(false);
      fetchWarehouses();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu kho');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/warehouses/${id}`);
      message.success('Xóa kho thành công');
      fetchWarehouses();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa kho');
    }
  };

  const columns: ColumnsType<Warehouse> = [
    {
      title: 'Mã kho',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Tên kho',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Warehouse) => (
        <Button type="link" onClick={() => handleEdit(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Thành phố',
      dataIndex: 'city',
      key: 'city',
      width: 150,
    },
    {
      title: 'Người liên hệ',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 150,
    },
    {
      title: 'Điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'Công suất',
      key: 'capacity',
      width: 120,
      render: (_, record: Warehouse) => {
        if (!record.capacity) return '-';
        const utilization = record.currentUtilization || 0;
        const percentage = (utilization / record.capacity) * 100;
        return (
          <div>
            <div>{`${utilization.toLocaleString()} / ${record.capacity.toLocaleString()}`}</div>
            <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Hoạt động' : 'Ngừng'}</Tag>
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
            title="Xóa kho"
            description="Bạn có chắc muốn xóa kho này?"
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
          <EnvironmentOutlined className="mr-2" />
          Quản lý kho
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
          Tạo kho mới
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Input
          placeholder="Tìm theo tên, mã kho, thành phố"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="active">Hoạt động</Option>
          <Option value="inactive">Ngừng</Option>
        </Select>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredWarehouses}
        rowKey="id"
        scroll={{ x: 1300 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} kho`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingWarehouse ? 'Sửa kho' : 'Tạo kho mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label="Mã kho"
              rules={[{ required: true, message: 'Vui lòng nhập mã kho' }]}
            >
              <Input placeholder="VD: KH-HN-01" />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên kho"
              rules={[{ required: true, message: 'Vui lòng nhập tên kho' }]}
            >
              <Input placeholder="VD: Kho Hà Nội 1" />
            </Form.Item>

            <Form.Item
              name="city"
              label="Thành phố"
              rules={[{ required: true, message: 'Vui lòng nhập thành phố' }]}
            >
              <Select placeholder="Chọn thành phố">
                <Option value="Hà Nội">Hà Nội</Option>
                <Option value="Hồ Chí Minh">Hồ Chí Minh</Option>
                <Option value="Đà Nẵng">Đà Nẵng</Option>
                <Option value="Hải Phòng">Hải Phòng</Option>
                <Option value="Cần Thơ">Cần Thơ</Option>
                <Option value="Khác">Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item name="contactPerson" label="Người liên hệ">
              <Input placeholder="Tên người quản lý kho" />
            </Form.Item>

            <Form.Item name="phone" label="Điện thoại">
              <Input placeholder="Số điện thoại" />
            </Form.Item>

            <Form.Item name="email" label="Email">
              <Input type="email" placeholder="Email liên hệ" />
            </Form.Item>

            <Form.Item name="capacity" label="Công suất (m³)">
              <Input type="number" placeholder="Dung tích kho" />
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái">
              <Select>
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Ngừng</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Địa chỉ chi tiết" />
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={3} placeholder="Ghi chú thêm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
