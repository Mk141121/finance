'use client';

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Table,
  Button,
  Space,
  Tag,
  message,
  Input,
  Select,
  Popconfirm,
  DatePicker,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SendOutlined,
  CheckOutlined,
  InboxOutlined,
  MoreOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

type POStatus = 'draft' | 'sent' | 'approved' | 'received' | 'cancelled';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes?: string;
  receivedDate?: string;
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchText, statusFilter, dateRange, purchaseOrders]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/purchase-orders');
      setPurchaseOrders(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách đơn mua hàng');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...purchaseOrders];

    if (searchText) {
      filtered = filtered.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          po.supplierName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((po) => po.status === statusFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((po) => {
        const orderDate = dayjs(po.orderDate);
        return orderDate.isAfter(dateRange[0]) && orderDate.isBefore(dateRange[1]);
      });
    }

    setFilteredOrders(filtered);
  };

  const handleCreate = () => {
    router.push('/dashboard/purchase-orders/new');
  };

  const handleView = (id: string) => {
    router.push(`/dashboard/purchase-orders/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/purchase-orders/${id}/edit`);
  };

  const handleSend = async (id: string) => {
    try {
      await apiClient.post(`/purchase-orders/${id}/send`);
      message.success('Đã gửi đơn mua hàng cho nhà cung cấp');
      fetchPurchaseOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể gửi đơn mua hàng');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/purchase-orders/${id}/approve`);
      message.success('Đã phê duyệt đơn mua hàng');
      fetchPurchaseOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể phê duyệt đơn mua hàng');
    }
  };

  const handleReceive = async (id: string) => {
    try {
      await apiClient.post(`/purchase-orders/${id}/receive`);
      message.success('Đã xác nhận nhận hàng. Hàng hóa đã được nhập kho tự động.');
      fetchPurchaseOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xác nhận nhận hàng');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiClient.post(`/purchase-orders/${id}/cancel`);
      message.success('Đã hủy đơn mua hàng');
      fetchPurchaseOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể hủy đơn mua hàng');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/purchase-orders/${id}`);
      message.success('Đã xóa đơn mua hàng');
      fetchPurchaseOrders();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa đơn mua hàng');
    }
  };

  const handlePrint = async (id: string) => {
    try {
      const response = await apiClient.get(`/purchase-orders/${id}/print`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PO_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Đã tải về đơn mua hàng');
    } catch (error: any) {
      message.error('Không thể in đơn mua hàng');
    }
  };

  const getStatusColor = (status: POStatus) => {
    const colors: Record<POStatus, string> = {
      draft: 'default',
      sent: 'blue',
      approved: 'cyan',
      received: 'green',
      cancelled: 'red',
    };
    return colors[status];
  };

  const getStatusText = (status: POStatus) => {
    const texts: Record<POStatus, string> = {
      draft: 'Nháp',
      sent: 'Đã gửi',
      approved: 'Đã phê duyệt',
      received: 'Đã nhận hàng',
      cancelled: 'Đã hủy',
    };
    return texts[status];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getActionMenuItems = (record: PurchaseOrder) => {
    const items = [];

    if (record.status === 'draft') {
      items.push(
        {
          key: 'edit',
          label: 'Sửa',
          icon: <EditOutlined />,
          onClick: () => handleEdit(record.id),
        },
        {
          key: 'send',
          label: 'Gửi cho NCC',
          icon: <SendOutlined />,
          onClick: () => handleSend(record.id),
        },
        {
          key: 'delete',
          label: 'Xóa',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDelete(record.id),
        }
      );
    }

    if (record.status === 'sent') {
      items.push({
        key: 'approve',
        label: 'Phê duyệt',
        icon: <CheckOutlined />,
        onClick: () => handleApprove(record.id),
      });
    }

    if (record.status === 'approved') {
      items.push({
        key: 'receive',
        label: 'Xác nhận nhận hàng',
        icon: <InboxOutlined />,
        onClick: () => handleReceive(record.id),
      });
    }

    if (['draft', 'sent', 'approved'].includes(record.status)) {
      items.push({
        key: 'cancel',
        label: 'Hủy đơn',
        danger: true,
        onClick: () => handleCancel(record.id),
      });
    }

    items.push({
      key: 'print',
      label: 'In đơn',
      icon: <PrinterOutlined />,
      onClick: () => handlePrint(record.id),
    });

    return items;
  };

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'Số PO',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 150,
      fixed: 'left',
      render: (text: string, record: PurchaseOrder) => (
        <Button type="link" onClick={() => handleView(record.id)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Ngày đặt hàng',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày giao dự kiến',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      width: 140,
      render: (date: string) => {
        const deliveryDate = dayjs(date);
        const isOverdue = deliveryDate.isBefore(dayjs()) && !['received', 'cancelled'].includes;
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {deliveryDate.format('DD/MM/YYYY')}
          </span>
        );
      },
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 200,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: POStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right',
      render: (value: number) => <strong>{formatCurrency(value)}</strong>,
    },
    {
      title: 'Ngày nhận hàng',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      width: 130,
      render: (date?: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
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
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
            title="Xem chi tiết"
          />
          {record.status === 'draft' && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}
              title="Sửa"
            />
          )}
          <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} title="Thêm" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <InboxOutlined className="mr-2" />
          Đơn mua hàng
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
          Tạo đơn mua hàng
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Input
          placeholder="Tìm theo số PO hoặc nhà cung cấp"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 180 }}
          placeholder="Lọc theo trạng thái"
        >
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="draft">Nháp</Option>
          <Option value="sent">Đã gửi</Option>
          <Option value="approved">Đã phê duyệt</Option>
          <Option value="received">Đã nhận hàng</Option>
          <Option value="cancelled">Đã hủy</Option>
        </Select>
        <RangePicker
          format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']}
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
      </div>

      {/* Status Summary */}
      <div className="mb-4 flex gap-4">
        <Tag color="default">
          Nháp: {purchaseOrders.filter((po) => po.status === 'draft').length}
        </Tag>
        <Tag color="blue">
          Đã gửi: {purchaseOrders.filter((po) => po.status === 'sent').length}
        </Tag>
        <Tag color="cyan">
          Đã phê duyệt: {purchaseOrders.filter((po) => po.status === 'approved').length}
        </Tag>
        <Tag color="green">
          Đã nhận hàng: {purchaseOrders.filter((po) => po.status === 'received').length}
        </Tag>
        <Tag color="red">
          Đã hủy: {purchaseOrders.filter((po) => po.status === 'cancelled').length}
        </Tag>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        scroll={{ x: 1400 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} đơn mua hàng`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
      />
    </div>
  );
}
