import { Image, Tooltip } from 'antd';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { Link } from 'react-router-dom';
import { RiLinkM } from 'react-icons/ri';
import LazyImage from '../../components/LazyImage';

const ItemProductInfoQC = ({ link, sku, asin, quantity, listing }) => {
  return (
    <div className="flex items-center gap-5">
      <div
        className="w-[100px] h-[100px] rounded-lg overflow-hidden flex gap-2"
        style={{
          boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
        }}
      >
        <LazyImage src={listing?.product_image || link} width={100} height={100} preview={true} />
      </div>
      <div className="">
        <div className="flex-col">
          <div className="font-medium text-left">Sku:</div>
          <div className="text-left">
            <StatusComponent title={sku} color={dataColors.asin} />
          </div>
        </div>
        <div className="flex-col">
          <div className="font-medium text-left">Asin:</div>
          <div className="text-left flex gap-1 items-center">
            <StatusComponent title={asin} color={dataColors.pending} />
            <Tooltip title="Open Link">
              <Link target="_blank" className="!text-black" to={`http://amazon.com/gp/product/${asin}`}>
                <RiLinkM size={18} />
              </Link>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-center">
          <div className="font-medium text-left">
            <span>Quantity:</span> <span style={{ color: dataColors.success }}> {quantity}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemProductInfoQC;
