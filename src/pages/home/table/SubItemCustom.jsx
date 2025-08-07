import { Image } from 'antd';
import { Link } from 'react-router-dom';
import { FcCancel } from 'react-icons/fc';

const SubItemCustom = ({ items = [], customUrl, linkImage }) => {
  return (
    <div className="flex-col justify-between">
      {items.map((item, index) => (
        <div key={index} className="mb-1 max-w-[250px] whitespace-normal break-words">
          <span className="font-medium">{item?.label}:</span>
          <span className="text-[#64748B] ml-2">{item?.value ? item?.value : <span className="text-red-500">x</span>}</span>
        </div>
      ))}
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Customization Url: </span>
        <Link to={customUrl} className="text-[#64748B]">
          Link
        </Link>
      </div>
      {linkImage && (
        <div className="flex-col gap-2">
          <div>
            <span className="font-medium">Customer Photo: </span>
          </div>
          <div className="w-[80px] h-[80px] mt-2 rounded-lg overflow-hidden shadow-xl">
            <Image width={80} src={linkImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubItemCustom;
