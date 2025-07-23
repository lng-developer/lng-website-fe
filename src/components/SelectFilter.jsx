import { MdAddCircleOutline } from 'react-icons/md';
const SelectFilter = () => {
  return (
    <button className="border-dashed inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent h-10  space-x-1 px-2 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]">
      <div className="">
        <MdAddCircleOutline />
      </div>
      <span className="text-sm font-medium">Team</span>
    </button>
  );
};

export default SelectFilter;
