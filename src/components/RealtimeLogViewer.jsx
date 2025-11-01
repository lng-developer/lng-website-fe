// RealtimeLogViewer.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getLogs } from '../apis/socketio'; // your REST: /api/ext/logs

const LEVEL_STYLE = {
  info: 'text-teal-200',
  step: 'text-cyan-300',
  ack: 'text-sky-300',
  done: 'text-lime-300',
  warn: 'text-amber-300',
  error: 'text-rose-400',
  default: 'text-slate-200',
};

function fmtTime(ms) {
  try {
    return new Date(ms).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

function clientTag(l) {
  const label = l.label ? `/${l.label}` : '';
  return `${l.shopId}/${l.machineId}${label}`;
}

// Normalize mọi nguồn log (DB, realtime:log, fe/ext events) về 1 format
function normalize(raw) {
  if (!raw) return null;

  if (raw.evt === 'fe:command:accepted') {
    return {
      at: raw.at || Date.now(),
      shopId: raw.shopId || '',
      machineId: raw.machineId || '',
      label: raw.label || '',
      type: 'ack',
      message: `Command accepted → ${raw.type}`,
      action: raw.action,
    };
  }

  if (raw.evt === 'ext:task:started') {
    return {
      at: raw.at || Date.now(),
      shopId: raw.shopId || '',
      machineId: raw.machineId || '',
      label: raw.label || '',
      type: 'step',
      message: 'runImportNewOrders started',
    };
  }

  if (raw.evt === 'ext:task:finished') {
    return {
      at: raw.at || Date.now(),
      shopId: raw.shopId || '',
      machineId: raw.machineId || '',
      label: raw.label || '',
      type: raw.ok ? 'done' : 'error',
      message: raw.ok ? `Full flow finished (${raw.action || 'CLICK'})` : `Full flow failed: ${raw?.summary?.error || 'unknown'}`,
    };
  }

  // Log DB hoặc realtime:log gốc
  return {
    at: Number(raw.at || raw.time || Date.now()),
    shopId: String(raw.shopId || ''),
    machineId: String(raw.machineId || ''),
    label: raw.label,
    type: raw.type || raw.level || 'info',
    message: String(raw.message || ''),
    action: raw.action,
  };
}

export default function RealtimeLogViewer({ apiBase, shopId, machineId }) {
  const [logs, setLogs] = useState([]);
  const lastAtRef = useRef(0);
  const boxRef = useRef(null);
  const maxLines = 800;

  // 1) Load lịch sử từ DB khi mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await getLogs({ shopId, machineId, limit: '200' });
        const arr = (resp?.data?.logs || []).map(normalize).filter(Boolean);
        if (!cancelled) {
          setLogs(arr);
          if (arr.length) lastAtRef.current = arr[arr.length - 1].at;
        }
      } catch {
        console.log('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, shopId, machineId]);

  // 2) Socket realtime (nhẹ)
  useEffect(() => {
    const s = io(apiBase, {
      path: '/ws',
      transports: ['websocket'],
      auth: { shopId, machineId },
    });

    const push = (raw) => {
      const l = normalize(raw);
      if (!l) return;
      if (shopId && l.shopId !== shopId) return;
      if (machineId && l.machineId !== machineId) return;

      setLogs((prev) => {
        const next = [...prev, l];
        if (next.length > maxLines) next.splice(0, next.length - maxLines);
        return next;
      });
      lastAtRef.current = Math.max(lastAtRef.current, l.at);
    };

    s.on('realtime:log', push);
    s.on('fe:command:accepted', (e) => push({ ...e, evt: 'fe:command:accepted' }));
    s.on('ext:task:started', (e) => push({ ...e, evt: 'ext:task:started' }));
    s.on('ext:task:finished', (e) => push({ ...e, evt: 'ext:task:finished' }));
    // s.on("presence:update", () => {}); // nếu cần hiển thị presence

    return () => s.disconnect();
  }, [apiBase, shopId, machineId]);

  // 3) Auto-scroll nếu đang gần cuối
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const rendered = useMemo(
    () =>
      logs.map((l, i) => {
        const color = LEVEL_STYLE[l.type] || LEVEL_STYLE.default;
        const time = fmtTime(l.at);
        const tag = clientTag(l);
        const prefix = (l.type || 'info') + ':'; // info:/step:/done:/error:
        return (
          <div key={i} className={color}>
            <span className="text-slate-400">[{time}]</span> <span className="text-teal-400">[{tag}]</span>{' '}
            <span className="text-slate-300">{prefix}</span> <span>{l.message}</span>
          </div>
        );
      }),
    [logs]
  );

  return (
    <div ref={boxRef} className="p-3 bg-slate-900 text-slate-200 rounded-md h-96 overflow-auto font-mono text-sm leading-6">
      {rendered}
    </div>
  );
}
