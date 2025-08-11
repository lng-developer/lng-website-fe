const StatusComponent = ({ title = '', color = '', isDefault = false, marginRight }) => {
  return (
    <div
      style={{ borderColor: color, marginRight: marginRight || 0 }}
      className={`inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground`}
    >
      <span style={{ color: !isDefault ? color : '', whiteSpace: 'nowrap' }}>{title}</span>
    </div>
  );
};

export default StatusComponent;
