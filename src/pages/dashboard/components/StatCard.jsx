import React from 'react';

const IconWrap = ({ bg, children }) => (
  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg} text-white text-lg`}>{children}</div>
);

const StatCard = ({ item }) => (
  <div className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md h-[54px]">
    <div className="flex items-center gap-3">
      <IconWrap bg={item.iconBg}>{item.icon}</IconWrap>
      <div className="text-slate-600 text-[13px] leading-4 font-medium">{item.title}</div>
    </div>
    <div className={`text-right tabular-nums font-semibold ${item.textColor || 'text-slate-700'}`}>
      {item.prefix}
      {item.value.toLocaleString()}
      {item.suffix}
    </div>
  </div>
);

export default StatCard;
