import StatusComponent from '../../../components/StatusComponent';
import { VscLink } from 'react-icons/vsc';
import { Link } from 'react-router-dom';
import { dataColors } from '../../../utils/dataColors';

const SubItemSku = () => {
  return (
    <div className="text-left">
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="mr-2 font-medium">SKU:</span>
        </div>
        <div className="flex gap-2  items-center">
          <StatusComponent title="G240279-TS-040725-002" color="#08969b" />
          <Link to="">
            <VscLink size={15} />
          </Link>
        </div>
      </div>
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="mr-2 font-medium">ASIN:</span>
        </div>
        <div>
          <StatusComponent title="B0FGQ97FHP" color={dataColors.pending} />
        </div>
      </div>
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="mr-2 font-medium">PSD ID:</span>
        </div>
        <div>
          <StatusComponent title="16KYKFeQzk4r" color={dataColors.success} />
        </div>
      </div>
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="mr-2 font-medium">Seller:</span>
        </div>
        <div>
          <StatusComponent title="Phùng Văn Hoàng" color={dataColors.purple} />
        </div>
      </div>
      <div className="flex-col gap-2 mb-2">
        <div className="flex items-center">
          <span className="mr-2 font-medium">Team:</span>
        </div>
        <div>
          <StatusComponent title="Part 6 - Team 5" color={dataColors.process} />
        </div>
      </div>
    </div>
  );
};

export default SubItemSku;
