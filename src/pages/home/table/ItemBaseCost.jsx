import { Button, Flex, Input, Popover } from 'antd';
import { updateBaseCost } from '../../../apis/order';
import { toast } from 'react-toastify';

const ItemBaseCost = ({ orderId, base_cost }) => {
  const content = (
    <Input
      defaultValue={base_cost ? base_cost : 0}
      size="small"
      style={{
        width: 50,
      }}
      prefix="$"
      onBlur={async (e) => {
        const newValue = parseFloat(e.target.value);
        const oldValue = parseFloat(base_cost);
        if (!isNaN(newValue) && newValue !== oldValue) {
          try {
            await updateBaseCost(orderId, newValue);
            toast.success(`Updated base cost for ${orderId}`);
          } catch (err) {
            console.error(err);
            toast.error(`Failed to update base cost for ${orderId}`);
          }
        }
      }}
      onPressEnter={(e) => {
        e.target.blur();
      }}
    />
  );
  return (
    <Popover content={content}>
      <div className="cursor-pointer">
        <span className="font-medium hover:text-blue-600">${base_cost ? base_cost : 0}</span>
      </div>
    </Popover>
  );
};

export default ItemBaseCost;
