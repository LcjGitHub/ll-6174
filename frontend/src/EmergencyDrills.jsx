import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { createDrill, fetchDrills } from './api';

const { Title, Text } = Typography;

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

export default function EmergencyDrills() {
  const [drills, setDrills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadDrills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDrills();
      setDrills(data);
    } catch {
      message.error('加载演练记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrills();
  }, [loadDrills]);

  async function handleCreate(values) {
    setSubmitting(true);
    try {
      await createDrill({
        title: values.title,
        drill_date: values.drill_date.format('YYYY-MM-DD'),
        participant_count: values.participant_count,
        location: values.location || '',
        summary: values.summary || undefined,
      });
      message.success('演练记录已添加');
      form.resetFields();
      await loadDrills();
    } catch {
      message.error('添加演练记录失败');
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    {
      title: '演练主题',
      dataIndex: 'title',
      key: 'title',
      minWidth: 200,
      ellipsis: true,
    },
    {
      title: '演练日期',
      dataIndex: 'drill_date',
      key: 'drill_date',
      width: 120,
      render: (value) => formatDate(value),
    },
    {
      title: '参与人数',
      dataIndex: 'participant_count',
      key: 'participant_count',
      width: 100,
      render: (value) => `${value} 人`,
    },
    {
      title: '演练地点',
      dataIndex: 'location',
      key: 'location',
      width: 140,
      render: (value) => value || '—',
    },
    {
      title: '总结备注',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
      render: (value) => value || '—',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
              演练记录列表
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {drills.length} 条
            </Text>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={drills}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          size="small"
          style={{ flex: 1, minHeight: 0 }}
          scroll={{ x: 800, y: 'calc(100vh - 400px)' }}
        />
      </Card>

      <Card
        size="small"
        bordered={false}
        style={{ flexShrink: 0 }}
        styles={{ body: { padding: '12px 16px' } }}
        title={
          <Space size={8}>
            <Text strong style={{ fontSize: 15 }}>
              新增演练记录
            </Text>
          </Space>
        }
      >
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleCreate}
          initialValues={{ drill_date: dayjs(), participant_count: 1 }}
        >
          <Space wrap size={[12, 8]} style={{ width: '100%' }} align="center">
            <Form.Item
              name="title"
              rules={[{ required: true, message: '请输入演练主题' }]}
              style={{ marginBottom: 0, minWidth: 200 }}
            >
              <Input placeholder="演练主题" size="small" maxLength={200} />
            </Form.Item>
            <Form.Item
              name="drill_date"
              rules={[{ required: true, message: '请选择演练日期' }]}
              style={{ marginBottom: 0, minWidth: 150 }}
            >
              <DatePicker style={{ width: '100%' }} size="small" />
            </Form.Item>
            <Form.Item
              name="participant_count"
              rules={[{ required: true, message: '请输入参与人数' }]}
              style={{ marginBottom: 0, minWidth: 120 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} size="small" placeholder="参与人数" />
            </Form.Item>
            <Form.Item
              name="location"
              style={{ marginBottom: 0, minWidth: 150 }}
            >
              <Input placeholder="演练地点" size="small" maxLength={100} />
            </Form.Item>
            <Form.Item
              name="summary"
              style={{ marginBottom: 0, minWidth: 200 }}
            >
              <Input placeholder="总结备注（可选）" size="small" maxLength={500} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" size="small" htmlType="submit" loading={submitting}>
                添加
              </Button>
            </Form.Item>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
