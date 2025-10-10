import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Card, Space, Divider, Tag, Switch, Tooltip, message } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
  ReloadOutlined,
} from '@ant-design/icons';
import { dataColors } from '../../utils/dataColors';

const API_BASE = 'https://api.lngmerch.co';
const DEFAULT_ANCHORS = [0, 4, 8, 12, 16, 20];

const AsyncOrderModal = ({ isModalOpen, setIsModalOpen }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [isAutoImportEnabled] = useState(true);

  const logsSinceRef = useRef(0);
  const logsTimerRef = useRef(null);

  // ------- helpers -------
  const appendActivityEntries = (entries = []) => {
    if (!entries.length) return;
    const toAppend = entries.map((it) => ({
      id: `${it.ts}-${Math.random()}`,
      timestamp: new Date(it.ts).toLocaleTimeString('vi-VN'),
      type: it.type === 'info' ? 'processing' : it.type,
      message: it.text,
    }));
    setLogs((prev) => [...prev, ...toAppend]);
    const last = entries[entries.length - 1];
    if (last?.ts) logsSinceRef.current = last.ts;
  };

  const mapOverallToUiStatus = (overall) => {
    switch (overall) {
      case 'success':
        return 'success';
      case 'running':
        return 'processing';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  };

  const getClientStatusIcon = (status) => {
    const iconStyle = { fontSize: 16 };
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'processing':
        return <SyncOutlined spin style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ ...iconStyle, color: '#d9d9d9' }} />;
    }
  };
  const getClientBorderColor = (s) =>
    s === 'success' ? '#52c41a' : s === 'processing' ? '#1890ff' : s === 'error' ? '#ff4d4f' : '#d9d9d9';
  const getLogColor = (t) => (t === 'success' ? '#52c41a' : t === 'error' ? '#ff4d4f' : t === 'processing' ? '#1890ff' : '#8c8c8c');
  const getStatusText = (s) => (s === 'idle' ? 'Pending' : s === 'processing' ? 'Processing' : s === 'success' ? 'Success' : 'Error');
  const getStatusColor = (s) =>
    s === 'success' ? dataColors.success : s === 'processing' ? dataColors.pending : s === 'error' ? dataColors.cancelled : 'default';

  // ------- API one-shot: Clients -------
  const fetchClientsOnce = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/shop/ext/clients`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr = await res.json();

      // KHÔNG lọc theo clientId nữa (backend không còn clientId)
      const mapped = (arr || []).map((c, idx) => {
        const id = c.id || c.label || `c-${idx}`; // backend đã trả id ổn định `${shopId}:${index}`
        const name = c.label || `Client ${idx + 1}`;
        const status = mapOverallToUiStatus(c?.statusSummary?.overall || 'idle');
        const lastSync = c?.statusSummary?.lastTs ? new Date(c.statusSummary.lastTs).toLocaleTimeString('vi-VN') : null;
        return { id, name, status, lastSync };
      });

      setClients(mapped);
    } catch (e) {
      console.log(e);
    }
  };

  // ------- Logs (DB) -------
  const loadTodayLogsFromDB = async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const url = new URL(`${API_BASE}/api/logs`, window.location.origin);
      url.searchParams.set('view', 'activity');
      url.searchParams.set('since', String(startOfDay));
      url.searchParams.set('limit', '500');
      const res = await fetch(url.toString().replace(window.location.origin, ''), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setLogs([]);
      appendActivityEntries(j?.entries || []);
    } catch {
      setLogs([]);
    }
  };

  const pollActivityLogs = async () => {
    try {
      const url = new URL(`${API_BASE}/api/logs`, window.location.origin);
      url.searchParams.set('view', 'activity');
      if (logsSinceRef.current) url.searchParams.set('since', String(logsSinceRef.current));
      url.searchParams.set('limit', '200');
      const res = await fetch(url.toString().replace(window.location.origin, ''), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const entries = j?.entries || [];
      if (entries.length) appendActivityEntries(entries);
    } catch {
      console.log('poll logs error');
    }
  };

  const handleRefreshLogs = async () => {
    try {
      setIsRefreshing(true);
      logsSinceRef.current = 0;
      setLogs([]);
      await loadTodayLogsFromDB();
      message.success('Đã tải lại log hôm nay');
    } catch (e) {
      message.error(e?.message || 'Không tải được logs');
    } finally {
      setIsRefreshing(false);
    }
  };

  // ------- lifecycle -------
  useEffect(() => {
    if (!isModalOpen) return;

    logsSinceRef.current = 0;
    fetchClientsOnce(); // chỉ gọi 1 lần khi mở
    loadTodayLogsFromDB(); // bootstrap logs hôm nay

    logsTimerRef.current = setInterval(pollActivityLogs, 10000); // chỉ poll logs
    return () => clearInterval(logsTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const scheduleSummary = `at ${DEFAULT_ANCHORS.map((h) => `${h}:00`).join(', ')}`;

  return (
    <Modal
      title={
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          <CloudDownloadOutlined style={{ marginRight: 8 }} />
          Async Orders
        </div>
      }
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      width={820}
      footer={[
        <Button key="close" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>,
        <Button key="refresh" type="primary" loading={isRefreshing} onClick={handleRefreshLogs} icon={<ReloadOutlined />}>
          Refresh Logs
        </Button>,
      ]}
    >
      {/* Clients Status (loaded once) */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Status Clients ({clients.length})</h3>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {clients.map((client) => (
            <Card
              key={client.id}
              size="small"
              style={{ borderLeft: `4px solid ${getClientBorderColor(client.status)}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  {getClientStatusIcon(client.status)}
                  <span style={{ fontWeight: 500 }}>{client.name}</span>
                </Space>
                <Space>
                  {client.lastSync && <span style={{ fontSize: 12, color: '#8c8c8c' }}>{client.lastSync}</span>}
                  <Tag color={getStatusColor(client.status)}>{getStatusText(client.status)}</Tag>
                </Space>
              </div>
            </Card>
          ))}
        </Space>
      </div>

      {/* Auto Import summary (fixed on extension) */}
      <Card style={{ background: '#e6f7ff', borderColor: '#91d5ff', marginBottom: 24 }} bodyStyle={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <ClockCircleFilled style={{ fontSize: 20, color: '#1890ff' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#262626' }}>Auto Import Orders</div>
              <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
                {isAutoImportEnabled ? `Running ${scheduleSummary}` : 'Inactive'}
              </div>
            </div>
          </Space>
          <Tooltip title="Bật/tắt auto ở trang Options của Extension">
            <Switch checked={isAutoImportEnabled} disabled />
          </Tooltip>
        </div>
      </Card>

      <Divider style={{ margin: '16px 0' }} />

      {/* Logs */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Activity Logs</h3>
        <div
          style={{
            background: '#fafafa',
            borderRadius: 8,
            padding: 16,
            maxHeight: 384,
            overflowY: 'auto',
            border: '1px solid #d9d9d9',
            fontFamily: 'monospace',
            fontSize: 14,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#bfbfbf', textAlign: 'center', padding: '32px 0' }}>No logs yet. Click “Refresh Logs”.</div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d9d9d9', marginTop: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>[{log.timestamp}]</span>
                    <span style={{ marginLeft: 8, color: getLogColor(log.type) }}>{log.message}</span>
                  </div>
                </div>
              ))}
            </Space>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AsyncOrderModal;
