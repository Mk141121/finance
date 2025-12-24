'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          fontSize: 14,
        },
        components: {
          Layout: {
            headerBg: '#001529',
            headerColor: '#ffffff',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
