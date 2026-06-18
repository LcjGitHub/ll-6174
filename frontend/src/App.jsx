import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Layout,
  Tabs,
  Typography,
  message,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { fetchMedicines } from './api';
import EmergencyContacts from './EmergencyContacts';
import EmergencyDrills from './EmergencyDrills';
import MedicineLedger from './MedicineLedger';
import PurchasePlans from './PurchasePlans';
import StorageLocations from './StorageLocations';
import { filterItems } from './filterUtils';
import { exportInventoryList } from './exportUtils';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function App() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('medicine');

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

  const filteredMedicines = filterItems(medicines, {
    status: statusFilter,
    keyword: searchKeyword,
  });

  function handleExport() {
    if (activeTab !== 'medicine') {
      return;
    }
    const success = exportInventoryList(filteredMedicines);
    if (!success) {
      message.warning('暂无数据可导出');
    }
  }

  const tabItems = [
    {
      key: 'medicine',
      label: '药品台账',
      children: (
        <MedicineLedger
          medicines={medicines}
          setMedicines={setMedicines}
          loading={loading}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          filteredMedicines={filteredMedicines}
          loadMedicines={loadMedicines}
        />
      ),
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
      <Header style={{ background: '#1677ff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: '#fff', margin: 0, lineHeight: 1.4 }}>
          家庭药品台账
        </Title>
        <Button
          icon={<DownloadOutlined />}
          size="small"
          onClick={handleExport}
          disabled={activeTab !== 'medicine'}
        >
          导出清单
        </Button>
      </Header>
      <Content style={{ padding: '16px 24px', maxWidth: 1400, margin: '0 auto', width: '100%', height: 'calc(100vh - 64px)', boxSizing: 'border-box' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
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
