import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Card, Input, Space, Divider, Tag } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
} from '@ant-design/icons';
import { dataColors } from '../../utils/dataColors';
import { io as socketIOClient } from 'socket.io-client'; // NEW

const API_BASE = 'https://api.lngmerch.co';

const AsyncOrderModal = ({ isModalOpen, setIsModalOpen }) => {
  // ===== UI state =====
  const [isImporting, setIsImporting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [autoImportInterval, setAutoImportInterval] = useState(5); // UI hiển thị giờ, BE nhận phút
  const [isAutoImportEnabled, setIsAutoImportEnabled] = useState(false);
  const [clients, setClients] = useState([]);

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

  // ===== helpers =====
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

  // ===== API calls =====
  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients`, { cache: 'no-store' });
      const arr = await res.json();

      // CHỈ hiện client thực (extension):
      // - ưu tiên có clientId, hoặc
      // - version bắt đầu bằng 'ext-' (extension gửi trong HELLO),
      // - (tuỳ chọn) label bắt đầu bằng 'Machine-' nếu bạn đặt như vậy
      const realExts = (arr || []).filter(
        (c) =>
          (c.clientId && c.clientId.trim() !== '') ||
          (c.version && String(c.version).startsWith('ext-')) ||
          (c.label && String(c.label).startsWith('Machine-'))
      );

      const mapped = realExts.map((c, idx) => {
        const id = c.clientId || c.label || c.socketId || `c-${idx}`;
        const name = c.label || c.clientId || `Client ${idx + 1}`;
        const status =
          (c?.statusSummary?.overall === 'success' && 'success') ||
          (c?.statusSummary?.overall === 'running' && 'processing') ||
          (c?.statusSummary?.overall === 'error' && 'error') ||
          'idle';
        const lastSync = c?.statusSummary?.lastTs ? new Date(c.statusSummary.lastTs).toLocaleTimeString('vi-VN') : null;

        return { id, name, status, lastSync };
      });

      setClients(mapped);
    } catch {
      /* noop */
    }
  };

  // ===== Socket.IO (ưu tiên số 1) =====
  const stopSocket = () => {
    try {
      sockRef.current?.close();
    } catch {
      console.log('Error');
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
      // khi có socket realtime, tắt SSE/polling
      stopLogsSSE();
      clearTimeout(logsPollTimerRef.current);
      pollingAbortRef.current?.abort();
    });

    // server đã phát sẵn bản rút gọn cho UI
    sock.on('ADMIN_ACTIVITY', (entry) => {
      // entry: { ts, type: 'info'|'success'|'error', text }
      appendActivityEntries([entry]);
    });

    // optional: nếu muốn dùng raw để debug
    // sock.on('ADMIN_EVENT', (raw) => { ... });

    sock.on('disconnect', () => {
      usingSocketRef.current = false;
      // fallback sang SSE; nếu SSE fail → polling
      startLogsSSE();
      setTimeout(() => {
        if (!usingSSERef.current) scheduleLogsPolling(2000);
      }, 1000);
    });

    sock.on('connect_error', () => {
      // không kết nối được socket → thử SSE/polling
      usingSocketRef.current = false;
      startLogsSSE();
      setTimeout(() => {
        if (!usingSSERef.current) scheduleLogsPolling(2000);
      }, 1000);
    });
  };

  // ===== SSE (ưu tiên số 2) =====
  const stopLogsSSE = () => {
    try {
      sseRef.current?.close();
    } catch {
      console.log('Error');
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

  // ===== Polling (fallback thứ 3) có backoff =====
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

      const res = await fetch(url.toString().replace(window.location.origin, ''), {
        signal: ctl.signal,
        cache: 'no-store',
      });
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
  const handleImport = async () => {
    try {
      setIsImporting(true);
      setLogs([]);
      addUILog('Bắt đầu import orders...', 'processing');

      const res = await fetch(`${API_BASE}/admin/run-now`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason: 'ui-manual' }),
      });
      const j = await res.json();
      if (j?.ok) {
        addUILog(`Đã phát lệnh RUN_NOW (jobId: ${j.jobId})`, 'processing');
      } else {
        addUILog('Không phát được lệnh RUN_NOW', 'error');
      }
    } catch (e) {
      addUILog(`Lỗi gửi lệnh: ${e?.message || e}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleAuto = async () => {
    try {
      const enabled = !isAutoImportEnabled;
      setIsAutoImportEnabled(enabled);

      const minutes = Number(autoImportInterval) * 60; // giờ -> phút
      const payload = enabled ? { enabled: true, intervalMin: minutes } : { enabled: false };

      const res = await fetch(`${API_BASE}/admin/schedule`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (j?.ok) {
        addUILog(enabled ? `Đã bật auto import mỗi ${autoImportInterval} giờ` : 'Đã tắt auto import', 'success');
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
      // cleanup
      clearTimeout(logsPollTimerRef.current);
      pollingAbortRef.current?.abort();
      clearInterval(clientsTimerRef.current);
      stopLogsSSE();
      stopSocket();
      return;
    }

    logsSinceRef.current = 0;
    setLogs([]);

    // Clients: 5s/lần
    fetchClients();
    clientsTimerRef.current = setInterval(fetchClients, 5000);

    // Realtime logs: ưu tiên Socket.IO -> SSE -> Polling
    startSocket();
    // nếu 1s sau socket vẫn chưa connect, đá sang SSE/polling
    const kick = setTimeout(() => {
      if (!usingSocketRef.current) {
        startLogsSSE();
        if (!usingSSERef.current) scheduleLogsPolling(2000);
      }
    }, 1000);

    return () => {
      clearTimeout(kick);
      clearTimeout(logsPollTimerRef.current);
      pollingAbortRef.current?.abort();
      clearInterval(clientsTimerRef.current);
      stopLogsSSE();
      stopSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  // Dừng polling khi tab ẩn, resume khi hiện (nếu đang dùng polling)
  useEffect(() => {
    const onVis = () => {
      const visible = document.visibilityState === 'visible';
      if (!isModalOpen) return;
      if (!visible) {
        clearTimeout(logsPollTimerRef.current);
        pollingAbortRef.current?.abort();
      } else if (!usingSocketRef.current && !usingSSERef.current) {
        scheduleLogsPolling(2000);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [isModalOpen]);

  // ===== render =====
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
      width={800}
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

      {/* Auto Import Settings */}
      <Card
        style={{
          background: '#e6f7ff',
          borderColor: '#91d5ff',
          marginBottom: '24px',
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <ClockCircleFilled style={{ fontSize: '20px', color: '#1890ff' }} />
            <div>
              <div style={{ fontWeight: '600', color: '#262626' }}>Auto Import Orders</div>
              <div style={{ fontSize: '12px', color: '#595959', marginTop: '4px' }}>
                {isAutoImportEnabled ? `Running every ${autoImportInterval} hours` : 'Deactivate'}
              </div>
            </div>
          </Space>
          <Space size="middle">
            <Space size="small" align="center">
              <span style={{ fontSize: '14px' }}>Every</span>
              <Input
                type="number"
                min={1}
                max={720}
                value={autoImportInterval}
                onChange={(e) => setAutoImportInterval(Number(e.target.value))}
                style={{ width: '80px' }}
                disabled={isAutoImportEnabled || isImporting}
              />
              <span style={{ fontSize: '14px', color: '#595959' }}>hour</span>
            </Space>
            <Button
              type={isAutoImportEnabled ? 'default' : 'primary'}
              danger={isAutoImportEnabled}
              size="small"
              onClick={async () => {
                await handleToggleAuto();
              }}
              disabled={isImporting}
            >
              {isAutoImportEnabled ? 'Deactivate' : 'Activate'}
            </Button>
          </Space>
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
                <div key={log.id} style={{ display: 'flex', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#d9d9d9',
                      marginTop: '8px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#8c8c8c', fontSize: '12px' }}>[{log.timestamp}]</span>
                    <span style={{ marginLeft: '8px', color: getLogColor(log.type) }}>{log.message}</span>
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
