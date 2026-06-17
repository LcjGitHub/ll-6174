import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Layout,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { createCheck, fetchChecks, fetchItems } from './api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

/**
 * 格式化日期显示。
 * @param {string|null|undefined} value
 * @returns {string}
 */
function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

/**
 * 根据 status_tags 渲染高亮标签。
 * @param {('expired'|'check_due')[]} tags
 * @returns {import('react').ReactNode}
 */
function renderStatusTags(tags = []) {
  if (!tags.length) {
    return <Tag color="success">正常</Tag>;
  }
  return (
    <Space size={4} wrap>
      {tags.includes('expired') && <Tag color="error">已过期</Tag>}
      {tags.includes('check_due') && <Tag color="warning">待检查</Tag>}
    </Space>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [checks, setChecks] = useState([]);
  const [checksLoading, setChecksLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchItems();
      setItems(data);
    } catch {
      message.error('加载物品列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChecks = useCallback(async (itemId) => {
    setChecksLoading(true);
    try {
      const data = await fetchChecks(itemId);
      setChecks(data);
    } catch {
      message.error('加载检查记录失败');
    } finally {
      setChecksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (selectedItem) {
      loadChecks(selectedItem.id);
      form.setFieldsValue({
        check_date: dayjs(),
        next_check_date: selectedItem.next_check_date
          ? dayjs(selectedItem.next_check_date)
          : dayjs().add(90, 'day'),
        note: '',
      });
    }
  }, [selectedItem, loadChecks, form]);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '保质期',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 120,
      render: (value) => formatDate(value),
    },
    {
      title: '上次检查',
      dataIndex: 'last_check_date',
      key: 'last_check_date',
      width: 120,
      render: (value) => formatDate(value),
    },
    {
      title: '下次检查',
      dataIndex: 'next_check_date',
      key: 'next_check_date',
      width: 120,
      render: (value) => formatDate(value),
    },
    {
      title: '状态',
      dataIndex: 'status_tags',
      key: 'status_tags',
      width: 140,
      render: (tags) => renderStatusTags(tags),
    },
  ];

  /**
   * 提交检查记录。
   * @param {Object} values
   */
  async function handleSubmitCheck(values) {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await createCheck(selectedItem.id, {
        check_date: values.check_date.format('YYYY-MM-DD'),
        next_check_date: values.next_check_date
          ? values.next_check_date.format('YYYY-MM-DD')
          : undefined,
        note: values.note || undefined,
      });
      message.success('检查记录已保存');
      await loadItems();
      await loadChecks(selectedItem.id);
      form.setFieldValue('note', '');
    } catch {
      message.error('保存检查记录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1677ff', padding: '0 24px' }}>
        <Title level={3} style={{ color: '#fff', margin: '16px 0', lineHeight: 1.4 }}>
          家庭应急包清单
        </Title>
      </Header>
      <Content style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="物品清单" bordered={false}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={items}
                pagination={false}
                size="middle"
                rowClassName={(record) =>
                  record.status_tags?.length ? 'row-highlight' : ''
                }
                onRow={(record) => ({
                  onClick: () => setSelectedItem(record),
                  style: {
                    cursor: 'pointer',
                    background:
                      selectedItem?.id === record.id ? '#e6f4ff' : undefined,
                  },
                })}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title={selectedItem ? `检查记录 · ${selectedItem.name}` : '检查记录'}
              bordered={false}
            >
              {selectedItem ? (
                <>
                  <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                      当前状态：{renderStatusTags(selectedItem.status_tags)}
                    </Text>
                  </Space>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitCheck}
                    initialValues={{ check_date: dayjs() }}
                  >
                    <Form.Item
                      label="检查日期"
                      name="check_date"
                      rules={[{ required: true, message: '请选择检查日期' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="下次检查日" name="next_check_date">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="备注" name="note">
                      <Input.TextArea rows={3} placeholder="检查情况说明（可选）" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={submitting}>
                        提交检查
                      </Button>
                    </Form.Item>
                  </Form>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={checksLoading}
                    pagination={{ pageSize: 5, hideOnSinglePage: true }}
                    dataSource={checks}
                    columns={[
                      {
                        title: '检查日',
                        dataIndex: 'check_date',
                        render: (v) => formatDate(v),
                      },
                      {
                        title: '下次检查',
                        dataIndex: 'next_check_date',
                        render: (v) => formatDate(v),
                      },
                      {
                        title: '备注',
                        dataIndex: 'note',
                        ellipsis: true,
                        render: (v) => v || '—',
                      },
                    ]}
                  />
                </>
              ) : (
                <Text type="secondary">请在左侧表格中点击一条物品，填写检查记录。</Text>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
      <style>{`
        .row-highlight td {
          background: #fff7e6 !important;
        }
        .row-highlight:hover td {
          background: #ffe7ba !important;
        }
      `}</style>
    </Layout>
  );
}
