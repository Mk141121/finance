'use client';

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Upload,
  Space,
  Divider,
  List,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  UploadOutlined,
  LockOutlined,
  HistoryOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title } = Typography;

interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  ipAddress: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [avatarFile, setAvatarFile] = useState<UploadFile[]>([]);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
    fetchActivities();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/auth/profile');
      setProfile(response.data);
      profileForm.setFieldsValue(response.data);

      if (response.data.avatarUrl) {
        setAvatarFile([
          {
            uid: '-1',
            name: 'avatar.png',
            status: 'done',
            url: response.data.avatarUrl,
          },
        ]);
      }
    } catch (error: any) {
      message.error('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await apiClient.get('/auth/activity-logs');
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities');
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      await apiClient.put('/auth/profile', values);
      message.success('Cập nhật thông tin thành công');
      fetchProfile();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
    }
  };

  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Đổi mật khẩu thành công');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
    }
  };

  const handleAvatarUpload = async (file: any) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await apiClient.post('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Tải ảnh đại diện thành công');
      fetchProfile();
      return response.data.avatarUrl;
    } catch (error) {
      message.error('Không thể tải ảnh đại diện');
      return false;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Title level={2}>
          <UserOutlined className="mr-2" />
          Thông tin cá nhân
        </Title>
      </div>

      <Row gutter={[16, 16]}>
        {/* Profile Information */}
        <Col xs={24} lg={16}>
          <Card title="Thông tin tài khoản" loading={loading}>
            <div className="flex items-center mb-6">
              <Avatar
                size={100}
                src={profile?.avatarUrl}
                icon={<UserOutlined />}
                className="mr-4"
              />
              <Space direction="vertical">
                <Upload
                  showUploadList={false}
                  beforeUpload={handleAvatarUpload}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>Đổi ảnh đại diện</Button>
                </Upload>
                <div className="text-sm text-gray-500">
                  JPG, PNG hoặc GIF (tối đa 2MB)
                </div>
              </Space>
            </div>

            <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="username" label="Tên đăng nhập">
                    <Input disabled />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[{ pattern: /^0\d{9}$/, message: 'SĐT không hợp lệ' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="position" label="Chức vụ">
                    <Input placeholder="Chức vụ" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="department" label="Phòng ban">
                    <Input placeholder="Phòng ban" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                  Lưu thông tin
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Change Password */}
          <Card title="Đổi mật khẩu" className="mt-4">
            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="currentPassword"
                    label="Mật khẩu hiện tại"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu hiện tại" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="newPassword"
                    label="Mật khẩu mới"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="confirmPassword"
                    label="Xác nhận mật khẩu"
                    rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<LockOutlined />} size="large">
                  Đổi mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Activity History */}
        <Col xs={24} lg={8}>
          <Card title={<span><HistoryOutlined className="mr-2" />Lịch sử hoạt động</span>}>
            <List
              dataSource={activities}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">{item.action}</Tag>
                        <span className="text-sm">{item.description}</span>
                      </Space>
                    }
                    description={
                      <div className="text-xs text-gray-500">
                        <div>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</div>
                        <div>IP: {item.ipAddress}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Chưa có hoạt động nào' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
