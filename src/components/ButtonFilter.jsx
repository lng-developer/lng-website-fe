import { dataColors } from '../utils/dataColors';

const ButtonFilter = ({ item = {}, count = 0, isActive = null, handleFilterForStatus, setIsActivefilter }) => {
  const handleClick = () => {
    setIsActivefilter(item);
    handleFilterForStatus(item?.status);
  };
  return (
    <button
      className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-2 cursor-pointer hover:bg-[#f1f5f9]"
      style={{
        borderColor: isActive === item?.key ? dataColors.pending : '#e2e8f0',
        color: isActive === item?.key ? 'white' : 'black',
        backgroundColor: isActive === item?.key ? dataColors.pending : '',
      }}
      onClick={handleClick}
    >
      <span className="text-sm font-medium">{item?.title}</span>
      <div
        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors font-medium ml-[3px] border-[#e2e8f0]"
        style={{ color: 'black', backgroundColor: 'white' }}
      >
        <span className="truncate font-bold" style={{ color: isActive === item?.key ? 'black' : '' }}>
          {count}
        </span>
      </div>
    </button>
  );
};

export default ButtonFilter;
