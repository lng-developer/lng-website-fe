const StatusComponent = ({ title = '', color = '', isDefault = false }) => {
  return (
    <div
      style={{ borderColor: color }}
      className={`inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground`}
    >
      <span style={{ color: !isDefault ? color : '', whiteSpace: 'nowrap' }}>{title}</span>
    </div>
  );
};

export default StatusComponent;
