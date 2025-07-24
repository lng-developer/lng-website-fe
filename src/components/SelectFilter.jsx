import { MdAddCircleOutline } from 'react-icons/md';
const SelectFilter = () => {
  return (
    <div
      style={{ color: 'black' }}
      className="border-dashed inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10  space-x-1 px-2 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]"
    >
      <div className="">
        <MdAddCircleOutline />
      </div>
      <span className="text-sm font-medium" style={{ color: 'black' }}>
        Team
      </span>
    </div>
  );
};

export default SelectFilter;
