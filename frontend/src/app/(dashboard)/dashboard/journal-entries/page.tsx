'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Table, Button, Space, Tag, message, Modal } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';
import { accountingService, JournalEntry } from '@/lib/accounting-service';
import { handleApiError } from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function JournalEntriesPage() {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const router = useRouter();

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await accountingService.getAllJournalEntries();
      setEntries(data);
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handlePost = async (id: string) => {
    Modal.confirm({
      title: 'Ghi sổ bút toán',
      content: 'Bạn có chắc muốn ghi sổ bút toán này? Bút toán sau khi ghi sổ sẽ không thể sửa.',
      onOk: async () => {
        try {
          await accountingService.postJournalEntry(id);
          message.success('Ghi sổ thành công');
          fetchEntries();
        } catch (error) {
          message.error(handleApiError(error));
        }
      },
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await accountingService.deleteJournalEntry(id);
      message.success('Xóa bút toán thành công');
      fetchEntries();
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      posted: 'green',
      reversed: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: 'Nháp',
      posted: 'Đã ghi sổ',
      reversed: 'Đã đảo',
    };
    return texts[status] || status;
  };

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      manual: 'Thủ công',
      auto_sales: 'Tự động (Bán hàng)',
      auto_purchase: 'Tự động (Mua hàng)',
      auto_inventory: 'Tự động (Kho)',
    };
    return texts[type] || type;
  };

  const columns: ColumnsType<JournalEntry> = [
    {
      title: 'Số bút toán',
      dataIndex: 'entryNumber',
      key: 'entryNumber',
      width: 130,
    },
    {
      title: 'Ngày bút toán',
      dataIndex: 'entryDate',
      key: 'entryDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Loại',
      dataIndex: 'entryType',
      key: 'entryType',
      width: 150,
      render: (type: string) => getTypeText(type),
    },
    {
      title: 'Diễn giải',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Nợ',
      dataIndex: 'totalDebit',
      key: 'totalDebit',
      width: 130,
      align: 'right',
      render: (amount: number) =>
        new Intl.NumberFormat('vi-VN').format(amount),
    },
    {
      title: 'Có',
      dataIndex: 'totalCredit',
      key: 'totalCredit',
      width: 130,
      align: 'right',
      render: (amount: number) =>
        new Intl.NumberFormat('vi-VN').format(amount),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
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
            onClick={() => router.push(`/dashboard/journal-entries/${record.id}`)}
          />
          {record.status === 'draft' && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handlePost(record.id)}
              >
                Ghi sổ
              </Button>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Bút toán kế toán</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/dashboard/journal-entries/create')}
        >
          Tạo bút toán mới
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} bút toán`,
        }}
      />
    </div>
  );
}
