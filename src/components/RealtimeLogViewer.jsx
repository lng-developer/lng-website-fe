// RealtimeLogViewer.jsx
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getLogs } from '../apis/socketio';

export default function RealtimeLogViewer({ apiBase, shopId, machineId }) {
  const [logs, setLogs] = useState([]);
  const lastAtRef = useRef(0);

  // load history on mount
  useEffect(() => {
    (async () => {
      const response = await getLogs({ shopId, machineId, limit: '200' });
      if (response.data.ok) {
        setLogs(response.data.logs);
        if (response.data.logs.length) lastAtRef.current = response.data.logs.at(-1).at || 0;
      }
    })();
  }, [apiBase, shopId, machineId]);

  // socket realtime
  useEffect(() => {
    const s = io(apiBase, { path: '/ws', transports: ['websocket', 'polling'] });

    s.on('realtime:log', (log) => {
      if (shopId && log.shopId !== shopId) return;
      if (machineId && log.machineId !== machineId) return;
      setLogs((prev) => {
        const next = [...prev, log];
        if (next.length > 500) next.shift(); // giữ 500 dòng
        return next;
      });
      lastAtRef.current = Math.max(lastAtRef.current, log.at || 0);
    });

    s.on('presence:update', (evt) => {
      // bạn có thể hiển thị bảng presence riêng
      console.log('presence:', evt);
    });

    return () => s.disconnect();
  }, [apiBase, shopId, machineId]);

  // optional backfill if needed
  useEffect(() => {
    const id = setInterval(async () => {
      const since = lastAtRef.current || 0;
      if (!since) return;
      const qs = new URLSearchParams({ shopId, machineId, since: String(since), limit: '1000' });
      const r = await fetch(`${apiBase}/api/ext/logs?` + qs);
      const j = await r.json();
      if (j.ok && j.logs.length) {
        setLogs((prev) => [...prev, ...j.logs].slice(-500));
        lastAtRef.current = j.logs.at(-1).at || since;
      }
    }, 30000);
    return () => clearInterval(id);
  }, [apiBase, shopId, machineId]);

  return (
    <div className="p-3 bg-slate-900 text-teal-200 rounded-md h-96 overflow-auto font-mono text-sm">
      {logs.map((l, i) => (
        <div key={i} className={l.type === 'error' ? 'text-rose-400' : l.type === 'ack' || l.type === 'done' ? 'text-lime-300' : ''}>
          [{new Date(l.at).toLocaleTimeString()}] [{l.shopId}/{l.machineId}] {l.type}: {l.message}
        </div>
      ))}
    </div>
  );
}
