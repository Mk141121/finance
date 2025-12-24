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
  Alert,
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  WarningOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface StockBalance {
  id: string;
  productId: string;
  productName: string;
  productSKU: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  costPerUnit: number;
  totalValue: number;
  batchNumber?: string;
  expiryDate?: string;
  lastUpdated: string;
}

export default function BalancesPage() {
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<StockBalance[]>([]);
  const [searchText, setSearchText] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    fetchWarehouses();
    fetchBalances();
  }, []);

  useEffect(() => {
    filterBalances();
  }, [searchText, warehouseFilter, stockFilter, balances]);

  const fetchWarehouses = async () => {
    try {
      const response = await apiClient.get('/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses');
    }
  };

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/inventory/balances');
      setBalances(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải tồn kho');
    } finally {
      setLoading(false);
    }
  };

  const filterBalances = () => {
    let filtered = [...balances];

    if (searchText) {
      filtered = filtered.filter(
        (b) =>
          b.productName.toLowerCase().includes(searchText.toLowerCase()) ||
          b.productSKU.toLowerCase().includes(searchText.toLowerCase()) ||
          b.batchNumber?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (warehouseFilter !== 'all') {
      filtered = filtered.filter((b) => b.warehouseId === warehouseFilter);
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter((b) => b.quantity < b.minStockLevel && b.quantity > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter((b) => b.quantity === 0);
    } else if (stockFilter === 'high') {
      filtered = filtered.filter((b) => b.quantity > b.maxStockLevel);
    } else if (stockFilter === 'expiring') {
      filtered = filtered.filter((b) => {
        if (!b.expiryDate) return false;
        const daysUntilExpiry = dayjs(b.expiryDate).diff(dayjs(), 'days');
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      });
    }

    setFilteredBalances(filtered);
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/inventory/balances/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stock_balances_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Xuất dữ liệu thành công');
    } catch (error: any) {
      message.error('Không thể xuất dữ liệu');
    }
  };

  const getStockStatus = (balance: StockBalance) => {
    if (balance.quantity === 0) {
      return { color: 'red', text: 'Hết hàng' };
    } else if (balance.quantity < balance.minStockLevel) {
      return { color: 'orange', text: 'Tồn thấp' };
    } else if (balance.quantity > balance.maxStockLevel) {
      return { color: 'blue', text: 'Tồn cao' };
    }
    return { color: 'green', text: 'Bình thường' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const columns: ColumnsType<StockBalance> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      fixed: 'left',
      render: (text: string, record: StockBalance) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-500">{record.productSKU}</div>
        </div>
      ),
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 150,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right',
      render: (qty: number, record: StockBalance) => (
        <Space>
          <strong>
            {qty.toLocaleString()} {record.unit}
          </strong>
          {qty < record.minStockLevel && <WarningOutlined style={{ color: '#ff4d4f' }} />}
        </Space>
      ),
    },
    {
      title: 'Min / Max',
      key: 'limits',
      width: 120,
      align: 'right',
      render: (_, record: StockBalance) => (
        <div className="text-xs text-gray-500">
          <div>Min: {record.minStockLevel}</div>
          <div>Max: {record.maxStockLevel}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record: StockBalance) => {
        const status = getStockStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
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
      title: 'Hạn sử dụng',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: (date?: string) => {
        if (!date) return '-';
        const expiryDate = dayjs(date);
        const daysUntilExpiry = expiryDate.diff(dayjs(), 'days');
        const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
        const isExpired = daysUntilExpiry < 0;

        return (
          <div>
            <div style={{ color: isExpired ? '#ff4d4f' : isExpiringSoon ? '#faad14' : undefined }}>
              {expiryDate.format('DD/MM/YYYY')}
            </div>
            {isExpiringSoon && !isExpired && (
              <div className="text-xs text-orange-500">Còn {daysUntilExpiry} ngày</div>
            )}
            {isExpired && <div className="text-xs text-red-500">Đã hết hạn</div>}
          </div>
        );
      },
    },
    {
      title: 'Giá vốn/ĐV',
      dataIndex: 'costPerUnit',
      key: 'costPerUnit',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Tổng giá trị',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 150,
      align: 'right',
      render: (value: number) => <strong>{formatCurrency(value)}</strong>,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  // Calculate summary stats
  const totalValue = filteredBalances.reduce((sum, b) => sum + b.totalValue, 0);
  const lowStockCount = balances.filter((b) => b.quantity < b.minStockLevel && b.quantity > 0).length;
  const outOfStockCount = balances.filter((b) => b.quantity === 0).length;
  const expiringCount = balances.filter((b) => {
    if (!b.expiryDate) return false;
    const daysUntilExpiry = dayjs(b.expiryDate).diff(dayjs(), 'days');
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <InboxOutlined className="mr-2" />
          Tồn kho theo sản phẩm & kho
        </Title>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          Xuất Excel
        </Button>
      </div>

      {/* Alerts */}
      <Space direction="vertical" className="mb-4 w-full">
        {outOfStockCount > 0 && (
          <Alert
            message={`${outOfStockCount} sản phẩm hết hàng`}
            type="error"
            showIcon
            icon={<WarningOutlined />}
          />
        )}
        {lowStockCount > 0 && (
          <Alert
            message={`${lowStockCount} sản phẩm tồn kho thấp`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        )}
        {expiringCount > 0 && (
          <Alert
            message={`${expiringCount} sản phẩm sắp hết hạn (trong 30 ngày)`}
            type="warning"
            showIcon
          />
        )}
      </Space>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Input
          placeholder="Tìm theo tên, SKU, số lô"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select value={warehouseFilter} onChange={setWarehouseFilter} style={{ width: 180 }}>
          <Option value="all">Tất cả kho</Option>
          {warehouses.map((w) => (
            <Option key={w.id} value={w.id}>
              {w.name}
            </Option>
          ))}
        </Select>
        <Select value={stockFilter} onChange={setStockFilter} style={{ width: 180 }}>
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="low">Tồn kho thấp</Option>
          <Option value="out">Hết hàng</Option>
          <Option value="high">Tồn kho cao</Option>
          <Option value="expiring">Sắp hết hạn</Option>
        </Select>
      </div>

      {/* Summary */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <Space size="large">
          <div>
            <div className="text-sm text-gray-500">Tổng giá trị tồn kho</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Tổng số mặt hàng</div>
            <div className="text-2xl font-bold">{filteredBalances.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Hết hàng</div>
            <div className="text-2xl font-bold text-red-500">{outOfStockCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Tồn thấp</div>
            <div className="text-2xl font-bold text-orange-500">{lowStockCount}</div>
          </div>
        </Space>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredBalances}
        rowKey="id"
        scroll={{ x: 1500 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} mặt hàng`,
          pageSizeOptions: ['20', '50', '100', '200'],
        }}
      />
    </div>
  );
}
