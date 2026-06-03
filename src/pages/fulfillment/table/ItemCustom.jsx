import { Image } from 'antd';
import { Link } from 'react-router-dom';
import { FcCancel } from 'react-icons/fc';

const ItemCustom = ({ items = [], customUrl, linkImage, listingId }) => {
  const listingUrl = listingId ? `https://www.etsy.com/listing/${listingId}` : '';

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
      <div className="flex gap-2 mb-1">
        <span className="font-medium">Link SP: </span>
        {listingUrl ? (
          <a href={listingUrl} target="_blank" rel="noreferrer" className="text-[#64748B]">
            Link
          </a>
        ) : (
          <span className="text-red-500">x</span>
        )}
      </div>
      {linkImage && (
        <div className="flex-col gap-2">
          <div>
            <span className="font-medium">Customer Photo: </span>
          </div>
          <div
            className="w-[80px] h-[80px] mt-2 rounded-lg overflow-hidden shadow-xl"
            style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
          >
            <Image width={80} src={linkImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCustom;
