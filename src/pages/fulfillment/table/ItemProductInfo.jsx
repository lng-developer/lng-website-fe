import { Image, Button } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';

const ItemProductInfo = ({ imageUrl, asin, sku, status, showPsdButton = true }) => {
  return (
    <div className="">
      {/* Product Image */}
      <div className="flex-shrink-0 ">
        <Image
          width={130}
          height={130}
          src={imageUrl}
          className="rounded-lg object-cover shadow-sm"
          alt="Product"
          preview={{
            mask: <div className="">Preview</div>,
          }}
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 ">
        {/* ASIN Section */}
        <div className="mb-1">
          <div className="font-semibold text-gray-800 ">ASIN:</div>
          <div className="flex items-center gap-1">
            <StatusComponent title={asin} color={dataColors.pending} />
            <LinkOutlined className="text-blue-600 " />
          </div>
        </div>

        {/* SKU Section */}
        <div className="mb-1">
          <div className="font-semibold text-gray-800 ">SKU:</div>
          <StatusComponent title={sku} color={dataColors.asin} />
        </div>

        {/* Status Section */}
        <div className="mb-2">
          <div className="font-semibold text-gray-800 ">Status:</div>
          <StatusComponent title={status} color={dataColors.pending} />
        </div>

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
