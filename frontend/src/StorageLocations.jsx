import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Tag,
  Typography,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from './api';

const { Title, Text } = Typography;

export default function StorageLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form] = Form.useForm();

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLocations();
      setLocations(data);
    } catch {
      message.error('加载存放位置列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    if (selectedLocation) {
      form.setFieldsValue({
        name: selectedLocation.name,
        room: selectedLocation.room,
        capacity_desc: selectedLocation.capacity_desc || '',
        current_count: selectedLocation.current_count,
      });
    }
  }, [selectedLocation, form]);

  function handleSelectLocation(location) {
    setIsCreating(false);
    setSelectedLocation(location);
  }

  function handleCreateNew() {
    setIsCreating(true);
    setSelectedLocation(null);
    form.resetFields();
    form.setFieldsValue({
      current_count: 0,
    });
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      if (isCreating) {
        await createLocation({
          name: values.name,
          room: values.room,
          capacity_desc: values.capacity_desc || '',
          current_count: values.current_count ?? 0,
        });
        message.success('新增存放位置成功');
      } else if (selectedLocation) {
        const updated = await updateLocation(selectedLocation.id, {
          name: values.name,
          room: values.room,
          capacity_desc: values.capacity_desc || '',
          current_count: values.current_count ?? 0,
        });
        message.success('保存修改成功');
        setSelectedLocation(updated);
      }
      await loadLocations();
      if (isCreating) {
        setIsCreating(false);
        form.resetFields();
      }
    } catch {
      message.error(isCreating ? '新增存放位置失败' : '保存修改失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(locationId) {
    setDeletingId(locationId);
    try {
      await deleteLocation(locationId);
      message.success('删除成功');
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(null);
        form.resetFields();
      }
      await loadLocations();
    } catch {
      message.error('删除失败');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Row gutter={[16, 16]} style={{ height: '100%' }}>
      <Col xs={24} lg={10} style={{ height: '100%' }}>
        <Card
          bordered={false}
          style={{ height: '100%' }}
          styles={{
            body: {
              height: '100%',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
            },
          }}
          title={
            <Space size={8}>
              <Text strong style={{ fontSize: 15 }}>
                位置列表
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {locations.length} 个位置
              </Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleCreateNew}
            >
              新增位置
            </Button>
          }
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {locations.map((loc) => (
              <Card
                key={loc.id}
                size="small"
                hoverable
                onClick={() => handleSelectLocation(loc)}
                style={{
                  cursor: 'pointer',
                  background:
                    selectedLocation?.id === loc.id
                      ? '#e6f4ff'
                      : undefined,
                  borderColor:
                    selectedLocation?.id === loc.id ? '#1677ff' : undefined,
                }}
                styles={{ body: { padding: 12 } }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <Space size={6}>
                      <EnvironmentOutlined
                        style={{ color: '#1677ff', fontSize: 14 }}
                      />
                      <Text strong style={{ fontSize: 15 }}>
                        {loc.name}
                      </Text>
                    </Space>
                    <Space size={8} wrap>
                      <Tag color="blue">{loc.room}</Tag>
                      <Tag color={loc.current_count > 0 ? 'green' : 'default'}>
                        已存 {loc.current_count} 件
                      </Tag>
                    </Space>
                    {loc.capacity_desc && (
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {loc.capacity_desc}
                      </Text>
                    )}
                  </Space>
                  <Popconfirm
                    title="确认删除该位置？"
                    description="删除后不可恢复"
                    okText="删除"
                    okType="danger"
                    cancelText="取消"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDelete(loc.id);
                    }}
                    onCancel={(e) => {
                      e?.stopPropagation();
                    }}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      loading={deletingId === loc.id}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginTop: -4 }}
                    />
                  </Popconfirm>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={14} style={{ height: '100%' }}>
        <Card
          title={
            isCreating
              ? '新增存放位置'
              : selectedLocation
              ? `编辑位置 · ${selectedLocation.name}`
              : '位置详情'
          }
          bordered={false}
          style={{ height: '100%' }}
          styles={{
            body: {
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              padding: 16,
            },
          }}
        >
          {selectedLocation || isCreating ? (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ current_count: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="位置名称"
                    name="name"
                    rules={[
                      { required: true, message: '请输入位置名称' },
                      { max: 100, message: '最多100个字符' },
                    ]}
                  >
                    <Input placeholder="请输入位置名称" maxLength={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="所在房间"
                    name="room"
                    rules={[
                      { required: true, message: '请输入所在房间' },
                      { max: 100, message: '最多100个字符' },
                    ]}
                  >
                    <Input placeholder="请输入所在房间" maxLength={100} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="容量描述"
                name="capacity_desc"
                rules={[{ max: 200, message: '最多200个字符' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="请描述该位置的容量、可存放的物品种类等（可选）"
                  maxLength={200}
                  showCount
                />
              </Form.Item>
              <Form.Item
                label="当前存放物品数量"
                name="current_count"
                rules={[{ required: true, message: '请输入物品数量' }]}
              >
                <InputNumber min={0} style={{ width: 200 }} placeholder="物品数量" />
              </Form.Item>

              {selectedLocation && (
                <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    创建时间：
                    {selectedLocation.created_at
                      ? new Date(selectedLocation.created_at).toLocaleString('zh-CN')
                      : '—'}
                  </Text>
                </Space>
              )}

              <Form.Item style={{ marginTop: 'auto', marginBottom: 0 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    {isCreating ? '创建位置' : '保存修改'}
                  </Button>
                  {isCreating && (
                    <Button
                      onClick={() => {
                        setIsCreating(false);
                        form.resetFields();
                      }}
                    >
                      取消
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Space direction="vertical" align="center">
                <EnvironmentOutlined
                  style={{ fontSize: 64, color: '#d9d9d9' }}
                />
                <Text type="secondary" style={{ fontSize: 14 }}>
                  请在左侧选择一个位置查看详情，或点击「新增位置」
                </Text>
              </Space>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
}
