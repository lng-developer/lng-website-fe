import { Image } from 'antd';
import { Link } from 'react-router-dom';
import NoImage from '../../../assets/NoImage.jpg';
import CustomizationRows from '../../../components/CustomizationRows';

const SubItemCustom = ({ items = [], customUrl, linkImage }) => {
  return (
    <div className="flex-col justify-between">
      <CustomizationRows items={items} />
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

export default SubItemCustom;
