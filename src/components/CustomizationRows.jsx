import { getCustomizationRows } from '../utils/customizationDisplay';

const MissingValue = () => <span className="text-red-500">x</span>;

const CustomizationRows = ({ items = [], rowClassName = 'mb-0.5' }) => (
  <>
    {getCustomizationRows(items).map((item, index) => {
      return (
        <div key={index} className={`${rowClassName} max-w-[250px] whitespace-normal break-words`}>
          <span className="font-medium">{item?.label}:</span>
          <span className="text-[#64748B] ml-2 whitespace-pre-wrap">{item?.value ? item.value : <MissingValue />}</span>
        </div>
      );
    })}
  </>
);

export default CustomizationRows;
