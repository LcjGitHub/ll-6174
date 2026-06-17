import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Layout,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { createRecord, fetchMedicines, fetchRecords } from './api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

function renderStatusTags(tags = []) {
  if (!tags.length) {
    return <Tag color="success">正常</Tag>;
  }
  return (
    <Space size={4} wrap>
      {tags.includes('expired') && <Tag color="error">已过期</Tag>}
      {tags.includes('check_due') && <Tag color="warning">待盘点</Tag>}
    </Space>
  );
}

export default function App() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMedicines();
      setMedicines(data);
    } catch {
      message.error('加载药品列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecords = useCallback(async (medicineId) => {
    setRecordsLoading(true);
    try {
      const data = await fetchRecords(medicineId);
      setRecords(data);
    } catch {
      message.error('加载盘点记录失败');
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  useEffect(() => {
    if (selectedMedicine) {
      loadRecords(selectedMedicine.id);
      form.setFieldsValue({
        check_date: dayjs(),
        quantity_checked: selectedMedicine.quantity,
        next_check_date: selectedMedicine.next_check_date
          ? dayjs(selectedMedicine.next_check_date)
          : dayjs().add(90, 'day'),
        note: '',
      });
    }
  }, [selectedMedicine, loadRecords, form]);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 140,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '有效期',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 120,
      render: (value) => formatDate(value),
    },
    {
      title: '上次盘点日',
      dataIndex: 'last_check_date',
      key: 'last_check_date',
      width: 120,
      render: (value) => formatDate(value),
    },
    {
      title: '下次盘点日',
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

  async function handleSubmitCheck(values) {
    if (!selectedMedicine) return;
    setSubmitting(true);
    try {
      await createRecord(selectedMedicine.id, {
        check_date: values.check_date.format('YYYY-MM-DD'),
        quantity_checked: values.quantity_checked,
        next_check_date: values.next_check_date
          ? values.next_check_date.format('YYYY-MM-DD')
          : undefined,
        note: values.note || undefined,
      });
      message.success('盘点记录已保存');
      await loadMedicines();
      await loadRecords(selectedMedicine.id);
      form.setFieldValue('note', '');
    } catch {
      message.error('保存盘点记录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1677ff', padding: '0 24px' }}>
        <Title level={3} style={{ color: '#fff', margin: '16px 0', lineHeight: 1.4 }}>
          家庭药品台账
        </Title>
      </Header>
      <Content style={{ padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <Card title="药品清单" bordered={false}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={medicines}
                pagination={false}
                size="middle"
                rowClassName={(record) =>
                  record.status_tags?.length ? 'row-highlight' : ''
                }
                onRow={(record) => ({
                  onClick: () => setSelectedMedicine(record),
                  style: {
                    cursor: 'pointer',
                    background:
                      selectedMedicine?.id === record.id ? '#e6f4ff' : undefined,
                  },
                })}
              />
            </Card>
          </Col>
          <Col xs={24} lg={9}>
            <Card
              title={selectedMedicine ? `盘点记录 · ${selectedMedicine.name}` : '盘点记录'}
              bordered={false}
            >
              {selectedMedicine ? (
                <>
                  <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
                    <Text type="secondary">
                      当前状态：{renderStatusTags(selectedMedicine.status_tags)}
                    </Text>
                    <Text type="secondary">
                      规格：{selectedMedicine.specification || '—'}
                    </Text>
                  </Space>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitCheck}
                    initialValues={{ check_date: dayjs() }}
                  >
                    <Form.Item
                      label="盘点日期"
                      name="check_date"
                      rules={[{ required: true, message: '请选择盘点日期' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      label="盘点数量"
                      name="quantity_checked"
                      rules={[{ required: true, message: '请输入盘点数量' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="下次盘点日" name="next_check_date">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="备注" name="note">
                      <Input.TextArea rows={3} placeholder="盘点情况说明（可选）" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={submitting}>
                        提交盘点
                      </Button>
                    </Form.Item>
                  </Form>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={recordsLoading}
                    pagination={{ pageSize: 5, hideOnSinglePage: true }}
                    dataSource={records}
                    columns={[
                      {
                        title: '盘点日',
                        dataIndex: 'check_date',
                        render: (v) => formatDate(v),
                      },
                      {
                        title: '数量',
                        dataIndex: 'quantity_checked',
                        width: 60,
                        render: (v) => (v != null ? v : '—'),
                      },
                      {
                        title: '下次盘点',
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
                <Text type="secondary">请在左侧表格中点击一种药品，填写盘点记录。</Text>
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
