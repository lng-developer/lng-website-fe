import { Flex, Tag, Tooltip } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { dataColors } from '../../../utils/dataColors';
import StatusComponent from '../../../components/StatusComponent';
import { formatDate } from '../../../utils/fomatDate';
import { formatDistanceToNow } from 'date-fns';

const ItemDate = ({
  createdAt = '2025-08-13T03:49:59.600Z',
  orderDate = '2025-08-13T03:49:59.600Z',
  type = 'Tool 95',
  showHistory = true,
}) => {
  return (
    <div className="  ">
      {/* Created At Section */}
      <div className="mb-3">
        <div className="mb-0.5 font-medium">Created At:</div>
        <Flex vertical={true}>
          <span className="whitespace-nowrap">{formatDate(createdAt)}</span>
          <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
            ({formatDistanceToNow(createdAt, { addSuffix: true })})
          </span>
        </Flex>
      </div>

      {/* Order Date Section */}
      <div className="mb-3">
        <div className="mb-0.5 font-medium">Order Date:</div>
        <Flex vertical={true}>
          <span className="whitespace-nowrap">{formatDate(orderDate)}</span>
          <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
            ({formatDistanceToNow(orderDate, { addSuffix: true })})
          </span>
        </Flex>
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
