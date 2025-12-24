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
  DatePicker,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SwapOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

type AdjustmentReason = 'damage' | 'loss' | 'found' | 'expired' | 'counting' | 'other';
type AdjustmentStatus = 'draft' | 'approved' | 'rejected';

interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  adjustmentDate: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  productSKU: string;
  batchNumber?: string;
  currentQuantity: number;
  adjustedQuantity: number;
  differenceQuantity: number;
  unit: string;
  reason: AdjustmentReason;
  status: AdjustmentStatus;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export default function AdjustmentsPage() {
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [filteredAdjustments, setFilteredAdjustments] = useState<StockAdjustment[]>([]);
  const [searchText, setSearchText] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<StockAdjustment | null>(null);
  const [form] = Form.useForm();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
    fetchAdjustments();
  }, []);

  useEffect(() => {
    filterAdjustments();
  }, [searchText, reasonFilter, statusFilter, adjustments]);

  const fetchWarehouses = async () => {
    try {
      const response = await apiClient.get('/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products');
    }
  };

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/inventory/adjustments');
      setAdjustments(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách điều chỉnh');
    } finally {
      setLoading(false);
    }
  };

  const filterAdjustments = () => {
    let filtered = [...adjustments];

    if (searchText) {
      filtered = filtered.filter(
        (a) =>
          a.adjustmentNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          a.productName.toLowerCase().includes(searchText.toLowerCase()) ||
          a.productSKU.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (reasonFilter !== 'all') {
      filtered = filtered.filter((a) => a.reason === reasonFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    setFilteredAdjustments(filtered);
  };

  const handleCreate = () => {
    setEditingAdjustment(null);
    form.resetFields();
    form.setFieldsValue({
      adjustmentDate: dayjs(),
      status: 'draft',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: StockAdjustment) => {
    setEditingAdjustment(record);
    form.setFieldsValue({
      ...record,
      adjustmentDate: dayjs(record.adjustmentDate),
    });
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      const payload = {
        ...values,
        adjustmentDate: values.adjustmentDate.format('YYYY-MM-DD'),
      };

      if (editingAdjustment) {
        await apiClient.put(`/inventory/adjustments/${editingAdjustment.id}`, payload);
        message.success('Cập nhật điều chỉnh thành công');
      } else {
        await apiClient.post('/inventory/adjustments', payload);
        message.success('Tạo điều chỉnh mới thành công');
      }
      setModalVisible(false);
      fetchAdjustments();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu điều chỉnh');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/inventory/adjustments/${id}/approve`);
      message.success('Đã phê duyệt điều chỉnh. Tồn kho đã được cập nhật.');
      fetchAdjustments();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể phê duyệt');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.post(`/inventory/adjustments/${id}/reject`);
      message.success('Đã từ chối điều chỉnh');
      fetchAdjustments();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể từ chối');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/inventory/adjustments/${id}`);
      message.success('Xóa điều chỉnh thành công');
      fetchAdjustments();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa');
    }
  };

  const getReasonColor = (reason: AdjustmentReason) => {
    const colors: Record<AdjustmentReason, string> = {
      damage: 'red',
      loss: 'red',
      found: 'green',
      expired: 'orange',
      counting: 'blue',
      other: 'default',
    };
    return colors[reason];
  };

  const getReasonText = (reason: AdjustmentReason) => {
    const texts: Record<AdjustmentReason, string> = {
      damage: 'Hư hỏng',
      loss: 'Mất mát',
      found: 'Tìm thấy',
      expired: 'Hết hạn',
      counting: 'Kiểm kê',
      other: 'Khác',
    };
    return texts[reason];
  };

  const getStatusColor = (status: AdjustmentStatus) => {
    const colors: Record<AdjustmentStatus, string> = {
      draft: 'default',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status];
  };

  const getStatusText = (status: AdjustmentStatus) => {
    const texts: Record<AdjustmentStatus, string> = {
      draft: 'Nháp',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    };
    return texts[status];
  };

  const columns: ColumnsType<StockAdjustment> = [
    {
      title: 'Số phiếu',
      dataIndex: 'adjustmentNumber',
      key: 'adjustmentNumber',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Ngày điều chỉnh',
      dataIndex: 'adjustmentDate',
      key: 'adjustmentDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 150,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      render: (text: string, record: StockAdjustment) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-500">{record.productSKU}</div>
        </div>
      ),
    },
    {
      title: 'SL hiện tại',
      dataIndex: 'currentQuantity',
      key: 'currentQuantity',
      width: 100,
      align: 'right',
      render: (qty: number, record: StockAdjustment) => `${qty} ${record.unit}`,
    },
    {
      title: 'SL điều chỉnh',
      dataIndex: 'adjustedQuantity',
      key: 'adjustedQuantity',
      width: 110,
      align: 'right',
      render: (qty: number, record: StockAdjustment) => `${qty} ${record.unit}`,
    },
    {
      title: 'Chênh lệch',
      dataIndex: 'differenceQuantity',
      key: 'differenceQuantity',
      width: 100,
      align: 'right',
      render: (diff: number, record: StockAdjustment) => {
        const color = diff > 0 ? '#52c41a' : diff < 0 ? '#ff4d4f' : undefined;
        return (
          <span style={{ color, fontWeight: 'bold' }}>
            {diff > 0 ? '+' : ''}
            {diff} {record.unit}
          </span>
        );
      },
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      width: 120,
      render: (reason: AdjustmentReason) => (
        <Tag color={getReasonColor(reason)}>{getReasonText(reason)}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AdjustmentStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'draft' && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                title="Sửa"
              />
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                title="Phê duyệt"
                style={{ color: '#52c41a' }}
              />
              <Popconfirm
                title="Xóa điều chỉnh"
                description="Bạn có chắc muốn xóa?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button type="text" danger icon={<DeleteOutlined />} title="Xóa" />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <SwapOutlined className="mr-2" />
          Điều chỉnh tồn kho
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
          Tạo phiếu điều chỉnh
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Input
          placeholder="Tìm theo số phiếu, sản phẩm, SKU"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select value={reasonFilter} onChange={setReasonFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả lý do</Option>
          <Option value="damage">Hư hỏng</Option>
          <Option value="loss">Mất mát</Option>
          <Option value="found">Tìm thấy</Option>
          <Option value="expired">Hết hạn</Option>
          <Option value="counting">Kiểm kê</Option>
          <Option value="other">Khác</Option>
        </Select>
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="draft">Nháp</Option>
          <Option value="approved">Đã duyệt</Option>
          <Option value="rejected">Từ chối</Option>
        </Select>
      </div>

      {/* Summary */}
      <div className="mb-4 flex gap-4">
        <Tag color="default">Nháp: {adjustments.filter((a) => a.status === 'draft').length}</Tag>
        <Tag color="green">
          Đã duyệt: {adjustments.filter((a) => a.status === 'approved').length}
        </Tag>
        <Tag color="red">
          Từ chối: {adjustments.filter((a) => a.status === 'rejected').length}
        </Tag>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredAdjustments}
        rowKey="id"
        scroll={{ x: 1600 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} phiếu điều chỉnh`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingAdjustment ? 'Sửa phiếu điều chỉnh' : 'Tạo phiếu điều chỉnh'}
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
              name="adjustmentDate"
              label="Ngày điều chỉnh"
              rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="warehouseId"
              label="Kho"
              rules={[{ required: true, message: 'Vui lòng chọn kho' }]}
            >
              <Select placeholder="Chọn kho">
                {warehouses.map((w) => (
                  <Option key={w.id} value={w.id}>
                    {w.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="productId"
              label="Sản phẩm"
              rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
            >
              <Select placeholder="Chọn sản phẩm" showSearch optionFilterProp="children">
                {products.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="batchNumber" label="Số lô">
              <Input placeholder="Số lô (nếu có)" />
            </Form.Item>

            <Form.Item
              name="currentQuantity"
              label="Số lượng hiện tại"
              rules={[{ required: true, message: 'Vui lòng nhập SL hiện tại' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <Form.Item
              name="adjustedQuantity"
              label="Số lượng điều chỉnh"
              rules={[{ required: true, message: 'Vui lòng nhập SL điều chỉnh' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <Form.Item
              name="reason"
              label="Lý do"
              rules={[{ required: true, message: 'Vui lòng chọn lý do' }]}
            >
              <Select placeholder="Chọn lý do">
                <Option value="damage">Hư hỏng</Option>
                <Option value="loss">Mất mát</Option>
                <Option value="found">Tìm thấy</Option>
                <Option value="expired">Hết hạn</Option>
                <Option value="counting">Kiểm kê</Option>
                <Option value="other">Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Option value="draft">Nháp</Option>
                <Option value="approved">Đã duyệt</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={3} placeholder="Ghi chú chi tiết" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
