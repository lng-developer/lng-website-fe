import { Button, Flex, Input, Popover } from 'antd';
import { updateBaseCost } from '../../../apis/order';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import useDebounce from '../../../hooks/useDebounce';

const ItemBaseCost = ({ orderId, base_cost, fetchAllOrder, filters }) => {
  const [value, setValue] = useState('');
  const debounce = useDebounce(value, 600);
  const handleChange = async () => {
    const newValue = parseFloat(value);
    const oldValue = parseFloat(base_cost);
    if (!isNaN(newValue) && newValue !== oldValue) {
      try {
        await updateBaseCost(orderId, newValue);
        toast.success(`Updated base cost for ${orderId}`, { autoClose: 1000 });
        fetchAllOrder(filters);
      } catch (err) {
        console.error(err);
        toast.error(`Failed to update base cost for ${orderId}`, { autoClose: 1000 });
      }
    }
  };
  const content = (
    <Input
      defaultValue={base_cost ? base_cost : 0}
      size="small"
      style={{
        width: 60,
      }}
      prefix="$"
      onChange={(e) => setValue(e.target.value)}
      onPressEnter={handleChange}
    />
  );

  useEffect(() => {
    handleChange();
  }, [debounce]);
  return (
    <Popover content={content}>
      <div className="cursor-pointer">
        <span className="font-medium hover:text-blue-600">${base_cost ? base_cost : 0}</span>
      </div>
    </Popover>
  );
};

export default ItemBaseCost;
