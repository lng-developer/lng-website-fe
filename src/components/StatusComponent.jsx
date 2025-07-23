const StatusComponent = ({ title = '', color = '' }) => {
  return (
    <div
      style={{ borderColor: color }}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground ml-[3px]`}
    >
      <span style={{ color: color ? color : '' }}>{title}</span>
    </div>
  );
};

export default StatusComponent;
