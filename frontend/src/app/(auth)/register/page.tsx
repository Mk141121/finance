'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService, RegisterRequest } from '@/lib/auth-service';
import { handleApiError } from '@/lib/api-client';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: RegisterRequest) => {
    setLoading(true);
    try {
      await authService.register(values);
      message.success('Đăng ký thành công!');
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
            Đăng ký tài khoản
          </h1>
          <p className="text-gray-600 mt-2">Tạo tài khoản mới</p>
        </div>

        <Form
          name="register"
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
              prefix={<MailOutlined />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="firstName"
            rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Họ"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Tên"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu"
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
              Đăng ký
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
