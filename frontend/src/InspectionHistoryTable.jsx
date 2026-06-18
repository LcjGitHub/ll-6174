import { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, Space, Table, Tooltip, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { fetchAllRecords } from './api';

const { Text } = Typography;

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

const DEFAULT_LIMIT = 20;

export default function InspectionHistoryTable({ medicines, refreshTrigger }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);

  const medicineOptions = useMemo(() => {
    const options = [{ value: null, label: '全部物品' }];
    medicines.forEach((m) => {
      options.push({ value: m.id, label: m.name });
    });
    return options;
  }, [medicines]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: DEFAULT_LIMIT };
      if (selectedMedicineId != null) {
        params.medicine_id = selectedMedicineId;
      }
      const data = await fetchAllRecords(params);
      setRecords(data);
    } catch {
      message.error('加载检查历史失败');
    } finally {
      setLoading(false);
    }
  }, [selectedMedicineId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (refreshTrigger) {
      loadHistory();
    }
  }, [refreshTrigger, loadHistory]);

  const columns = [
    {
      title: '物品名称',
      dataIndex: 'medicine_name',
      key: 'medicine_name',
      minWidth: 150,
      ellipsis: true,
    },
    {
      title: '检查日期',
      dataIndex: 'check_date',
      key: 'check_date',
      width: 120,
      render: (value) => formatDate(value),
    },
    {
      title: '备注',
      dataIndex: 'note',
      key: 'note',
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Space style={{ marginBottom: 12, flexShrink: 0 }}>
        <Text strong style={{ fontSize: 15 }}>检查历史</Text>
        <Select
          style={{ width: 180 }}
          value={selectedMedicineId}
          onChange={setSelectedMedicineId}
          options={medicineOptions}
          placeholder="选择物品筛选"
          size="small"
          allowClear
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          共 {records.length} 条 · 最近 {DEFAULT_LIMIT} 条
        </Text>
      </Space>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={records}
          pagination={false}
          size="small"
          scroll={{ y: 'calc(100% - 40px)' }}
        />
      </div>
    </div>
  );
}
