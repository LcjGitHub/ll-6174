import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  createMedicine,
  createRecord,
  deleteMedicine,
  fetchMedicines,
  updateMedicine,
} from './api';
import EmergencyContacts from './EmergencyContacts';
import EmergencyDrills from './EmergencyDrills';
import InspectionHistoryTable from './InspectionHistoryTable';
import PurchasePlans from './PurchasePlans';
import StorageLocations from './StorageLocations';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const CATEGORY_OPTIONS = [
  { value: '食品', label: '食品' },
  { value: '医疗', label: '医疗' },
  { value: '工具', label: '工具' },
  { value: '其他', label: '其他' },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: null, label: '全部分类' },
  ...CATEGORY_OPTIONS,
];

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
      {tags.includes('check_due') && <Tag color="warning">待检查</Tag>}
    </Space>
  );
}

function MedicineLedger() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm] = Form.useForm();
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      const data = await fetchMedicines(params);
      setMedicines(data);
    } catch {
      message.error('加载药品列表失败');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  useEffect(() => {
    if (selectedMedicine) {
      form.setFieldsValue({
        check_date: dayjs(),
        quantity_checked: selectedMedicine.quantity,
        next_check_date: selectedMedicine.next_check_date
          ? dayjs(selectedMedicine.next_check_date)
          : dayjs().add(90, 'day'),
        note: '',
      });
    }
  }, [selectedMedicine, form]);

  function handleCreateItem() {
    setEditingItemId(null);
    itemForm.resetFields();
    itemForm.setFieldsValue({
      quantity: 1,
      category: '其他',
    });
    setItemModalVisible(true);
  }

  function handleEditItem(record) {
    setEditingItemId(record.id);
    itemForm.setFieldsValue({
      name: record.name,
      quantity: record.quantity,
      category: record.category,
      expiry_date: record.expiry_date ? dayjs(record.expiry_date) : null,
      last_check_date: record.last_check_date ? dayjs(record.last_check_date) : null,
      next_check_date: record.next_check_date ? dayjs(record.next_check_date) : null,
    });
    setItemModalVisible(true);
  }

  async function handleItemSubmit(values) {
    setItemSubmitting(true);
    try {
      const payload = {
        name: values.name,
        quantity: values.quantity,
        category: values.category || '其他',
        expiry_date: values.expiry_date ? values.expiry_date.format('YYYY-MM-DD') : null,
        last_check_date: values.last_check_date ? values.last_check_date.format('YYYY-MM-DD') : null,
        next_check_date: values.next_check_date ? values.next_check_date.format('YYYY-MM-DD') : null,
      };
      if (editingItemId) {
        await updateMedicine(editingItemId, payload);
        message.success('物品已更新');
      } else {
        await createMedicine(payload);
        message.success('物品已添加');
      }
      setItemModalVisible(false);
      setEditingItemId(null);
      itemForm.resetFields();
      await loadMedicines();
      if (selectedMedicine) {
        const refreshed = await fetchMedicines();
        const current = refreshed.find((m) => m.id === selectedMedicine.id);
        if (current) {
          setSelectedMedicine(current);
        }
      }
    } catch {
      message.error(editingItemId ? '更新物品失败' : '添加物品失败');
    } finally {
      setItemSubmitting(false);
    }
  }

  async function handleDeleteItem(record) {
    try {
      await deleteMedicine(record.id);
      message.success('物品已删除');
      if (selectedMedicine?.id === record.id) {
        setSelectedMedicine(null);
      }
      await loadMedicines();
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch {
      message.error('删除物品失败');
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      minWidth: 100,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 56,
      render: (value) => value || '—',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 52,
    },
    {
      title: '保质期',
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      width: 80,
      render: (value) => formatDate(value),
    },
    {
      title: '上次检查日',
      dataIndex: 'last_check_date',
      key: 'last_check_date',
      width: 80,
      render: (value) => formatDate(value),
    },
    {
      title: '下次检查日',
      dataIndex: 'next_check_date',
      key: 'next_check_date',
      width: 80,
      render: (value) => formatDate(value),
    },
    {
      title: '状态',
      dataIndex: 'status_tags',
      key: 'status_tags',
      width: 72,
      render: (tags) => renderStatusTags(tags),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditItem(record);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除物品「${record.name}」吗？此操作不可撤销。`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteItem(record);
            }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
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
      message.success('检查记录已保存');
      await loadMedicines();
      const refreshed = await fetchMedicines();
      const current = refreshed.find((m) => m.id === selectedMedicine.id);
      if (current) {
        setSelectedMedicine(current);
      }
      form.setFieldValue('note', '');
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch {
      message.error('保存检查记录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Row gutter={[16, 16]} style={{ height: '100%' }}>
      <Col xs={24} lg={15} style={{ height: '100%' }}>
        <Card
          title="药品清单"
          bordered={false}
          styles={{ body: { height: '100%', padding: 16, display: 'flex', flexDirection: 'column' } }}
          style={{ height: '100%' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              flexShrink: 0,
              gap: 12,
            }}
          >
            <Space wrap size={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {medicines.length} 项
              </Text>
              <Select
                style={{ width: 130 }}
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={CATEGORY_FILTER_OPTIONS}
                placeholder="选择分类筛选"
                size="small"
                allowClear
              />
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateItem}
            >
              新增物品
            </Button>
          </div>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={medicines}
            pagination={false}
            size="middle"
            scroll={{ x: 620, y: 'calc(100vh - 260px)' }}
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
      <Col xs={24} lg={9} style={{ height: '100%' }}>
        <Card
          title={selectedMedicine ? `检查记录 · ${selectedMedicine.name}` : '检查记录'}
          bordered={false}
          style={{ height: '100%' }}
          styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: 16 } }}
        >
          {selectedMedicine ? (
            <div className="right-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <Space direction="vertical" size={4} style={{ marginBottom: 12, flexShrink: 0 }}>
                <Text type="secondary">
                  当前状态：{renderStatusTags(selectedMedicine.status_tags)}
                </Text>
                <Text type="secondary">
                  分类：{selectedMedicine.category || '—'}
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
                style={{ flexShrink: 0 }}
              >
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label="检查日期"
                      name="check_date"
                      rules={[{ required: true, message: '请选择检查日期' }]}
                    >
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="检查数量"
                      name="quantity_checked"
                      rules={[{ required: true, message: '请输入检查数量' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="下次检查日" name="next_check_date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="备注" name="note">
                  <Input.TextArea rows={2} placeholder="检查情况说明（可选）" />
                </Form.Item>
                <Form.Item style={{ marginBottom: 8 }}>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    提交检查
                  </Button>
                </Form.Item>
              </Form>
              <Divider style={{ margin: '8px 0', flexShrink: 0 }} />
              <div className="history-section" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <InspectionHistoryTable
                  medicines={medicines}
                  refreshTrigger={historyRefreshTrigger}
                />
              </div>
            </div>
          ) : (
            <Text type="secondary">请在左侧表格中点击一种药品，填写检查记录。</Text>
          )}
        </Card>
      </Col>

      <Modal
        title={editingItemId ? '编辑物品' : '新增物品'}
        open={itemModalVisible}
        onCancel={() => {
          setItemModalVisible(false);
          setEditingItemId(null);
          itemForm.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          form={itemForm}
          layout="vertical"
          onFinish={handleItemSubmit}
          style={{ marginTop: 16 }}
        >
          <Row gutter={12}>
            <Col xs={24} sm={14}>
              <Form.Item
                label="名称"
                name="name"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input maxLength={100} placeholder="请输入物品名称" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={10}>
              <Form.Item
                label="分类"
                name="category"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  style={{ width: '100%' }}
                  options={CATEGORY_OPTIONS}
                  placeholder="请选择分类"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={24}>
              <Form.Item
                label="数量"
                name="quantity"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="数量" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="保质期" name="expiry_date">
                <DatePicker style={{ width: '100%' }} placeholder="选择保质期（可选）" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="上次检查日" name="last_check_date">
                <DatePicker style={{ width: '100%' }} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="下次检查日" name="next_check_date">
                <DatePicker style={{ width: '100%' }} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setItemModalVisible(false);
                  setEditingItemId(null);
                  itemForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={itemSubmitting}>
                {editingItemId ? '保存修改' : '确认添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
}

export default function App() {
  const tabItems = [
    {
      key: 'medicine',
      label: '药品台账',
      children: <MedicineLedger />,
    },
    {
      key: 'contacts',
      label: '紧急联系人',
      children: <EmergencyContacts />,
    },
    {
      key: 'drills',
      label: '应急演练',
      children: <EmergencyDrills />,
    },
    {
      key: 'locations',
      label: '存放位置',
      children: <StorageLocations />,
    },
    {
      key: 'purchase-plans',
      label: '采购计划',
      children: <PurchasePlans />,
    },
  ];

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header style={{ background: '#1677ff', padding: '0 24px' }}>
        <Title level={3} style={{ color: '#fff', margin: '16px 0', lineHeight: 1.4 }}>
          家庭药品台账
        </Title>
      </Header>
      <Content style={{ padding: '16px 24px', maxWidth: 1400, margin: '0 auto', width: '100%', height: 'calc(100vh - 64px)', boxSizing: 'border-box' }}>
        <Tabs
          defaultActiveKey="medicine"
          items={tabItems}
          size="large"
          style={{ height: '100%' }}
        />
      </Content>
      <style>{`
        .row-highlight td {
          background: #fff7e6 !important;
        }
        .row-highlight:hover td {
          background: #ffe7ba !important;
        }
        .ant-tabs-content-holder {
          height: calc(100% - 46px);
        }
        .ant-tabs-content {
          height: 100%;
        }
        .ant-tabs-tabpane {
          height: 100%;
        }
      `}</style>
    </Layout>
  );
}
