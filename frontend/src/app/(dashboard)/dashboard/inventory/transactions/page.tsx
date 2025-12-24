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
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  SwapOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

type TransactionType = 'IN' | 'OUT' | 'ADJUST';

interface InventoryTransaction {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  transactionType: TransactionType;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  productSKU: string;
  quantity: number;
  unit: string;
  batchNumber?: string;
  serialNumber?: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<InventoryTransaction[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    fetchWarehouses();
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchText, typeFilter, warehouseFilter, dateRange, transactions]);

  const fetchWarehouses = async () => {
    try {
      const response = await apiClient.get('/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses');
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/inventory/transactions');
      setTransactions(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchText) {
      filtered = filtered.filter(
        (t) =>
          t.transactionNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          t.productName.toLowerCase().includes(searchText.toLowerCase()) ||
          t.productSKU.toLowerCase().includes(searchText.toLowerCase()) ||
          t.batchNumber?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.transactionType === typeFilter);
    }

    if (warehouseFilter !== 'all') {
      filtered = filtered.filter((t) => t.warehouseId === warehouseFilter);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((t) => {
        const txDate = dayjs(t.transactionDate);
        return txDate.isAfter(dateRange[0]) && txDate.isBefore(dateRange[1]);
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/inventory/transactions/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_transactions_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Xuất dữ liệu thành công');
    } catch (error: any) {
      message.error('Không thể xuất dữ liệu');
    }
  };

  const getTypeColor = (type: TransactionType) => {
    const colors: Record<TransactionType, string> = {
      IN: 'green',
      OUT: 'red',
      ADJUST: 'orange',
    };
    return colors[type];
  };

  const getTypeText = (type: TransactionType) => {
    const texts: Record<TransactionType, string> = {
      IN: 'Nhập kho',
      OUT: 'Xuất kho',
      ADJUST: 'Điều chỉnh',
    };
    return texts[type];
  };

  const getTypeIcon = (type: TransactionType) => {
    const icons: Record<TransactionType, React.ReactNode> = {
      IN: <ArrowDownOutlined />,
      OUT: <ArrowUpOutlined />,
      ADJUST: <SwapOutlined />,
    };
    return icons[type];
  };

  const columns: ColumnsType<InventoryTransaction> = [
    {
      title: 'Số GD',
      dataIndex: 'transactionNumber',
      key: 'transactionNumber',
      width: 150,
      fixed: 'left',
    },
    {
      title: 'Ngày GD',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Loại GD',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 120,
      render: (type: TransactionType) => (
        <Tag color={getTypeColor(type)} icon={getTypeIcon(type)}>
          {getTypeText(type)}
        </Tag>
      ),
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
      render: (text: string, record: InventoryTransaction) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-500">{record.productSKU}</div>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (qty: number, record: InventoryTransaction) => {
        const sign = record.transactionType === 'IN' ? '+' : '-';
        const color = record.transactionType === 'IN' ? '#52c41a' : '#ff4d4f';
        return (
          <span style={{ color, fontWeight: 'bold' }}>
            {sign}
            {qty.toLocaleString()} {record.unit}
          </span>
        );
      },
    },
    {
      title: 'Số lô',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
      render: (text?: string) => text || '-',
    },
    {
      title: 'Serial',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 150,
      render: (text?: string) => text || '-',
    },
    {
      title: 'Tham chiếu',
      key: 'reference',
      width: 150,
      render: (_, record: InventoryTransaction) => {
        if (!record.referenceNumber) return '-';
        return (
          <div>
            <div className="text-xs text-gray-500">{record.referenceType}</div>
            <div>{record.referenceNumber}</div>
          </div>
        );
      },
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (text?: string) => text || '-',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <SwapOutlined className="mr-2" />
          Lịch sử giao dịch kho
        </Title>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          Xuất Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Input
          placeholder="Tìm theo số GD, sản phẩm, SKU, số lô"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 150 }}>
          <Option value="all">Tất cả loại GD</Option>
          <Option value="IN">Nhập kho</Option>
          <Option value="OUT">Xuất kho</Option>
          <Option value="ADJUST">Điều chỉnh</Option>
        </Select>
        <Select value={warehouseFilter} onChange={setWarehouseFilter} style={{ width: 180 }}>
          <Option value="all">Tất cả kho</Option>
          {warehouses.map((w) => (
            <Option key={w.id} value={w.id}>
              {w.name}
            </Option>
          ))}
        </Select>
        <RangePicker
          format="DD/MM/YYYY"
          placeholder={['Từ ngày', 'Đến ngày']}
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
      </div>

      {/* Summary Stats */}
      <div className="mb-4 flex gap-4">
        <Tag color="green" icon={<ArrowDownOutlined />}>
          Nhập: {transactions.filter((t) => t.transactionType === 'IN').length}
        </Tag>
        <Tag color="red" icon={<ArrowUpOutlined />}>
          Xuất: {transactions.filter((t) => t.transactionType === 'OUT').length}
        </Tag>
        <Tag color="orange" icon={<SwapOutlined />}>
          Điều chỉnh: {transactions.filter((t) => t.transactionType === 'ADJUST').length}
        </Tag>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredTransactions}
        rowKey="id"
        scroll={{ x: 1600 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} giao dịch`,
          pageSizeOptions: ['20', '50', '100', '200'],
        }}
      />
    </div>
  );
}
