import { Image } from 'antd';
import { Link } from 'react-router-dom';
import NoImage from '../../../assets/NoImage.jpg';

const SubItemCustomEtsy = ({ items = [], customUrl, linkImage }) => {
  // Chuẩn hóa: items có thể là array [{label, value}] hoặc object {key: value}
  const normalizedItems = Array.isArray(items)
    ? items // version3Data: [{label, value}]
    : Object.entries(items || {}).map(([label, value]) => ({ label, value }));

  return (
    <div className="flex-col justify-between">
      {normalizedItems.map((item, index) => (
        <div key={index} className="mb-0.5 max-w-[250px] whitespace-normal break-words">
          <span className="font-medium">{item.label}:</span>
          {/* whitespace-pre-wrap giữ nguyên ký tự xuống dòng \n */}
          <span className="text-[#64748B] ml-2 whitespace-pre-wrap">
            {item.value ? item.value : <span className="text-red-500">x</span>}
          </span>
        </div>
      ))}

      <div className="flex gap-2 mb-0.5">
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
          <div
            className="w-[80px] h-[80px] mt-1 rounded-lg overflow-hidden"
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <Image width={80} src={linkImage} fallback={NoImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubItemCustomEtsy;
