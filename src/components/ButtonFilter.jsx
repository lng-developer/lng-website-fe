const ButtonFilter = ({ title = '', count = 0 }) => {
  return (
    <div
      className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-2 cursor-pointer hover:bg-[#f1f5f9]"
      style={{ borderColor: '#e2e8f0', color: 'black' }}
    >
      <span className="text-sm font-medium">{title}</span>
      <div
        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors font-medium ml-[3px] border-[#e2e8f0]"
        style={{ color: 'black' }}
      >
        <span className="truncate" style={{ color: 'black' }}>
          {count}
        </span>
      </div>
    </div>
  );
};

export default ButtonFilter;
