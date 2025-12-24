'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, LoginRequest } from '@/lib/auth-service';
import { handleApiError } from '@/lib/api-client';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      await authService.login(values);
      message.success('Đăng nhập thành công!');
      router.push('/dashboard');
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Hệ thống Kế toán Doanh nghiệp
          </h1>
          <p className="text-gray-600 mt-2">Đăng nhập vào hệ thống</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Đăng nhập
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link href="/register" className="text-blue-600 hover:text-blue-800">
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="admin@example.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                block
                className="h-12 font-semibold text-base"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)' }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
            <div className="text-center text-gray-500 text-sm mt-4">
              <p>Tài khoản mặc định: <strong>admin@example.com</strong></p>
              <p>Mật khẩu: <strong>admin123</strong></p>
            </div>
          </Form>
        </Card>
      </div>
  );
}

export default function LoginPage() {
  return (
    <ThemeProvider>
      <App>
        <LoginForm />
      </App>
    </ThemeProvider>
  );
}
