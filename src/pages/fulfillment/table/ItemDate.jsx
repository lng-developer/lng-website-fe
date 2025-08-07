import { Tag, Tooltip } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { dataColors } from '../../../utils/dataColors';
import StatusComponent from '../../../components/StatusComponent';

const ItemDate = ({
  createdAt = '28/12/2024 02:08',
  orderDate = '28/12/2024 01:12',
  type = 'Tool 95',
  monthsAgo = 7,
  showHistory = true,
}) => {
  return (
    <div className="  ">
      {/* Created At Section */}
      <div className="mb-3">
        <div className="mb-0.5 font-medium">Created At:</div>
        <div className="whitespace-nowrap">{createdAt}</div>
        <div className="" style={{ color: dataColors.title }}>
          ({monthsAgo} months)
        </div>
      </div>

      {/* Order Date Section */}
      <div className="mb-3">
        <div className="mb-0.5 font-medium">Order Date:</div>
        <div className="whitespace-nowrap">{orderDate}</div>
        <div className="" style={{ color: dataColors.title }}>
          ({monthsAgo} months)
        </div>
      </div>

      {/* Type Section */}
      <div className="mb-3">
        <div className="mb-1 font-medium">Type:</div>
        <StatusComponent title={type} color={dataColors.process} />
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="flex items-center gap-1 mt-2">
          <span className="font-medium">History:</span>
          <Tooltip title="View History">
            <HistoryOutlined className="text-gray-400 text-sm cursor-pointer hover:text-gray-600" />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default ItemDate;
