import StatusComponent from '../../../components/StatusComponent';
import { Link } from 'react-router-dom';
import { dataColors } from '../../../utils/dataColors';
import { FaLink } from 'react-icons/fa6';

const SubItemSku = ({ sku, asin }) => {
  return (
    <div className="text-left">
      {sku && (
        <div className="flex-col gap-2 mb-2">
          <div className="flex items-center">
            <span className="font-medium">SKU:</span>
          </div>
          <div className="flex gap-2 items-center">
            <StatusComponent title={sku} color="#08969b" />
            <Link target="_blank" to={`http://amazon.com/gp/product/${asin}`}>
              <FaLink size={18} />
            </Link>
          </div>
        </div>
      )}
      {asin && (
        <div className="flex-col gap-2 mb-2">
          <div className="flex items-center">
            <span className="font-medium">ASIN:</span>
          </div>
          <div>
            <StatusComponent title={asin} color={dataColors.pending} />
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
          <StatusComponent title="No data" color={dataColors.purple} />
        </div>
      </div>
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="font-medium">Team:</span>
        </div>
        <div>
          <StatusComponent title="No data" color={dataColors.process} />
        </div>
      </div>
    </div>
  );
};

export default SubItemSku;
