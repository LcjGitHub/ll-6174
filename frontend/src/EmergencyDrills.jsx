import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Space,
  Table,
  Tooltip,
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
  const [tableScrollY, setTableScrollY] = useState(300);
  const [form] = Form.useForm();
  const tableContainerRef = useRef(null);

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

  const updateTableHeight = useCallback(() => {
    if (tableContainerRef.current) {
      const containerHeight = tableContainerRef.current.clientHeight;
      const paginationHeight = 40;
      setTableScrollY(Math.max(150, containerHeight - paginationHeight));
    }
  }, []);

  useEffect(() => {
    updateTableHeight();
    window.addEventListener('resize', updateTableHeight);
    const timer = setTimeout(updateTableHeight, 100);
    return () => {
      window.removeEventListener('resize', updateTableHeight);
      clearTimeout(timer);
    };
  }, [updateTableHeight]);

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
      render: (value) =>
        value ? (
          <Tooltip title={value} placement="topLeft">
            <span>{value}</span>
          </Tooltip>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
      }}
    >
      <Card
        size="small"
        bordered={false}
        style={{ flex: 1, minHeight: 220, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        styles={{
          body: {
            padding: '8px 16px 12px',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
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
        <div ref={tableContainerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={drills}
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            size="small"
            style={{ height: '100%' }}
            scroll={{ x: 800, y: tableScrollY }}
          />
        </div>
      </Card>

      <Card
        size="small"
        bordered={false}
        style={{ flexShrink: 0 }}
        styles={{ body: { padding: '10px 16px 6px' } }}
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
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ drill_date: dayjs(), participant_count: 1 }}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="演练主题"
                name="title"
                rules={[{ required: true, message: '请输入演练主题' }]}
                style={{ marginBottom: 6 }}
              >
                <Input placeholder="请输入演练主题" maxLength={200} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                label="演练日期"
                name="drill_date"
                rules={[{ required: true, message: '请选择演练日期' }]}
                style={{ marginBottom: 6 }}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={3}>
              <Form.Item
                label="参与人数"
                name="participant_count"
                rules={[{ required: true, message: '请输入参与人数' }]}
                style={{ marginBottom: 6 }}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="参与人数" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item
                label="演练地点"
                name="location"
                style={{ marginBottom: 6 }}
              >
                <Input placeholder="请输入演练地点" maxLength={100} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                label="总结备注"
                name="summary"
                style={{ marginBottom: 6 }}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="请输入总结备注（可选）"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={2}>
              <Form.Item label=" " colon={false} style={{ marginBottom: 6 }}>
                <Button type="primary" htmlType="submit" loading={submitting} block>
                  添加
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
