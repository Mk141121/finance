'use client';

import { ConfigProvider, theme as antdTheme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useThemeStore } from '@/stores/theme.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
