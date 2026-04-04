import { Input, Popover } from 'antd';
import { updateBaseCost } from '../../../apis/order';
import { memo, useEffect, useState } from 'react';
import useDebounce from '../../../hooks/useDebounce';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';

const ItemBaseCost = ({ orderId, base_cost, fetchAllOrder, filters }) => {
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const debounce = useDebounce(value, 600);
  const handleChange = async () => {
    const newValue = parseFloat(value);
    const oldValue = parseFloat(base_cost);
    if (!isNaN(newValue) && newValue !== oldValue) {
      try {
        await updateBaseCost(orderId, newValue);
        toast.success(`Updated base cost for ${orderId}`);
        fetchAllOrder(filters);
      } catch (err) {
        console.error(err);
        toast.error(`Failed to update base cost for ${orderId}`);
      }
    }
  };
  const content = (
    <Input
      defaultValue={base_cost ? base_cost : 0}
      size="small"
      style={{
        width: 70,
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
    <>
      {user?.role === 'Admin' ? (
        <Popover content={content}>
          <div className="cursor-pointer">
            <span className="font-medium hover:text-blue-600">${base_cost ? parseFloat(base_cost).toFixed(2) : '0.00'}</span>
          </div>
        </Popover>
      ) : (
        <div className="cursor-pointer">
          <span className="font-medium">${base_cost ? parseFloat(base_cost).toFixed(2) : '0.00'}</span>
        </div>
      )}
    </>
  );
};

export default memo(ItemBaseCost);
