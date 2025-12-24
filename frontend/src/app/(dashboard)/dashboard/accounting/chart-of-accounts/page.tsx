'use client';

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Tree,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  AccountBookOutlined,
  FolderOutlined,
  FileOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import apiClient from '@/lib/api-client';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

interface Account {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  accountType: AccountType;
  parentId?: string;
  level: number;
  isGroup: boolean;
  balance: number;
  debitBalance: number;
  creditBalance: number;
  isActive: boolean;
  description?: string;
  children?: Account[];
}

export default function ChartOfAccountsPage() {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    buildTreeData();
  }, [accounts, searchText, typeFilter]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/accounting/chart-of-accounts');
      setAccounts(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể tải hệ thống tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = () => {
    let filtered = [...accounts];

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (a) =>
          a.code.toLowerCase().includes(searchText.toLowerCase()) ||
          a.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.accountType === typeFilter);
    }

    // Build tree structure
    const buildTree = (parentId?: string): DataNode[] => {
      return filtered
        .filter((a) => a.parentId === parentId)
        .map((account) => ({
          key: account.id,
          title: (
            <div
              className="flex justify-between items-center hover:bg-gray-50 p-2 -m-2 rounded cursor-pointer"
              onClick={() => setSelectedAccount(account)}
            >
              <Space>
                {account.isGroup ? <FolderOutlined /> : <FileOutlined />}
                <span className="font-medium">{account.code}</span>
                <span>{account.name}</span>
                {!account.isActive && <Tag color="red">Ngừng</Tag>}
              </Space>
              <span className="text-gray-500">
                {formatCurrency(account.balance)}
              </span>
            </div>
          ),
          children: buildTree(account.id),
          selectable: true,
        }));
    };

    setTreeData(buildTree());
  };

  const handleCreate = (parentAccount?: Account) => {
    setEditingAccount(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      isGroup: false,
      level: parentAccount ? parentAccount.level + 1 : 1,
      parentId: parentAccount?.id,
      accountType: parentAccount?.accountType || 'ASSET',
    });
    setModalVisible(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue(account);
    setModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingAccount) {
        await apiClient.put(`/accounting/chart-of-accounts/${editingAccount.id}`, values);
        message.success('Cập nhật tài khoản thành công');
      } else {
        await apiClient.post('/accounting/chart-of-accounts', values);
        message.success('Tạo tài khoản mới thành công');
      }
      setModalVisible(false);
      fetchAccounts();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể lưu tài khoản');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/accounting/chart-of-accounts/${id}`);
      message.success('Xóa tài khoản thành công');
      fetchAccounts();
      setSelectedAccount(null);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Không thể xóa tài khoản');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getTypeColor = (type: AccountType) => {
    const colors: Record<AccountType, string> = {
      ASSET: 'blue',
      LIABILITY: 'red',
      EQUITY: 'purple',
      REVENUE: 'green',
      EXPENSE: 'orange',
    };
    return colors[type];
  };

  const getTypeText = (type: AccountType) => {
    const texts: Record<AccountType, string> = {
      ASSET: 'Tài sản',
      LIABILITY: 'Nợ phải trả',
      EQUITY: 'Vốn chủ sở hữu',
      REVENUE: 'Doanh thu',
      EXPENSE: 'Chi phí',
    };
    return texts[type];
  };

  // Calculate summary by type
  const getSummary = () => {
    const summary: Record<AccountType, number> = {
      ASSET: 0,
      LIABILITY: 0,
      EQUITY: 0,
      REVENUE: 0,
      EXPENSE: 0,
    };

    accounts.forEach((acc) => {
      if (!acc.isGroup && acc.isActive) {
        summary[acc.accountType] += acc.balance;
      }
    });

    return summary;
  };

  const summary = getSummary();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>
          <AccountBookOutlined className="mr-2" />
          Hệ thống tài khoản (TT133/2016)
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleCreate()} size="large">
          Tạo tài khoản mới
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div className="text-sm text-gray-500">Tổng tài sản</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.ASSET)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div className="text-sm text-gray-500">Nợ phải trả</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.LIABILITY)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div className="text-sm text-gray-500">Vốn chủ sở hữu</div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.EQUITY)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div className="text-sm text-gray-500">Doanh thu</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.REVENUE)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div className="text-sm text-gray-500">Chi phí</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary.EXPENSE)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <div className="text-sm text-gray-500">Lợi nhuận</div>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.REVENUE - summary.EXPENSE)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Input
          placeholder="Tìm theo mã hoặc tên tài khoản"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 180 }}>
          <Option value="all">Tất cả loại TK</Option>
          <Option value="ASSET">Tài sản</Option>
          <Option value="LIABILITY">Nợ phải trả</Option>
          <Option value="EQUITY">Vốn chủ sở hữu</Option>
          <Option value="REVENUE">Doanh thu</Option>
          <Option value="EXPENSE">Chi phí</Option>
        </Select>
      </div>

      <Row gutter={16}>
        {/* Tree View */}
        <Col xs={24} lg={16}>
          <Card title="Cây tài khoản" loading={loading}>
            {treeData.length > 0 ? (
              <Tree
                treeData={treeData}
                defaultExpandAll
                showLine
                showIcon={false}
                height={600}
                style={{ overflow: 'auto' }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                Không tìm thấy tài khoản nào
              </div>
            )}
          </Card>
        </Col>

        {/* Account Details */}
        <Col xs={24} lg={8}>
          <Card title="Chi tiết tài khoản">
            {selectedAccount ? (
              <div>
                <Space direction="vertical" className="w-full" size="middle">
                  <div>
                    <div className="text-sm text-gray-500">Mã tài khoản</div>
                    <div className="text-lg font-bold">{selectedAccount.code}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Tên tài khoản</div>
                    <div className="font-medium">{selectedAccount.name}</div>
                    {selectedAccount.nameEn && (
                      <div className="text-sm text-gray-500">{selectedAccount.nameEn}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Loại tài khoản</div>
                    <Tag color={getTypeColor(selectedAccount.accountType)}>
                      {getTypeText(selectedAccount.accountType)}
                    </Tag>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Cấp độ</div>
                    <div>Cấp {selectedAccount.level}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Loại</div>
                    <Tag>{selectedAccount.isGroup ? 'Tài khoản tổng hợp' : 'Tài khoản chi tiết'}</Tag>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Số dư</div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(selectedAccount.balance)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Nợ: {formatCurrency(selectedAccount.debitBalance)} | Có:{' '}
                      {formatCurrency(selectedAccount.creditBalance)}
                    </div>
                  </div>

                  {selectedAccount.description && (
                    <div>
                      <div className="text-sm text-gray-500">Mô tả</div>
                      <div className="text-sm">{selectedAccount.description}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-gray-500">Trạng thái</div>
                    <Tag color={selectedAccount.isActive ? 'green' : 'red'}>
                      {selectedAccount.isActive ? 'Hoạt động' : 'Ngừng'}
                    </Tag>
                  </div>

                  <Space className="w-full">
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => handleCreate(selectedAccount)}
                      block
                    >
                      Thêm TK con
                    </Button>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(selectedAccount)}
                      type="primary"
                    >
                      Sửa
                    </Button>
                    <Popconfirm
                      title="Xóa tài khoản"
                      description="Bạn có chắc muốn xóa tài khoản này?"
                      onConfirm={() => handleDelete(selectedAccount.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Xóa
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Chọn một tài khoản để xem chi tiết
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Modal */}
      <Modal
        title={editingAccount ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label="Mã tài khoản"
              rules={[{ required: true, message: 'Vui lòng nhập mã tài khoản' }]}
            >
              <Input placeholder="VD: 111, 1111" />
            </Form.Item>

            <Form.Item
              name="accountType"
              label="Loại tài khoản"
              rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
            >
              <Select>
                <Option value="ASSET">Tài sản</Option>
                <Option value="LIABILITY">Nợ phải trả</Option>
                <Option value="EQUITY">Vốn chủ sở hữu</Option>
                <Option value="REVENUE">Doanh thu</Option>
                <Option value="EXPENSE">Chi phí</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên tài khoản (Tiếng Việt)"
              rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
            >
              <Input placeholder="Tên tài khoản" />
            </Form.Item>

            <Form.Item name="nameEn" label="Tên tài khoản (English)">
              <Input placeholder="Account name" />
            </Form.Item>

            <Form.Item name="level" label="Cấp độ">
              <InputNumber style={{ width: '100%' }} min={1} max={5} disabled />
            </Form.Item>

            <Form.Item name="isGroup" label="Loại" valuePropName="checked">
              <Select>
                <Option value={true}>Tài khoản tổng hợp</Option>
                <Option value={false}>Tài khoản chi tiết</Option>
              </Select>
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái">
              <Select>
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Ngừng</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả chi tiết về tài khoản" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
