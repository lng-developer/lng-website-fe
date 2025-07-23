const ButtonFilter = () => {
  return (
    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent h-10  space-x-1 px-2 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]">
      <span className="text-sm font-medium">New Order</span>
      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-medium text-foreground ml-[3px] border-[#e2e8f0]">
        <span className="truncate">190</span>
      </div>
    </button>
  );
};

export default ButtonFilter;
