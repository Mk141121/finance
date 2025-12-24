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
  Input,
  Select,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckOutlined,
  FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  status: 'draft' | 'sent' | 'confirmed' | 'rejected' | 'expired';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes?: string;
}

export default function QuotationsPage() {
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [searchText, statusFilter, quotations]);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/quotations');
      setQuotations(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách báo giá');
    } finally {
      setLoading(false);
    }
  };

  const filterQuotations = () => {
    let filtered = [...quotations];

    if (searchText) {
      filtered = filtered.filter(
        (q) =>
          q.quotationNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          q.customerName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }

    setFilteredQuotations(filtered);
  };

  const handleCreate = () => {
    router.push('/dashboard/quotations/new');
  };

  const handleView = (id: string) => {
    router.push(`/dashboard/quotations/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/quotations/${id}/edit`);
  };

  const handleSend = async (id: string) => {
    try {
      await apiClient.post(`/quotations/${id}/send`);
      message.success('Gửi báo giá thành công');
      fetchQuotations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể gửi báo giá');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await apiClient.post(`/quotations/${id}/confirm`);
      message.success('Xác nhận báo giá thành công. Đơn hàng đã được tạo.');
      router.push('/dashboard/sales-orders');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xác nhận báo giá');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/quotations/${id}`);
      message.success('Xóa báo giá thành công');
      fetchQuotations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa báo giá');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
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
      expired: 'Hết hạn',
    };
    return texts[status] || status;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const columns: ColumnsType<Quotation> = [
    {
      title: 'Số báo giá',
      dataIndex: 'quotationNumber',
      key: 'quotationNumber',
      width: 150,
      fixed: 'left',
      render: (text: string, record: Quotation) => (
        <Button type="link" onClick={() => handleView(record.id)}>
          {text}
        </Button>
      ),
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
      render: (date: string) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        return (
          <span style={{ color: isExpired ? '#ff4d4f' : undefined }}>
            {dayjs(date).format('DD/MM/YYYY')}
          </span>
        );
      },
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
            title="Xem chi tiết"
          />
          {record.status === 'draft' && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record.id)}
                title="Sửa"
              />
              <Popconfirm
                title="Gửi báo giá"
                description="Bạn có chắc muốn gửi báo giá này cho khách hàng?"
                onConfirm={() => handleSend(record.id)}
                okText="Gửi"
                cancelText="Hủy"
              >
                <Button type="text" icon={<SendOutlined />} title="Gửi" />
              </Popconfirm>
              <Popconfirm
                title="Xóa báo giá"
                description="Bạn có chắc muốn xóa báo giá này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button type="text" danger icon={<DeleteOutlined />} title="Xóa" />
              </Popconfirm>
            </>
          )}
          {record.status === 'sent' && (
            <Popconfirm
              title="Xác nhận báo giá"
              description="Xác nhận báo giá này? Báo giá sẽ được chuyển thành đơn hàng."
              onConfirm={() => handleConfirm(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button type="text" icon={<CheckOutlined />} title="Xác nhận" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <FileTextOutlined className="mr-2" />
          Báo giá
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
          Tạo báo giá mới
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Tìm theo số báo giá hoặc khách hàng"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 200 }}
        >
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="draft">Nháp</Option>
          <Option value="sent">Đã gửi</Option>
          <Option value="confirmed">Đã xác nhận</Option>
          <Option value="rejected">Từ chối</Option>
          <Option value="expired">Hết hạn</Option>
        </Select>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredQuotations}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} báo giá`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />
    </div>
  );
}
