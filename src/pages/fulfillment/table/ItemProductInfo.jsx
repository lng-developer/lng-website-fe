import { Image, Button, Tooltip } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import NoImage from '../../../assets/NoImage.jpg';
import { RiLinkM } from 'react-icons/ri';
import { Link } from 'react-router-dom';

const ItemProductInfo = ({ imageUrl, asin, sku, status, showPsdButton = true }) => {
  const handleColorStatus = (stt) => {
    switch (stt) {
      case 'New':
        return dataColors.success;
      case 'Fulfilled':
        return dataColors.process;
      case 'Shipped':
        return dataColors.pending;
      case 'Cancelled':
        return dataColors.cancelled;
      default:
        return dataColors.default;
    }
  };
  return (
    <div className="">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <div
          className="w-[130px] h-[130px] rounded-lg overflow-hidden flex gap-2 shadow-md mb-2"
          style={{
            boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
          }}
        >
          <Image
            width={130}
            height={130}
            src={imageUrl ? imageUrl : NoImage}
            className="rounded-lg object-cover"
            alt="Product"
            preview={{
              mask: <div className="">Preview</div>,
            }}
          />
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-1 ">
        {/* ASIN Section */}
        {asin && (
          <div className="mb-1">
            <div className="font-semibold text-gray-800 ">ASIN:</div>
            <div className="flex items-center gap-1">
              <StatusComponent title={asin} color={dataColors.pending} />
              <Tooltip title="Open Link">
                <Link target="_blank" className="!text-black" to={`http://amazon.com/gp/product/${asin}`}>
                  <RiLinkM size={18} />
                </Link>
              </Tooltip>
            </div>
          </div>
        )}
        {/* SKU Section */}
        {sku && (
          <div className="mb-1">
            <div className="font-semibold text-gray-800 ">SKU:</div>
            <StatusComponent title={sku} color={dataColors.asin} />
          </div>
        )}

        {/* Status Section */}
        {status && (
          <div className="mb-2">
            <div className="font-semibold text-gray-800 ">Status:</div>
            <StatusComponent title={status} color={handleColorStatus(status)} />
          </div>
        )}
        {/* PSD Download Button */}
        {showPsdButton && (
          <div>
            <div className="font-semibold text-gray-800  mb-1">PSD:</div>
            <StatusComponent title={'Download PSD'} color="#39A00D" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemProductInfo;
