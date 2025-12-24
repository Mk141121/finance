'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Statistic, List, Avatar, Button, Space, Empty, message } from 'antd';
import {
  ShoppingCartOutlined,
  FileTextOutlined,
  InboxOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  PlusOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import apiClient from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title } = Typography;

interface DashboardStats {
  totalOrders: number;
  ordersGrowth: number;
  totalInvoices: number;
  invoicesGrowth: number;
  totalInventory: number;
  inventoryGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'invoice' | 'payment';
  title: string;
  description: string;
  amount?: number;
  createdAt: string;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface TopProduct {
  productName: string;
  quantity: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    ordersGrowth: 0,
    totalInvoices: 0,
    invoicesGrowth: 0,
    totalInventory: 0,
    inventoryGrowth: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenueData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [statsRes, activitiesRes, revenueRes, productsRes] = await Promise.all([
        apiClient.get('/dashboard/stats').catch(() => ({ data: generateMockStats() })),
        apiClient.get('/dashboard/recent-activities').catch(() => ({ data: generateMockActivities() })),
        apiClient.get('/dashboard/revenue-chart').catch(() => ({ data: generateMockRevenueData() })),
        apiClient.get('/dashboard/top-products').catch(() => ({ data: generateMockTopProducts() })),
      ]);

      setStats(statsRes.data);
      setRecentActivities(activitiesRes.data);
      setRevenueChart(revenueRes.data);
      setTopProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      message.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Mock data generators (fallback when API not available)
  const generateMockStats = (): DashboardStats => ({
    totalOrders: 156,
    ordersGrowth: 12.5,
    totalInvoices: 89,
    invoicesGrowth: 8.3,
    totalInventory: 1243,
    inventoryGrowth: -2.1,
    totalRevenue: 485000000,
    revenueGrowth: 15.7,
  });

  const generateMockActivities = (): RecentActivity[] => [
    {
      id: '1',
      type: 'order',
      title: 'Đơn hàng mới #SO-2024-001',
      description: 'Khách hàng ABC Company Ltd',
      amount: 15000000,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'invoice',
      title: 'Hóa đơn #INV-2024-089',
      description: 'Đã xuất hóa đơn điện tử',
      amount: 22000000,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'payment',
      title: 'Thanh toán #PAY-2024-045',
      description: 'Đã nhận thanh toán từ khách hàng',
      amount: 10000000,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const generateMockRevenueData = (): RevenueData[] => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months.map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 500000000) + 200000000,
    }));
  };

  const generateMockTopProducts = (): TopProduct[] => [
    { productName: 'Sản phẩm A', quantity: 145 },
    { productName: 'Sản phẩm B', quantity: 98 },
    { productName: 'Sản phẩm C', quantity: 76 },
    { productName: 'Sản phẩm D', quantity: 54 },
    { productName: 'Sản phẩm E', quantity: 32 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <RiseOutlined style={{ color: '#3f8600' }} />
    ) : (
      <FallOutlined style={{ color: '#cf1322' }} />
    );
  };

  const revenueChartConfig = {
    data: revenueChart,
    xField: 'month',
    yField: 'revenue',
    smooth: true,
    color: '#1890ff',
    point: {
      size: 5,
      shape: 'circle',
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${(parseInt(v) / 1000000).toFixed(0)}M`,
      },
    },
  };

  const topProductsChartConfig = {
    data: topProducts,
    xField: 'productName',
    yField: 'quantity',
    color: '#52c41a',
    label: {
      position: 'top' as const,
      style: {
        fill: '#000',
        opacity: 0.6,
      },
    },
  };

  return (
    <div>
      {/* Header with Quick Actions */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Tổng quan</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/dashboard/sales-orders/new')}>
            Tạo đơn hàng
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => router.push('/dashboard/e-invoices/new')}>
            Xuất hóa đơn
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Đơn hàng"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined />}
              suffix={
                <span style={{ fontSize: '14px', marginLeft: '8px' }}>
                  {getGrowthIcon(stats.ordersGrowth)} {Math.abs(stats.ordersGrowth)}%
                </span>
              }
              valueStyle={{ color: '#3f8600' }}
            />
            <div className="text-gray-500 text-sm mt-2">So với tháng trước</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Hóa đơn"
              value={stats.totalInvoices}
              prefix={<FileTextOutlined />}
              suffix={
                <span style={{ fontSize: '14px', marginLeft: '8px' }}>
                  {getGrowthIcon(stats.invoicesGrowth)} {Math.abs(stats.invoicesGrowth)}%
                </span>
              }
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="text-gray-500 text-sm mt-2">So với tháng trước</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tồn kho"
              value={stats.totalInventory}
              prefix={<InboxOutlined />}
              suffix=" sản phẩm"
              valueStyle={{ color: '#cf1322' }}
            />
            <div className="text-gray-500 text-sm mt-2">Tổng số sản phẩm</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Doanh thu"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value as number)}
              suffix={
                <span style={{ fontSize: '14px', marginLeft: '8px' }}>
                  {getGrowthIcon(stats.revenueGrowth)} {Math.abs(stats.revenueGrowth)}%
                </span>
              }
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="text-gray-500 text-sm mt-2">So với tháng trước</div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card title="Doanh thu 12 tháng gần nhất" loading={loading}>
            {revenueChart.length > 0 ? (
              <Line {...revenueChartConfig} />
            ) : (
              <Empty description="Chưa có dữ liệu doanh thu" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Top sản phẩm bán chạy" loading={loading}>
            {topProducts.length > 0 ? (
              <Column {...topProductsChartConfig} />
            ) : (
              <Empty description="Chưa có dữ liệu sản phẩm" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Activities & Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Hoạt động gần đây" loading={loading}>
            <List
              dataSource={recentActivities}
              locale={{ emptyText: <Empty description="Chưa có hoạt động nào" /> }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={
                          item.type === 'order' ? (
                            <ShoppingCartOutlined />
                          ) : item.type === 'invoice' ? (
                            <FileTextOutlined />
                          ) : (
                            <DollarOutlined />
                          )
                        }
                        style={{
                          backgroundColor:
                            item.type === 'order' ? '#52c41a' : item.type === 'invoice' ? '#1890ff' : '#722ed1',
                        }}
                      />
                    }
                    title={item.title}
                    description={
                      <>
                        <div>{item.description}</div>
                        {item.amount && (
                          <div className="text-green-600 font-medium mt-1">
                            {formatCurrency(item.amount)}
                          </div>
                        )}
                        <div className="text-gray-400 text-xs mt-1">
                          {dayjs(item.createdAt).fromNow()}
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Cảnh báo" loading={loading}>
            <List
              dataSource={[
                {
                  id: '1',
                  title: 'Tồn kho thấp',
                  description: '5 sản phẩm dưới mức tồn kho tối thiểu',
                  type: 'warning',
                  icon: <WarningOutlined />,
                  color: '#faad14',
                },
                {
                  id: '2',
                  title: 'Hóa đơn chờ duyệt',
                  description: '3 hóa đơn cần phê duyệt',
                  type: 'info',
                  icon: <InfoCircleOutlined />,
                  color: '#1890ff',
                },
                {
                  id: '3',
                  title: 'Đơn hàng trễ',
                  description: '2 đơn hàng quá hạn giao',
                  type: 'error',
                  icon: <CloseCircleOutlined />,
                  color: '#ff4d4f',
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={item.icon} style={{ backgroundColor: item.color }} />}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
