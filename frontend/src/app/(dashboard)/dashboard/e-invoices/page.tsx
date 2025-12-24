'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Table, Button, Space, Tag, message, Modal } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SendOutlined,
  FileTextOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import { eInvoiceService, EInvoice } from '@/lib/e-invoice-service';
import { handleApiError } from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function EInvoicesPage() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<EInvoice[]>([]);
  const router = useRouter();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await eInvoiceService.getAll();
      setInvoices(data);
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleIssue = async (id: string) => {
    Modal.confirm({
      title: 'Phát hành hóa đơn',
      content: 'Bạn có chắc muốn phát hành hóa đơn này? Hóa đơn sau khi phát hành sẽ không thể sửa.',
      onOk: async () => {
        try {
          await eInvoiceService.issue(id, {
            signerName: 'Giám đốc',
          });
          message.success('Phát hành hóa đơn thành công');
          fetchInvoices();
        } catch (error) {
          message.error(handleApiError(error));
        }
      },
    });
  };

  const handleSend = async (id: string) => {
    try {
      await eInvoiceService.send(id);
      message.success('Gửi hóa đơn thành công');
      fetchInvoices();
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  const handleDownloadXml = async (id: string, signed: boolean = false) => {
    try {
      const xml = await eInvoiceService.downloadXml(id, signed);
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${id}${signed ? '_signed' : ''}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      issued: 'blue',
      sent: 'green',
      signed: 'purple',
      cancelled: 'red',
      replaced: 'orange',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: 'Nháp',
      issued: 'Đã phát hành',
      sent: 'Đã gửi',
      signed: 'Đã ký',
      cancelled: 'Đã hủy',
      replaced: 'Đã thay thế',
    };
    return texts[status] || status;
  };

  const columns: ColumnsType<EInvoice> = [
    {
      title: 'Số hóa đơn',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 120,
      render: (_, record) => `${record.invoiceSeries}-${record.invoiceNumber}`,
    },
    {
      title: 'Ngày hóa đơn',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Mã số thuế',
      dataIndex: 'customerTaxCode',
      key: 'customerTaxCode',
      width: 130,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'invoiceStatus',
      key: 'invoiceStatus',
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
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/dashboard/e-invoices/${record.id}`)}
          />
          {record.invoiceStatus === 'draft' && (
            <Button
              type="text"
              icon={<FileTextOutlined />}
              onClick={() => handleIssue(record.id)}
            >
              Phát hành
            </Button>
          )}
          {record.invoiceStatus === 'issued' && (
            <Button
              type="text"
              icon={<SendOutlined />}
              onClick={() => handleSend(record.id)}
            >
              Gửi
            </Button>
          )}
          {['issued', 'sent', 'signed'].includes(record.invoiceStatus) && (
            <Button
              type="text"
              onClick={() => handleDownloadXml(record.id, true)}
            >
              XML
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Hóa đơn điện tử</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/dashboard/e-invoices/create')}
        >
          Tạo hóa đơn mới
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={invoices}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} hóa đơn`,
        }}
      />
    </div>
  );
}
