import { Image } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import NoImage from '../../../assets/NoImage.jpg';
import { FcApproval } from 'react-icons/fc';

const SubItemImage = ({ linkImage = '' }) => {
  return (
    <div>
      <div className="w-[130px] h-[130px] rounded-lg overflow-hidden flex gap-2">
        <Image width={130} src={linkImage ? linkImage : NoImage} className="rounded-lg" />
      </div>
      <div className="mt-3">
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">PSD:</span>
            <FcApproval />
          </div>
          <div>
            <StatusComponent title="No data" color="#38a00b" />
          </div>
        </div>
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">ASIN Type:</span>
          </div>
          <div>
            <StatusComponent title="No data" color="#0958d7" />
          </div>
        </div>
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">PNG Status:</span>
          </div>
          <div>
            <StatusComponent title="No data" color={dataColors.success} />
          </div>
        </div>
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">Scale By:</span>
          </div>
          <div>
            <StatusComponent title="No data" color={dataColors.process} />
          </div>
        </div>
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">QC By:</span>
          </div>
          <div>
            <StatusComponent title="No data" color={dataColors.pink} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubItemImage;
