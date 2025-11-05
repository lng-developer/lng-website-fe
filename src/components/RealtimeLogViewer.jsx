// RealtimeLogViewer.jsx
import { useEffect, useMemo, useRef } from 'react';
import { dataColors } from '../utils/dataColors';

const LEVEL_STYLE = {
  info: 'text-teal-200',
  step: 'text-cyan-300',
  ack: 'text-sky-300',
  done: 'text-lime-300 font-semibold',
  warn: 'text-amber-300',
  error: 'text-rose-400 font-semibold',
  default: 'text-slate-200',
};

export default function RealtimeLogViewer({ logs }) {
  const boxRef = useRef(null);

  // 3) Auto-scroll nếu đang gần cuối
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const formatDateToUI = (time) => {
    const ts = Number(time || Date.now());
    const d = new Date(ts);
    const timeText = d.toLocaleTimeString('vi-VN');
    const dateText = d.toLocaleDateString('vi-VN');

    return `[${timeText} ${dateText}]`;
  };

  const rendered = useMemo(
    () =>
      logs.map((l, i) => {
        const color = LEVEL_STYLE[l.type] || LEVEL_STYLE.default;
        return (
          <div key={i} className={`${color} flex items-center gap-2`}>
            <div className={`w-1.5 h-1.5 rounded-full bg-slate-500`}></div>
            <span className="text-slate-400">{formatDateToUI(l.at)}</span>{' '}
            <span style={{ color: dataColors.yellow }}>[{l?.action.toLocaleUpperCase()}]</span>
            <span className="text-teal-400">[{`${l?.machineId}/${l?.label} (${l?.shop?.shopName})`}]:</span>
            <span>{l.message}</span>
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
