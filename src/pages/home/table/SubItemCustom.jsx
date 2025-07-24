import { Link } from 'react-router-dom';

const SubItemCustom = ({ items = [], customUrl }) => {
  return (
    <div className="flex-col justify-between">
      {items.map((item, index) => (
        <div key={index} className="mb-1 max-w-[250px] whitespace-normal break-words">
          <span className="font-medium">{item?.label}:</span>
          <span className="text-[#64748B] ml-2">{item?.value}</span>
        </div>
      ))}
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Customization Url: </span>
        <Link to={customUrl} className="text-[#64748B]">
          Link
        </Link>
      </div>
    </div>
  );
};

export default SubItemCustom;
