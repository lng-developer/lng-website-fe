const ButtonFilter = () => {
  return (
    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-2 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]">
      <span className="text-sm font-medium">New Order</span>
      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors font-medium ml-[3px] border-[#e2e8f0]">
        <span className="truncate">190</span>
      </div>
    </div>
  );
};

export default ButtonFilter;
