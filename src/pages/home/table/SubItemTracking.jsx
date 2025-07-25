import { Input, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { updateStatusOrder } from '../../../apis/order';
import { toast } from 'react-toastify';

const SubItemTracking = ({ orderId = '', status = '', fetchAllOrder }) => {
  const handleSelect = async (value) => {
    try {
      const result = await updateStatusOrder(orderId, value);
      if (result.status === 200) {
        toast.success(result.data?.message);
        fetchAllOrder();
      } else {
        toast.error(result.data?.message);
      }
    } catch (error) {
      toast.error(error.response.data?.message);
      console.log(error);
    }
  };
  return (
    <div>
      <div className="mb-2">
        <Input style={{ width: 220 }} placeholder="Fulfillment" />
      </div>
      <div className="mb-2">
        <Input style={{ width: 220 }} placeholder="Tracking" />
      </div>
      <div className="mb-2">
        <Select
          defaultValue={status}
          style={{ width: 220 }}
          onChange={(value) => handleSelect(value)}
          options={[
            { value: 'New', label: 'New' },
            { value: 'Fulfilled', label: 'Fulfilled' },
            { value: 'Shipped', label: 'Shipped' },
            { value: 'Cancelled', label: 'Cancelled' },
          ]}
        />
      </div>
      <TextArea rows={2} placeholder="Note" maxLength={200} style={{ width: 220 }} />
    </div>
  );
};

export default SubItemTracking;
