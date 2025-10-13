import React, { useEffect, useState } from 'react';
import { Modal, Button, Card, Space, Divider, Tag, Switch, Tooltip, message } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
  ReloadOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { dataColors } from '../../utils/dataColors';

const API_BASE = 'https://api.lngmerch.co';
const DEFAULT_ANCHORS = [0, 4, 8, 12, 16, 20];

const statusColor = (s) => {
  if (!s) return 'default';
  if (s === 'success') return 'success';
  if (s === 'fail' || s === 'error') return 'error';
  if (s === 'processing' || s === 'running') return 'processing';
  return 'default';
};
const phaseLabel = (t) => (t === 'import' ? 'Import New' : t === 'report' ? 'Report All' : t === 'ads' ? 'Ads Spend' : t || 'Unknown');
const TriggerTag = ({ type }) => {
  const upper = String(type || '').toUpperCase();
  const isAuto = upper === 'AUTO';
  const color = isAuto ? 'blue' : 'purple';
  const Icon = isAuto ? RobotOutlined : ThunderboltOutlined;
  return (
    <Tag color={color} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon />
      {upper || 'UNKNOWN'}
    </Tag>
  );
};

const AsyncOrderModal = ({ isModalOpen, setIsModalOpen }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState([]); // [{id, ts, timeText, type, phases[], shopName, error, ms}]
  const [clients, setClients] = useState([]); // load 1 lần khi mở
  const [isAutoImportEnabled] = useState(true);

  // ===== helpers: clients =====
  const mapOverallToUiStatus = (s) => (s === 'success' ? 'success' : s === 'running' ? 'processing' : s === 'error' ? 'error' : 'idle');
  const getClientStatusIcon = (s) => {
    const iconStyle = { fontSize: 16 };
    if (s === 'success') return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
    if (s === 'processing') return <SyncOutlined spin style={{ ...iconStyle, color: '#1890ff' }} />;
    if (s === 'error') return <CloseCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
    return <ClockCircleOutlined style={{ ...iconStyle, color: '#d9d9d9' }} />;
  };
  const getClientBorderColor = (s) =>
    s === 'success' ? '#52c41a' : s === 'processing' ? '#1890ff' : s === 'error' ? '#ff4d4f' : '#d9d9d9';
  const getStatusText = (s) => (s === 'idle' ? 'Pending' : s === 'processing' ? 'Processing' : s === 'success' ? 'Success' : 'Error');
  const getStatusColor = (s) =>
    s === 'success' ? dataColors.success : s === 'processing' ? dataColors.pending : s === 'error' ? dataColors.cancelled : 'default';

  // ===== one-shot: clients =====
  const fetchClientsOnce = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/shop/ext/clients`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr = await res.json();
      const mapped = (arr || []).map((c, idx) => {
        const id = c.id || c.label || `c-${idx}`;
        const name = `${c.label} (${c.shopName})`;
        const status = mapOverallToUiStatus(c?.statusSummary?.overall || 'idle');
        const lastSync = c?.statusSummary?.lastTs ? new Date(c.statusSummary.lastTs).toLocaleTimeString('vi-VN') : null;
        return { id, name, status, lastSync };
      });
      setClients(mapped);
    } catch (e) {
      console.log(e);
    }
  };

  // ===== one-shot: logs (hôm nay) =====
  const toUiLog = (doc) => {
    const ts = Number(doc.ts || Date.now());
    const d = new Date(ts);
    const timeText = d.toLocaleTimeString('vi-VN');
    const dateText = d.toLocaleDateString('vi-VN'); // <- NGÀY
    const phases = doc.phases;
    const shopName = `${doc?.label} (${doc?.shopId?.name})`;
    return {
      id: `${ts}-${Math.random()}`,
      ts,
      timeText,
      type: doc.type,
      dateText, // <- lưu ngày để render
      phases,
      shopName,
      error: doc.error || null,
      ms: Number.isFinite(doc.ms) ? doc.ms : null,
    };
  };

  const loadTodayLogsFromDB = async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const url = new URL(`${API_BASE}/api/logs`, window.location.origin);
      url.searchParams.set('from', String(startOfDay));
      url.searchParams.set('limit', '500');
      url.searchParams.set('sort', 'asc');
      const res = await fetch(url.toString().replace(window.location.origin, ''), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const list = (j.items || j.entries || []).map(toUiLog);
      setLogs(list);
    } catch {
      setLogs([]);
    }
  };

  const handleRefreshLogs = async () => {
    try {
      setIsRefreshing(true);
      setLogs([]);
      await loadTodayLogsFromDB();
      message.success('Đã tải lại log hôm nay');
    } catch (e) {
      message.error(e?.message || 'Không tải được logs');
    } finally {
      setIsRefreshing(false);
    }
  };

  // ===== lifecycle =====
  useEffect(() => {
    if (!isModalOpen) return;
    fetchClientsOnce(); // 1 lần khi mở
    loadTodayLogsFromDB(); // 1 lần khi mở
    // Không có polling nữa
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
      width={900}
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
              style={{
                borderLeft: `4px solid ${getClientBorderColor(client.status)}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
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

      {/* Logs (one-shot; refresh thủ công) */}
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Activity Logs</h3>
        <div
          style={{
            background: '#fafafa',
            borderRadius: 8,
            padding: 12,
            maxHeight: 460,
            overflowY: 'auto',
            border: '1px solid #d9d9d9',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#bfbfbf', textAlign: 'center', padding: '32px 0' }}>No logs yet. Click “Refresh Logs”.</div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              {logs
                .slice()
                .reverse()
                .map((log) => (
                  <Card key={log.id} size="small" bodyStyle={{ padding: 12 }} style={{ border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Space>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                          [{log.timeText} {log.dateText}]
                        </span>
                        <TriggerTag type={log.type} />
                        {log.shopName && (
                          <Tag icon={<ShopOutlined />} color="default">
                            {log.shopName}
                          </Tag>
                        )}
                        {Number.isFinite(log.ms) && <Tag color="geekblue">{log.ms} ms</Tag>}
                      </Space>
                      {log.error && (
                        <Tag color="error" style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {String(log.error)}
                        </Tag>
                      )}
                    </div>
                    {/* Phases */}
                    <Space wrap size={6}>
                      {log.phases && log.phases.length ? (
                        log.phases.map((p, idx) => (
                          <Tag key={`${p.type}-${idx}`} color={statusColor(p.status)} style={{ paddingInline: 10 }}>
                            {phaseLabel(p.type)} — {String(p.status || '').toUpperCase()}
                          </Tag>
                        ))
                      ) : (
                        <Tag>no-phase</Tag>
                      )}
                    </Space>
                  </Card>
                ))}
            </Space>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AsyncOrderModal;
