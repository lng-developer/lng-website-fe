import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Card, Space, Divider, Tag, Switch } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
} from '@ant-design/icons';
import { dataColors } from '../../utils/dataColors';
import { io as socketIOClient } from 'socket.io-client';

const API_BASE = 'https://api.lngmerch.co';
const DEFAULT_ANCHORS = [0, 4, 8, 12, 16, 20]; // giờ cố định mỗi ngày

const AsyncOrderModal = ({ isModalOpen, setIsModalOpen }) => {
  // ===== UI state =====
  const [isImporting, setIsImporting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [isAutoImportEnabled, setIsAutoImportEnabled] = useState(false);

  // ===== refs =====
  const logsSinceRef = useRef(0);
  const clientsTimerRef = useRef(null);

  // Socket.IO
  const sockRef = useRef(null);
  const usingSocketRef = useRef(false);

  // SSE
  const sseRef = useRef(null);
  const usingSSERef = useRef(false);

  // Polling (fallback)
  const logsPollDelayRef = useRef(2000);
  const logsPollTimerRef = useRef(null);
  const pollingAbortRef = useRef(null);

  // ===== helpers UI =====
  const addUILog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setLogs((prev) => [...prev, { message, type, timestamp, id: `${Date.now()}-${Math.random()}` }]);
  };

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
    const iconStyle = { fontSize: '16px' };
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

  const getClientBorderColor = (status) => {
    switch (status) {
      case 'success':
        return '#52c41a';
      case 'processing':
        return '#1890ff';
      case 'error':
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return '#52c41a';
      case 'error':
        return '#ff4d4f';
      case 'processing':
        return '#1890ff';
      default:
        return '#8c8c8c';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'idle':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      default:
        return 'Chờ';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return dataColors.success;
      case 'processing':
        return dataColors.pending;
      case 'error':
        return dataColors.cancelled;
      default:
        return 'default';
    }
  };

  // ===== API: Clients =====
  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients`, { cache: 'no-store' });
      const arr = await res.json();
      const realExts = (arr || []).filter(
        (c) =>
          (c.clientId && c.clientId.trim() !== '') ||
          (c.version && String(c.version).startsWith('ext-')) ||
          (c.label && String(c.label).startsWith('Machine-'))
      );
      const mapped = realExts.map((c, idx) => {
        const id = c.clientId || c.label || c.socketId || `c-${idx}`;
        const name = c.label || c.clientId || `Client ${idx + 1}`;
        const status = mapOverallToUiStatus(c?.statusSummary?.overall || 'idle');
        const lastSync = c?.statusSummary?.lastTs ? new Date(c.statusSummary.lastTs).toLocaleTimeString('vi-VN') : null;
        return { id, name, status, lastSync };
      });
      setClients(mapped);
    } catch {
      console.log('Error system');
    }
  };

  // ===== DB Logs for TODAY on open =====
  const loadTodayLogsFromDB = async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const url = new URL(`${API_BASE}/logs`, window.location.origin);
      url.searchParams.set('view', 'activity');
      url.searchParams.set('since', String(startOfDay));
      url.searchParams.set('limit', '500');
      const res = await fetch(url.toString().replace(window.location.origin, ''), { cache: 'no-store' });
      const j = await res.json();
      setLogs([]);
      appendActivityEntries(j?.entries || []);
    } catch {
      setLogs([]);
    }
  };

  // ======== REALTIME CLIENT STATUS ========
  const upsertClientStatus = ({ clientId, label, status, ts }) => {
    const id = clientId || label;
    if (!id) return;
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const name = label || clientId || id;
      const lastSync = ts ? new Date(ts).toLocaleTimeString('vi-VN') : undefined;
      if (idx === -1) return [...prev, { id, name, status, lastSync }];
      const next = [...prev];
      next[idx] = { ...next[idx], status, ...(lastSync ? { lastSync } : {}) };
      return next;
    });
  };

  const handleAdminEventForClients = (raw) => {
    if (!raw || raw.type !== 'STATUS') return;
    const d = raw.data || {};
    const idOrLabel = d.clientId || d.label;
    if (!idOrLabel) return;
    let uiStatus = 'idle';
    if (d.status === 'start') uiStatus = 'processing';
    else if (d.status === 'success') uiStatus = 'success';
    else if (d.status === 'fail') uiStatus = 'error';
    upsertClientStatus({ clientId: d.clientId, label: d.label || idOrLabel, status: uiStatus, ts: raw.ts });
  };

  // ===== Socket.IO (priority #1) =====
  const stopSocket = () => {
    try {
      sockRef.current?.close();
    } catch {
      console.log('Error system');
    }
    sockRef.current = null;
    usingSocketRef.current = false;
  };

  const startSocket = () => {
    if (sockRef.current) return;
    const sock = socketIOClient(API_BASE, {
      path: '/socket',
      transports: ['websocket'],
      withCredentials: false,
    });
    sockRef.current = sock;

    sock.on('connect', () => {
      usingSocketRef.current = true;
      stopLogsSSE();
      clearTimeout(logsPollTimerRef.current);
      pollingAbortRef.current?.abort();
    });

    sock.on('ADMIN_ACTIVITY', (entry) => appendActivityEntries([entry]));
    sock.on('ADMIN_EVENT', handleAdminEventForClients);

    sock.on('disconnect', () => {
      usingSocketRef.current = false;
      startLogsSSE();
      setTimeout(() => {
        if (!usingSSERef.current) scheduleLogsPolling(2000);
      }, 1000);
    });

    sock.on('connect_error', () => {
      usingSocketRef.current = false;
      startLogsSSE();
      setTimeout(() => {
        if (!usingSSERef.current) scheduleLogsPolling(2000);
      }, 1000);
    });
  };

  // ===== SSE (priority #2) =====
  const stopLogsSSE = () => {
    try {
      sseRef.current?.close();
    } catch {
      console.log('Error system');
    }
    sseRef.current = null;
    usingSSERef.current = false;
  };

  const startLogsSSE = () => {
    if (usingSocketRef.current || sseRef.current) return;
    try {
      const src = new EventSource(`${API_BASE}/logs/stream`);
      usingSSERef.current = true;
      sseRef.current = src;

      src.onmessage = (evt) => {
        const data = JSON.parse(evt.data || '{}');
        if (data.bootstrap) {
          appendActivityEntries(data.bootstrap);
        } else if (data.ts && data.type) {
          appendActivityEntries([{ ts: data.ts, type: 'info', text: data?.data?.text || data.type }]);
        }
      };

      src.onerror = () => {
        stopLogsSSE();
        if (!usingSocketRef.current) scheduleLogsPolling(2000);
      };
    } catch {
      usingSSERef.current = false;
      if (!usingSocketRef.current) scheduleLogsPolling(2000);
    }
  };

  // ===== Polling (priority #3) =====
  const scheduleLogsPolling = (delayMs) => {
    if (usingSocketRef.current || usingSSERef.current) return;
    clearTimeout(logsPollTimerRef.current);
    logsPollDelayRef.current = delayMs;
    logsPollTimerRef.current = setTimeout(pollActivityLogs, delayMs);
  };

  const pollActivityLogs = async () => {
    if (usingSocketRef.current || usingSSERef.current) return;
    const ctl = new AbortController();
    pollingAbortRef.current = ctl;
    try {
      const url = new URL(`${API_BASE}/logs`, window.location.origin);
      url.searchParams.set('view', 'activity');
      if (logsSinceRef.current) url.searchParams.set('since', String(logsSinceRef.current));
      url.searchParams.set('limit', '200');
      const res = await fetch(url.toString().replace(window.location.origin, ''), { signal: ctl.signal, cache: 'no-store' });
      const j = await res.json();
      const entries = j?.entries || [];
      if (entries.length) {
        appendActivityEntries(entries);
        scheduleLogsPolling(2000);
      } else {
        const d = logsPollDelayRef.current;
        const next = d < 5000 ? 5000 : d < 15000 ? 15000 : 60000;
        scheduleLogsPolling(next);
      }
    } catch {
      scheduleLogsPolling(30000);
    }
  };

  // ===== actions =====
  const startRealtime = () => {
    startSocket();
    setTimeout(() => {
      if (!usingSocketRef.current) {
        startLogsSSE();
        if (!usingSSERef.current) scheduleLogsPolling(2000);
      }
    }, 1000);
  };

  const stopRealtime = () => {
    clearTimeout(logsPollTimerRef.current);
    pollingAbortRef.current?.abort();
    stopLogsSSE();
    stopSocket();
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setLogs([]);
      logsSinceRef.current = 0;
      startRealtime();
      addUILog('Start import orders...', 'processing');
      const res = await fetch(`${API_BASE}/admin/run-now`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason: 'ui-manual' }),
      });
      const j = await res.json();
      if (j?.ok) addUILog(`Đã phát lệnh RUN_NOW (jobId: ${j.jobId})`, 'processing');
      else addUILog('Không phát được lệnh RUN_NOW', 'error');
    } catch (e) {
      addUILog(`Lỗi gửi lệnh: ${e?.message || e}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // bật/tắt auto import — LUÔN dùng lịch cố định DEFAULT_ANCHORS
  const handleToggleAuto = async (nextEnabled) => {
    try {
      setIsAutoImportEnabled(nextEnabled);
      const payload = { enabled: !!nextEnabled, anchors: DEFAULT_ANCHORS };
      const res = await fetch(`${API_BASE}/admin/schedule`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (j?.ok) {
        addUILog(
          nextEnabled ? `Auto import enabled (at ${DEFAULT_ANCHORS.map((h) => `${h}:00`).join(', ')})` : 'Auto import disabled',
          'success'
        );
      } else {
        addUILog('Không cập nhật được lịch auto', 'error');
      }
    } catch (e) {
      addUILog(`Lỗi cập nhật lịch: ${e?.message || e}`, 'error');
    }
  };

  // ===== lifecycle =====
  useEffect(() => {
    if (!isModalOpen) {
      stopRealtime();
      clearInterval(clientsTimerRef.current);
      return;
    }
    logsSinceRef.current = 0;
    loadTodayLogsFromDB();
    fetchClients();
    clientsTimerRef.current = setInterval(fetchClients, 5000);
    return () => {
      stopRealtime();
      clearInterval(clientsTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  useEffect(() => {
    const onVis = () => {
      const visible = document.visibilityState === 'visible';
      if (!isModalOpen) return;
      if (!visible) {
        clearTimeout(logsPollTimerRef.current);
        pollingAbortRef.current?.abort();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [isModalOpen]);

  const scheduleSummary = `at ${DEFAULT_ANCHORS.map((h) => `${h}:00`).join(', ')}`;

  return (
    <Modal
      title={
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          <CloudDownloadOutlined style={{ marginRight: '8px' }} />
          Async Orders
        </div>
      }
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      width={820}
      footer={[
        <Button key="close" onClick={() => setIsModalOpen(false)}>
          Cancel
        </Button>,
        <Button
          key="import"
          type="primary"
          loading={isImporting}
          onClick={handleImport}
          disabled={isImporting}
          icon={<CloudDownloadOutlined />}
        >
          Start Import
        </Button>,
      ]}
    >
      {/* Clients Status */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Status Clients ({clients.length})</h3>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {clients.map((client) => (
            <Card
              key={client.id}
              size="small"
              style={{
                borderLeft: `4px solid ${getClientBorderColor(client.status)}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  {getClientStatusIcon(client.status)}
                  <span style={{ fontWeight: '500' }}>{client.name}</span>
                </Space>
                <Space>
                  {client.lastSync && <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{client.lastSync}</span>}
                  <Tag color={getStatusColor(client.status)}>{getStatusText(client.status)}</Tag>
                </Space>
              </div>
            </Card>
          ))}
        </Space>
      </div>

      {/* Auto Import Settings (fixed schedule only) */}
      <Card style={{ background: '#e6f7ff', borderColor: '#91d5ff', marginBottom: '24px' }} bodyStyle={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <ClockCircleFilled style={{ fontSize: '20px', color: '#1890ff' }} />
            <div>
              <div style={{ fontWeight: '600', color: '#262626' }}>Auto Import Orders</div>
              <div style={{ fontSize: '12px', color: '#595959', marginTop: '4px' }}>
                {isAutoImportEnabled ? `Running ${scheduleSummary}` : 'Inactive'}
              </div>
            </div>
          </Space>
          <Switch
            checked={isAutoImportEnabled}
            onChange={handleToggleAuto}
            disabled={isImporting}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
          />
        </div>
      </Card>

      <Divider style={{ margin: '16px 0' }} />

      {/* Logs Section */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Activity Logs</h3>
        <div
          style={{
            background: '#fafafa',
            borderRadius: '8px',
            padding: '16px',
            maxHeight: '384px',
            overflowY: 'auto',
            border: '1px solid #d9d9d9',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#bfbfbf', textAlign: 'center', padding: '32px 0' }}>No logs yet. Click “Start Import” to begin.</div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#d9d9d9',
                      marginTop: 8,
                      flexShrink: 0,
                    }}
                  />
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
