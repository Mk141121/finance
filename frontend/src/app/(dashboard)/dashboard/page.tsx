'use client';

import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import {
  ShoppingCartOutlined,
  FileTextOutlined,
  InboxOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

export default function DashboardPage() {
  return (
    <div>
      <Title level={2}>Tổng quan</Title>
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn hàng"
              value={0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hóa đơn"
              value={0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tồn kho"
              value={0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={0}
              prefix={<DollarOutlined />}
              suffix="VND"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
