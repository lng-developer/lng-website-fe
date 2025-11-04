// RealtimeLogViewer.jsx
import { useEffect, useMemo, useRef } from 'react';

const LEVEL_STYLE = {
  info: 'text-teal-200',
  step: 'text-cyan-300',
  ack: 'text-sky-300',
  done: 'text-lime-300 font-semibold',
  warn: 'text-amber-300',
  error: 'text-rose-400 font-semibold',
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

export default function RealtimeLogViewer({ logs }) {
  const boxRef = useRef(null);

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
