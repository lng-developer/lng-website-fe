import StatusComponent from '../../../components/StatusComponent';
import { Link } from 'react-router-dom';
import { dataColors } from '../../../utils/dataColors';
import { RiLinkM } from 'react-icons/ri';
import { Tooltip } from 'antd';

const SubItemSku = ({ sku, asin, seller }) => {
  return (
    <div className="text-left">
      {sku && (
        <div className="flex-col gap-2 mb-2">
          <div className="flex items-center">
            <span className="font-medium">SKU:</span>
          </div>
          <div>
            <StatusComponent title={sku} color={dataColors.asin} />
          </div>
        </div>
      )}
      {asin && (
        <div className="flex-col gap-2 mb-2">
          <div className="flex items-center">
            <span className="font-medium">ASIN:</span>
          </div>
          <div className="flex gap-1 items-center">
            <StatusComponent title={asin} color={dataColors.pending} />
            <Tooltip title="Open Link">
              <Link target="_blank" className="!text-black" to={`http://amazon.com/gp/product/${asin}`}>
                <RiLinkM size={18} />
              </Link>
            </Tooltip>
          </div>
        </div>
      )}
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="font-medium">PSD ID:</span>
        </div>
        <div>
          <StatusComponent title="No data" color={dataColors.success} />
        </div>
      </div>
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="font-medium">Seller:</span>
        </div>
        <div>
          <StatusComponent title={seller?.full_name || 'No data'} color={dataColors.process} />
        </div>
      </div>
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="font-medium">Team:</span>
        </div>
        <div>
          <StatusComponent title="LNG Group" color={dataColors.pink} />
        </div>
      </div>
    </div>
  );
};

export default SubItemSku;
