'use client';

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Tabs,
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Switch,
  InputNumber,
  Divider,
  Upload,
  Row,
  Col,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  UploadOutlined,
  BankOutlined,
  FileTextOutlined,
  DollarOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import apiClient from '@/lib/api-client';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CompanySettings {
  companyName: string;
  taxCode: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  legalRepresentative: string;
  logoUrl?: string;
}

interface TaxSettings {
  defaultVATRate: number;
  vatMethod: 'deduction' | 'direct';
  enableEInvoice: boolean;
  eInvoiceProvider?: string;
  eInvoiceUsername?: string;
  eInvoicePassword?: string;
}

interface InvoiceSettings {
  invoiceTemplate: string;
  invoicePrefix: string;
  invoiceStartNumber: number;
  enableDigitalSignature: boolean;
  signatureCertPath?: string;
  autoSendEmail: boolean;
}

interface SystemSettings {
  currency: string;
  language: string;
  dateFormat: string;
  fiscalYearStart: string;
  timezone: string;
  decimalPlaces: number;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [companyForm] = Form.useForm();
  const [taxForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [company, tax, invoice, system] = await Promise.all([
        apiClient.get('/settings/company'),
        apiClient.get('/settings/tax'),
        apiClient.get('/settings/invoice'),
        apiClient.get('/settings/system'),
      ]);

      companyForm.setFieldsValue(company.data);
      taxForm.setFieldsValue(tax.data);
      invoiceForm.setFieldsValue(invoice.data);
      systemForm.setFieldsValue(system.data);

      if (company.data.logoUrl) {
        setLogoFile([
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: company.data.logoUrl,
          },
        ]);
      }
    } catch (error: any) {
      message.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (values: CompanySettings) => {
    try {
      await apiClient.put('/settings/company', values);
      message.success('Lưu cài đặt công ty thành công');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu cài đặt');
    }
  };

  const handleSaveTax = async (values: TaxSettings) => {
    try {
      await apiClient.put('/settings/tax', values);
      message.success('Lưu cài đặt thuế thành công');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu cài đặt');
    }
  };

  const handleSaveInvoice = async (values: InvoiceSettings) => {
    try {
      await apiClient.put('/settings/invoice', values);
      message.success('Lưu cài đặt hóa đơn thành công');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu cài đặt');
    }
  };

  const handleSaveSystem = async (values: SystemSettings) => {
    try {
      await apiClient.put('/settings/system', values);
      message.success('Lưu cài đặt hệ thống thành công');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu cài đặt');
    }
  };

  const handleLogoUpload = async (file: any) => {
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await apiClient.post('/settings/company/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Tải logo thành công');
      return response.data.logoUrl;
    } catch (error) {
      message.error('Không thể tải logo');
      return false;
    }
  };

  const tabItems = [
    {
      key: 'company',
      label: (
        <span>
          <BankOutlined /> Công ty
        </span>
      ),
      children: (
        <Card>
          <Form form={companyForm} layout="vertical" onFinish={handleSaveCompany}>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Logo công ty">
                  <Upload
                    listType="picture-card"
                    fileList={logoFile}
                    beforeUpload={handleLogoUpload}
                    onRemove={() => setLogoFile([])}
                    maxCount={1}
                  >
                    {logoFile.length === 0 && (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>Tải logo</div>
                      </div>
                    )}
                  </Upload>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="companyName"
                  label="Tên công ty"
                  rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                >
                  <Input placeholder="Tên công ty" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="taxCode"
                  label="Mã số thuế"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mã số thuế' },
                    { pattern: /^\d{10,13}$/, message: 'MST phải là 10-13 chữ số' },
                  ]}
                >
                  <Input placeholder="Mã số thuế" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="legalRepresentative"
                  label="Người đại diện pháp luật"
                  rules={[{ required: true, message: 'Vui lòng nhập người đại diện' }]}
                >
                  <Input placeholder="Họ và tên" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="city" label="Thành phố">
                  <Select placeholder="Chọn thành phố">
                    <Option value="Hà Nội">Hà Nội</Option>
                    <Option value="Hồ Chí Minh">Hồ Chí Minh</Option>
                    <Option value="Đà Nẵng">Đà Nẵng</Option>
                    <Option value="Hải Phòng">Hải Phòng</Option>
                    <Option value="Cần Thơ">Cần Thơ</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="address" label="Địa chỉ">
                  <Input placeholder="Địa chỉ chi tiết" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[{ pattern: /^0\d{9}$/, message: 'SĐT không hợp lệ' }]}
                >
                  <Input placeholder="Số điện thoại" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
                  <Input placeholder="Email công ty" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="website" label="Website">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                Lưu cài đặt công ty
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'tax',
      label: (
        <span>
          <DollarOutlined /> Thuế
        </span>
      ),
      children: (
        <Card>
          <Form form={taxForm} layout="vertical" onFinish={handleSaveTax}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="defaultVATRate" label="Thuế suất VAT mặc định (%)">
                  <Select>
                    <Option value={0}>0%</Option>
                    <Option value={5}>5%</Option>
                    <Option value={10}>10%</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="vatMethod" label="Phương pháp tính VAT">
                  <Select>
                    <Option value="deduction">Khấu trừ</Option>
                    <Option value="direct">Trực tiếp</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Divider>Cài đặt hóa đơn điện tử</Divider>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="enableEInvoice"
                  label="Kích hoạt hóa đơn điện tử"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="eInvoiceProvider" label="Nhà cung cấp HĐĐT">
                  <Select placeholder="Chọn nhà cung cấp">
                    <Option value="vnpt">VNPT-Invoice</Option>
                    <Option value="viettel">Viettel-eInvoice</Option>
                    <Option value="mobifone">MobiFone-eInvoice</Option>
                    <Option value="fpt">FPT-eInvoice</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="eInvoiceUsername" label="Tên đăng nhập">
                  <Input placeholder="Username" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="eInvoicePassword" label="Mật khẩu">
                  <Input.Password placeholder="Password" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                Lưu cài đặt thuế
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'invoice',
      label: (
        <span>
          <FileTextOutlined /> Hóa đơn
        </span>
      ),
      children: (
        <Card>
          <Form form={invoiceForm} layout="vertical" onFinish={handleSaveInvoice}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="invoiceTemplate" label="Mẫu hóa đơn">
                  <Select>
                    <Option value="template1">Mẫu 1 - Cơ bản</Option>
                    <Option value="template2">Mẫu 2 - Chi tiết</Option>
                    <Option value="template3">Mẫu 3 - Quốc tế</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="invoicePrefix" label="Tiền tố số hóa đơn">
                  <Input placeholder="VD: INV" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="invoiceStartNumber" label="Số bắt đầu">
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="enableDigitalSignature"
                  label="Kích hoạt chữ ký số"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="signatureCertPath" label="Đường dẫn chứng thư số">
                  <Input placeholder="/path/to/certificate.pfx" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="autoSendEmail"
                  label="Tự động gửi email"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                Lưu cài đặt hóa đơn
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'system',
      label: (
        <span>
          <GlobalOutlined /> Hệ thống
        </span>
      ),
      children: (
        <Card>
          <Form form={systemForm} layout="vertical" onFinish={handleSaveSystem}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="currency" label="Đơn vị tiền tệ">
                  <Select>
                    <Option value="VND">VND - Việt Nam Đồng</Option>
                    <Option value="USD">USD - US Dollar</Option>
                    <Option value="EUR">EUR - Euro</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="language" label="Ngôn ngữ">
                  <Select>
                    <Option value="vi">Tiếng Việt</Option>
                    <Option value="en">English</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="dateFormat" label="Định dạng ngày">
                  <Select>
                    <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                    <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                    <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="fiscalYearStart" label="Năm tài chính bắt đầu">
                  <Select>
                    <Option value="01-01">01/01 (Tháng 1)</Option>
                    <Option value="04-01">01/04 (Tháng 4)</Option>
                    <Option value="07-01">01/07 (Tháng 7)</Option>
                    <Option value="10-01">01/10 (Tháng 10)</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="timezone" label="Múi giờ">
                  <Select>
                    <Option value="Asia/Ho_Chi_Minh">Giờ Việt Nam (GMT+7)</Option>
                    <Option value="Asia/Bangkok">Giờ Bangkok (GMT+7)</Option>
                    <Option value="Asia/Singapore">Giờ Singapore (GMT+8)</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="decimalPlaces" label="Số chữ số thập phân">
                  <Select>
                    <Option value={0}>0</Option>
                    <Option value={2}>2</Option>
                    <Option value={4}>4</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                Lưu cài đặt hệ thống
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Title level={2}>
          <SettingOutlined className="mr-2" />
          Cài đặt hệ thống
        </Title>
      </div>

      <Tabs defaultActiveKey="company" items={tabItems} size="large" />
    </div>
  );
}
