'use client';

import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SettingOutlined,
  ShoppingOutlined,
  UserOutlined,
  TeamOutlined,
  ShopOutlined,
  InboxOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  BulbOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useThemeStore } from '@/stores/theme.store';
import { useAuthStore } from '@/stores/auth.store';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      key: '/dashboard/products',
      icon: <ShoppingOutlined />,
      label: 'Sản phẩm',
    },
    {
      key: '/dashboard/customers',
      icon: <UserOutlined />,
      label: 'Khách hàng',
    },
    {
      key: '/dashboard/suppliers',
      icon: <ShopOutlined />,
      label: 'Nhà cung cấp',
    },
    {
      key: '/dashboard/inventory',
      icon: <InboxOutlined />,
      label: 'Kho vận',
    },
    {
      key: '/dashboard/employees',
      icon: <TeamOutlined />,
      label: 'Nhân sự',
    },
    {
      key: '/dashboard/invoices',
      icon: <FileTextOutlined />,
      label: 'Hóa đơn VAT',
    },
    {
      key: '/dashboard/accounting',
      icon: <CalculatorOutlined />,
      label: 'Kế toán',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Thông tin cá nhân',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Cài đặt',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme={theme === 'dark' ? 'dark' : 'light'}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}
      >
        <div className="p-4 text-center font-bold text-xl" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CalculatorOutlined style={{ fontSize: '24px', marginRight: collapsed ? 0 : '8px' }} />
          {!collapsed && <span>Kế toán</span>}
        </div>
        <Menu
          theme={theme === 'dark' ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header className="flex justify-between items-center px-6 bg-white dark:bg-gray-800" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space size="middle">
            <Button
              type="text"
              icon={<BulbOutlined />}
              onClick={toggleTheme}
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <span>{user?.fullName || 'User'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="m-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md" style={{ minHeight: 'calc(100vh - 128px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
