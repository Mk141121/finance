'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Typography, Spin } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  InboxOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { authService } from '@/lib/auth-service';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: 'sales',
      icon: <ShoppingCartOutlined />,
      label: 'Bán hàng',
      children: [
        { key: '/dashboard/quotations', label: 'Báo giá' },
        { key: '/dashboard/sales-orders', label: 'Đơn hàng' },
      ],
    },
    {
      key: 'purchases',
      icon: <ShoppingOutlined />,
      label: 'Mua hàng',
      children: [
        { key: '/dashboard/purchase-orders', label: 'Đơn mua hàng' },
      ],
    },
    {
      key: 'inventory',
      icon: <InboxOutlined />,
      label: 'Kho hàng',
      children: [
        { key: '/dashboard/stock-transactions', label: 'Phiếu xuất nhập' },
        { key: '/dashboard/stock-balances', label: 'Tồn kho' },
      ],
    },
    {
      key: 'invoices',
      icon: <FileTextOutlined />,
      label: 'Hóa đơn điện tử',
      children: [
        { key: '/dashboard/e-invoices', label: 'Danh sách hóa đơn' },
      ],
    },
    {
      key: 'accounting',
      icon: <CalculatorOutlined />,
      label: 'Kế toán',
      children: [
        { key: '/dashboard/journal-entries', label: 'Bút toán' },
        { key: '/dashboard/chart-of-accounts', label: 'Hệ thống tài khoản' },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: () => authService.logout(),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
      >
        <div className="flex items-center justify-center h-16 bg-blue-600">
          <Text strong className="text-white text-lg">
            {collapsed ? 'KT' : 'Kế toán'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[window.location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) {
              router.push(key);
            }
          }}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                className: 'text-lg cursor-pointer hover:text-blue-600',
                onClick: () => setCollapsed(!collapsed),
              }
            )}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center cursor-pointer px-3 py-2">
              <Avatar icon={<UserOutlined />} className="bg-blue-600" />
              <div className="ml-3 hidden sm:block">
                <Text strong>
                  {user?.firstName} {user?.lastName}
                </Text>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content className="m-6 p-6 bg-white rounded-lg">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated()) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <ThemeProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ThemeProvider>
  );
}
