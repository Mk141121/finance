'use client';

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Space,
  Table,
  Statistic,
  message,
  Tabs,
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Column, Line, Pie } from '@ant-design/plots';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SalesReport {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

interface PurchaseReport {
  period: string;
  amount: number;
  orders: number;
  suppliers: number;
}

interface InventoryReport {
  productName: string;
  sku: string;
  stockValue: number;
  quantity: number;
  unit: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'sales' | 'purchase' | 'inventory' | 'financial'>('sales');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [purchaseData, setPurchaseData] = useState<PurchaseReport[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryReport[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };

      if (reportType === 'sales') {
        const response = await apiClient.get('/reports/sales', { params });
        setSalesData(response.data);
      } else if (reportType === 'purchase') {
        const response = await apiClient.get('/reports/purchases', { params });
        setPurchaseData(response.data);
      } else if (reportType === 'inventory') {
        const response = await apiClient.get('/reports/inventory', { params });
        setInventoryData(response.data);
      }
    } catch (error: any) {
      message.error('Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await apiClient.get(`/reports/${reportType}/export`, {
        params: {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          format,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportType}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success(`Xuất báo cáo ${format.toUpperCase()} thành công`);
    } catch (error) {
      message.error('Không thể xuất báo cáo');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Sales Report Component
  const SalesReportView = () => {
    const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
    const totalCost = salesData.reduce((sum, item) => sum + item.cost, 0);
    const totalProfit = salesData.reduce((sum, item) => sum + item.profit, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);

    const revenueChartConfig = {
      data: salesData,
      xField: 'period',
      yField: 'revenue',
      label: {
        position: 'top' as const,
        formatter: (datum: any) => formatCurrency(datum.revenue),
      },
      xAxis: { label: { autoRotate: false } },
      smooth: true,
    };

    const profitChartConfig = {
      data: salesData,
      xField: 'period',
      yField: 'profit',
      seriesField: 'type',
      label: { position: 'top' as const },
      color: ['#52c41a'],
    };

    const columns: ColumnsType<SalesReport> = [
      { title: 'Kỳ', dataIndex: 'period', key: 'period' },
      {
        title: 'Doanh thu',
        dataIndex: 'revenue',
        key: 'revenue',
        align: 'right',
        render: (val) => formatCurrency(val),
      },
      {
        title: 'Giá vốn',
        dataIndex: 'cost',
        key: 'cost',
        align: 'right',
        render: (val) => formatCurrency(val),
      },
      {
        title: 'Lợi nhuận',
        dataIndex: 'profit',
        key: 'profit',
        align: 'right',
        render: (val) => <span style={{ color: val > 0 ? '#52c41a' : '#ff4d4f' }}>{formatCurrency(val)}</span>,
      },
      { title: 'Số đơn', dataIndex: 'orders', key: 'orders', align: 'right' },
    ];

    return (
      <div>
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng doanh thu"
                value={totalRevenue}
                formatter={(val) => formatCurrency(Number(val))}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng giá vốn"
                value={totalCost}
                formatter={(val) => formatCurrency(Number(val))}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Lợi nhuận"
                value={totalProfit}
                formatter={(val) => formatCurrency(Number(val))}
                valueStyle={{ color: totalProfit > 0 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Số đơn hàng"
                value={totalOrders}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="mb-6">
          <Col xs={24} lg={12}>
            <Card title="Biểu đồ doanh thu">
              <Line {...revenueChartConfig} height={300} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Biểu đồ lợi nhuận">
              <Column {...profitChartConfig} height={300} />
            </Card>
          </Col>
        </Row>

        <Card title="Chi tiết báo cáo bán hàng">
          <Table
            loading={loading}
            columns={columns}
            dataSource={salesData}
            rowKey="period"
            pagination={false}
          />
        </Card>
      </div>
    );
  };

  // Purchase Report Component
  const PurchaseReportView = () => {
    const totalAmount = purchaseData.reduce((sum, item) => sum + item.amount, 0);
    const totalOrders = purchaseData.reduce((sum, item) => sum + item.orders, 0);

    const chartConfig = {
      data: purchaseData,
      xField: 'period',
      yField: 'amount',
      label: {
        position: 'top' as const,
        formatter: (datum: any) => formatCurrency(datum.amount),
      },
    };

    const columns: ColumnsType<PurchaseReport> = [
      { title: 'Kỳ', dataIndex: 'period', key: 'period' },
      {
        title: 'Giá trị mua hàng',
        dataIndex: 'amount',
        key: 'amount',
        align: 'right',
        render: (val) => formatCurrency(val),
      },
      { title: 'Số đơn', dataIndex: 'orders', key: 'orders', align: 'right' },
      { title: 'Số NCC', dataIndex: 'suppliers', key: 'suppliers', align: 'right' },
    ];

    return (
      <div>
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Tổng giá trị mua hàng"
                value={totalAmount}
                formatter={(val) => formatCurrency(Number(val))}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Tổng số đơn" value={totalOrders} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Giá trị TB/đơn"
                value={totalOrders > 0 ? totalAmount / totalOrders : 0}
                formatter={(val) => formatCurrency(Number(val))}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Biểu đồ mua hàng" className="mb-6">
          <Column {...chartConfig} height={300} />
        </Card>

        <Card title="Chi tiết báo cáo mua hàng">
          <Table
            loading={loading}
            columns={columns}
            dataSource={purchaseData}
            rowKey="period"
            pagination={false}
          />
        </Card>
      </div>
    );
  };

  // Inventory Report Component
  const InventoryReportView = () => {
    const totalValue = inventoryData.reduce((sum, item) => sum + item.stockValue, 0);
    const totalItems = inventoryData.length;

    const topProducts = [...inventoryData]
      .sort((a, b) => b.stockValue - a.stockValue)
      .slice(0, 10);

    const pieConfig = {
      data: topProducts.map((item) => ({
        type: item.productName,
        value: item.stockValue,
      })),
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name} {percentage}',
      },
      interactions: [{ type: 'element-active' }],
    };

    const columns: ColumnsType<InventoryReport> = [
      {
        title: 'Sản phẩm',
        dataIndex: 'productName',
        key: 'productName',
        render: (text, record) => (
          <div>
            <div>{text}</div>
            <div className="text-xs text-gray-500">{record.sku}</div>
          </div>
        ),
      },
      {
        title: 'Tồn kho',
        dataIndex: 'quantity',
        key: 'quantity',
        align: 'right',
        render: (val, record) => `${val.toLocaleString()} ${record.unit}`,
      },
      {
        title: 'Giá trị tồn',
        dataIndex: 'stockValue',
        key: 'stockValue',
        align: 'right',
        render: (val) => formatCurrency(val),
      },
    ];

    return (
      <div>
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="Tổng giá trị tồn kho"
                value={totalValue}
                formatter={(val) => formatCurrency(Number(val))}
                valueStyle={{ color: '#1890ff' }}
                prefix={<InboxOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card>
              <Statistic title="Tổng số mặt hàng" value={totalItems} />
            </Card>
          </Col>
        </Row>

        <Card title="Top 10 sản phẩm theo giá trị tồn" className="mb-6">
          <Pie {...pieConfig} height={300} />
        </Card>

        <Card title="Chi tiết tồn kho">
          <Table
            loading={loading}
            columns={columns}
            dataSource={inventoryData}
            rowKey="sku"
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        </Card>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'sales',
      label: (
        <span>
          <ShoppingCartOutlined /> Báo cáo bán hàng
        </span>
      ),
      children: <SalesReportView />,
    },
    {
      key: 'purchase',
      label: (
        <span>
          <DollarOutlined /> Báo cáo mua hàng
        </span>
      ),
      children: <PurchaseReportView />,
    },
    {
      key: 'inventory',
      label: (
        <span>
          <InboxOutlined /> Báo cáo tồn kho
        </span>
      ),
      children: <InventoryReportView />,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <BarChartOutlined className="mr-2" />
          Báo cáo & Phân tích
        </Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            format="DD/MM/YYYY"
          />
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('excel')}>
            Xuất Excel
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => handleExport('pdf')}>
            Xuất PDF
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={reportType}
        onChange={(key) => setReportType(key as any)}
        items={tabItems}
        size="large"
      />
    </div>
  );
}
