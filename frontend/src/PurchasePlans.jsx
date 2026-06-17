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
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import {
  createPurchasePlan,
  fetchPurchasePlans,
  markPurchasePlanCompleted,
} from './api';

const { Text } = Typography;

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

function formatCurrency(value) {
  return value != null ? `¥${Number(value).toFixed(2)}` : '—';
}

export default function PurchasePlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [tableScrollY, setTableScrollY] = useState(400);
  const [form] = Form.useForm();
  const tableContainerRef = useRef(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPurchasePlans();
      setPlans(data);
    } catch {
      message.error('加载采购计划失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const updateTableHeight = useCallback(() => {
    if (tableContainerRef.current) {
      const containerHeight = tableContainerRef.current.clientHeight;
      const paginationHeight = 40;
      setTableScrollY(Math.max(330, containerHeight - paginationHeight));
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
      await createPurchasePlan({
        item_name: values.item_name,
        planned_quantity: values.planned_quantity,
        estimated_unit_price: values.estimated_unit_price,
        planned_purchase_date: values.planned_purchase_date.format('YYYY-MM-DD'),
      });
      message.success('采购计划已添加');
      form.resetFields();
      await loadPlans();
    } catch {
      message.error('添加采购计划失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkCompleted(planId) {
    setMarkingId(planId);
    try {
      await markPurchasePlanCompleted(planId);
      message.success('已标记为完成');
      await loadPlans();
    } catch {
      message.error('标记完成失败');
    } finally {
      setMarkingId(null);
    }
  }

  const totalEstimated = plans.reduce(
    (sum, p) => sum + Number(p.estimated_unit_price) * Number(p.planned_quantity),
    0
  );
  const pendingCount = plans.filter((p) => !p.is_completed).length;
  const completedCount = plans.filter((p) => p.is_completed).length;

  const columns = [
    {
      title: '物品名称',
      dataIndex: 'item_name',
      key: 'item_name',
      minWidth: 180,
      ellipsis: true,
    },
    {
      title: '计划数量',
      dataIndex: 'planned_quantity',
      key: 'planned_quantity',
      width: 100,
      render: (value, record) => {
        const unit = record.item_name?.includes('箱') ? '箱' : '件';
        return `${value} ${unit}`;
      },
    },
    {
      title: '预估单价',
      dataIndex: 'estimated_unit_price',
      key: 'estimated_unit_price',
      width: 110,
      render: (value) => formatCurrency(value),
    },
    {
      title: '预估总价',
      key: 'estimated_total',
      width: 120,
      render: (_, record) =>
        formatCurrency(
          Number(record.estimated_unit_price) * Number(record.planned_quantity)
        ),
    },
    {
      title: '计划采购日期',
      dataIndex: 'planned_purchase_date',
      key: 'planned_purchase_date',
      width: 140,
      render: (value) => formatDate(value),
    },
    {
      title: '状态',
      dataIndex: 'is_completed',
      key: 'is_completed',
      width: 100,
      render: (isCompleted) =>
        isCompleted ? (
          <Tag color="success">已完成</Tag>
        ) : (
          <Tag color="orange">待办</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          disabled={record.is_completed}
          loading={markingId === record.id}
          onClick={() => handleMarkCompleted(record.id)}
        >
          标记完成
        </Button>
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
        style={{ flexShrink: 0 }}
        styles={{ body: { padding: '10px 16px 6px' } }}
        title={
          <Space size={8}>
            <Text strong style={{ fontSize: 15 }}>
              新增采购计划
            </Text>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{
            planned_purchase_date: dayjs().add(3, 'day'),
            planned_quantity: 1,
            estimated_unit_price: 1,
          }}
        >
          <Row gutter={12}>
            <Col xs={24} sm={12} md={7}>
              <Form.Item
                label="物品名称"
                name="item_name"
                rules={[{ required: true, message: '请输入物品名称' }]}
                style={{ marginBottom: 6 }}
              >
                <Input placeholder="请输入物品名称" maxLength={200} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                label="计划数量"
                name="planned_quantity"
                rules={[{ required: true, message: '请输入数量' }]}
                style={{ marginBottom: 6 }}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="数量" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item
                label="预估单价(元)"
                name="estimated_unit_price"
                rules={[
                  { required: true, message: '请输入预估单价' },
                  { type: 'number', exclusiveMin: true, min: 0, message: '预估单价必须大于零' },
                ]}
                style={{ marginBottom: 6 }}
              >
                <InputNumber
                  min={0.01}
                  step={0.1}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="单价"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item
                label="计划采购日期"
                name="planned_purchase_date"
                rules={[{ required: true, message: '请选择采购日期' }]}
                style={{ marginBottom: 6 }}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label=" " colon={false} style={{ marginBottom: 6 }}>
                <Button type="primary" htmlType="submit" loading={submitting} block>
                  添加计划
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        size="small"
        bordered={false}
        style={{
          flex: 1,
          minHeight: 480,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
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
          <Space size={16} wrap>
            <Text strong style={{ fontSize: 15 }}>
              采购清单
            </Text>
            <Space size={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {plans.length} 条
              </Text>
              <Tag color="orange" style={{ margin: 0 }}>
                待办 {pendingCount}
              </Tag>
              <Tag color="success" style={{ margin: 0 }}>
                完成 {completedCount}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                预估总价：<Text strong>{formatCurrency(totalEstimated)}</Text>
              </Text>
            </Space>
          </Space>
        }
      >
        <div
          ref={tableContainerRef}
          style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
        >
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={plans}
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            size="small"
            style={{ height: '100%' }}
            scroll={{ x: 900, y: tableScrollY }}
            rowClassName={(record) => (record.is_completed ? 'row-completed' : '')}
          />
        </div>
      </Card>

      <style>{`
        .row-completed td {
          color: #bfbfbf !important;
          background: #fafafa !important;
        }
        .row-completed td .ant-tag {
          opacity: 0.8;
        }
        .row-completed:hover td {
          background: #f5f5f5 !important;
        }
      `}</style>
    </div>
  );
}
