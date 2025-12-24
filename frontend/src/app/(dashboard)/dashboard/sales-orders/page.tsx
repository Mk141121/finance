'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Table, Button, Space, Tag, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import { salesOrderService, SalesOrder } from '@/lib/sales-order-service';
import { handleApiError } from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function SalesOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const router = useRouter();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await salesOrderService.getAll();
      setOrders(data);
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await salesOrderService.delete(id);
      message.success('Xóa đơn hàng thành công');
      fetchOrders();
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      confirmed: 'blue',
      processing: 'orange',
      completed: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: 'Nháp',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  const columns: ColumnsType<SalesOrder> = [
    {
      title: 'Số đơn hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150,
    },
    {
      title: 'Ngày đơn hàng',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
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
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/dashboard/sales-orders/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => router.push(`/dashboard/sales-orders/${record.id}/edit`)}
            disabled={record.status !== 'draft'}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={record.status !== 'draft'}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Đơn hàng bán</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/dashboard/sales-orders/create')}
        >
          Tạo đơn hàng mới
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} đơn hàng`,
        }}
      />
    </div>
  );
}
