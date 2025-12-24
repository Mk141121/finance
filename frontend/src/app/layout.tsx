import type { Metadata } from 'next';
import AntdProvider from '@/components/providers/AntdProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hệ thống Kế toán Doanh nghiệp',
  description: 'Hệ thống quản lý kế toán doanh nghiệp Việt Nam',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
