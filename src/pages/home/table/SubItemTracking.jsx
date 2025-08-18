import { Button, Input, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { trackingOrder } from '../../../apis/order';
import { memo, useState } from 'react';
import { toast } from 'sonner';

const SubItemTracking = ({ orderId = '', tracking_info = {}, fetchAllOrder, filters, fetchCountStatus, orderItemId }) => {
  const [fulfillment, setFulfilment] = useState(tracking_info?.fulfillment);
  const [tracking, setTracking] = useState(tracking_info?.tracking);
  const [note, setNote] = useState(tracking_info?.note);
  const [statusSelect, setStatusSelect] = useState(tracking_info?.status);
  const [changeTracking, setChangeTracking] = useState(false);

  const handleTracking = async () => {
    if (changeTracking) {
      setStatusSelect('Shipped');
    }
    try {
      const response = await trackingOrder(orderId, orderItemId, {
        fulfillment: fulfillment,
        tracking: tracking,
        status: statusSelect,
        note: note,
      });

      if (response.status == 200) {
        toast.success('Update tracking success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Update tracking error!');
    } finally {
      fetchAllOrder(filters);
      fetchCountStatus();
    }
  };

  return (
    <div>
      <div className="mb-2">
        <Input value={fulfillment} style={{ width: 220 }} placeholder="Fulfillment" onChange={(e) => setFulfilment(e.target.value)} />
      </div>
      <div className="mb-2">
        <Input value={tracking} style={{ width: 220 }} placeholder="Tracking" onChange={(e) => setTracking(e.target.value)} />
      </div>
      <div className="mb-2">
        <Select
          defaultValue={tracking_info?.status}
          value={statusSelect}
          style={{ width: 220 }}
          onChange={(value) => {
            setChangeTracking(true);
            setStatusSelect(value);
          }}
          options={[
            { value: 'New', label: 'New' },
            { value: 'Fulfilled', label: 'Fulfilled' },
            { value: 'Shipped', label: 'Shipped' },
            { value: 'Cancelled', label: 'Cancelled' },
          ]}
        />
      </div>
      <div className="mb-2">
        <TextArea
          value={note}
          rows={2}
          placeholder="Note"
          maxLength={200}
          style={{ width: 220 }}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <Button color="primary" onClick={handleTracking}>
        Update tracking
      </Button>
    </div>
  );
};

export default memo(SubItemTracking);
