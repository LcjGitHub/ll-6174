import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { createContact, deleteContact, fetchContacts, updateContact } from './api';

const { Title, Text } = Typography;

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const PHONE_VALIDATOR = {
  pattern: PHONE_REGEX,
  message: '请输入有效的大陆手机号码（11位，1开头）',
};

function renderNameWithPrimary(name, isPrimary) {
  return (
    <Space size={4}>
      <span>{name}</span>
      {isPrimary && (
        <Tag color="gold" icon={<StarFilled />}>
          首要
        </Tag>
      )}
    </Space>
  );
}

function renderPrimaryBadge(isPrimary) {
  return isPrimary ? (
    <Tag color="gold" icon={<StarFilled />}>
      首要联系人
    </Tag>
  ) : (
    <Tag icon={<StarOutlined />}>
      普通
    </Tag>
  );
}

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchContacts();
      setContacts(data);
    } catch {
      message.error('加载紧急联系人失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  async function handleCreate(values) {
    setSubmitting(true);
    try {
      await createContact({
        name: values.name,
        relationship: values.relationship,
        phone: values.phone,
        is_primary: values.is_primary || false,
        note: values.note || undefined,
      });
      message.success('联系人已添加');
      form.resetFields();
      await loadContacts();
    } catch {
      message.error('添加联系人失败');
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(contact) {
    setEditingId(contact.id);
    editForm.setFieldsValue({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      is_primary: contact.is_primary,
      note: contact.note || '',
    });
    setEditModalVisible(true);
  }

  async function handleEditSubmit(values) {
    if (!editingId) return;
    setSubmitting(true);
    try {
      await updateContact(editingId, {
        name: values.name,
        relationship: values.relationship,
        phone: values.phone,
        is_primary: values.is_primary,
        note: values.note || undefined,
      });
      message.success('联系人已更新');
      setEditModalVisible(false);
      setEditingId(null);
      editForm.resetFields();
      await loadContacts();
    } catch {
      message.error('更新联系人失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(contactId) {
    try {
      await deleteContact(contactId);
      message.success('联系人已删除');
      await loadContacts();
    } catch {
      message.error('删除联系人失败');
    }
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (value, record) => renderNameWithPrimary(value, record.is_primary),
    },
    {
      title: '关系',
      dataIndex: 'relationship',
      key: 'relationship',
      width: 120,
    },
    {
      title: '手机号码',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (value) => <a href={`tel:${value}`}>{value}</a>,
    },
    {
      title: '类型',
      dataIndex: 'is_primary',
      key: 'is_primary',
      width: 140,
      render: (value) => renderPrimaryBadge(value),
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (value) => value || '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除联系人「${record.name}」吗？此操作不可撤销。`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card
        size="small"
        bordered={false}
        style={{ flexShrink: 0 }}
        styles={{ body: { padding: '12px 16px' } }}
        title={
          <Space size={8}>
            <Text strong style={{ fontSize: 15 }}>
              新增联系人
            </Text>
          </Space>
        }
      >
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleCreate}
          initialValues={{ is_primary: false }}
        >
          <Space wrap size={[12, 8]} style={{ width: '100%' }} align="center">
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
              style={{ marginBottom: 0, minWidth: 150 }}
            >
              <Input placeholder="姓名" size="small" maxLength={50} />
            </Form.Item>
            <Form.Item
              name="relationship"
              rules={[{ required: true, message: '请输入与本人关系' }]}
              style={{ marginBottom: 0, minWidth: 150 }}
            >
              <Input placeholder="关系" size="small" maxLength={50} />
            </Form.Item>
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号码' },
                PHONE_VALIDATOR,
              ]}
              style={{ marginBottom: 0, minWidth: 170 }}
            >
              <Input placeholder="11位手机号" size="small" maxLength={11} />
            </Form.Item>
            <Form.Item
              name="note"
              style={{ marginBottom: 0, minWidth: 180 }}
            >
              <Input placeholder="备注（可选）" size="small" maxLength={200} />
            </Form.Item>
            <Form.Item
              name="is_primary"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>
                <Text type="warning" style={{ fontSize: 13 }}>
                  <Space size={4}>
                    <StarFilled />
                    首要联系人
                  </Space>
                </Text>
              </Checkbox>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" size="small" htmlType="submit" loading={submitting}>
                添加
              </Button>
            </Form.Item>
          </Space>
        </Form>
      </Card>

      <Card
        size="small"
        bordered={false}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: {
            padding: '8px 16px 12px',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        title={
          <Space size={8}>
            <Text strong style={{ fontSize: 15 }}>
              联系人列表
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {contacts.length} 位
            </Text>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={contacts}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          size="small"
          style={{ flex: 1, minHeight: 0 }}
          scroll={{ x: 800, y: 'calc(100vh - 300px)' }}
          rowClassName={(record) =>
            record.is_primary ? 'primary-contact-row' : ''
          }
        />
      </Card>

      <Modal
        title="编辑联系人"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingId(null);
          editForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            label="与本人关系"
            name="relationship"
            rules={[{ required: true, message: '请输入与本人关系' }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item
            label="手机号码"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号码' },
              PHONE_VALIDATOR,
            ]}
          >
            <Input maxLength={11} placeholder="11位手机号码" />
          </Form.Item>
          <Form.Item
            label="备注"
            name="note"
          >
            <Input.TextArea rows={3} maxLength={200} placeholder="备注信息（可选）" />
          </Form.Item>
          <Form.Item
            name="is_primary"
            valuePropName="checked"
          >
            <Checkbox>
              <Text type="warning">
                <Space size={4}>
                  <StarFilled />
                  设为首要联系人
                </Space>
              </Text>
            </Checkbox>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  setEditingId(null);
                  editForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                保存修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .primary-contact-row td {
          background: #fffbe6 !important;
        }
        .primary-contact-row:hover td {
          background: #fff1b8 !important;
        }
      `}</style>
    </div>
  );
}
