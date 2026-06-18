import React, { memo, useCallback, useEffect, useState } from 'react';
import { Button, InputNumber } from 'antd';
import { toast } from 'sonner';
import { updateOrderItemQuantity } from '../../../apis/order';

const SubItemQuantity = ({ quantity = null, orderId = '', orderItemId = '', editable = false, onUpdated, updateQuantity = updateOrderItemQuantity }) => {
  const normalizedQuantity = Number(quantity) > 0 ? Number(quantity) : 1;
  const [fulfillQty, setFulfillQty] = useState(normalizedQuantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const hasQuantityChanged = Number(fulfillQty) !== normalizedQuantity;

  useEffect(() => {
    setFulfillQty(normalizedQuantity);
  }, [normalizedQuantity]);

  const handleUpdate = useCallback(async () => {
    if (!editable || !orderId || !orderItemId || isUpdating) {
      return;
    }

    const nextQuantity = Number(fulfillQty);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      setFulfillQty(normalizedQuantity);
      toast.error('Fulfill Qty must be at least 1');
      return;
    }

    if (nextQuantity === normalizedQuantity) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await updateQuantity(orderId, orderItemId, { quantity: nextQuantity });

      if (response.status === 200) {
        toast.success(`Updated fulfill qty for ${orderItemId}`);
        onUpdated?.();
      } else {
        throw new Error(response?.data?.message || 'Update fulfill qty failed');
      }
    } catch (error) {
      console.error(error);
      setFulfillQty(normalizedQuantity);
      toast.error(error?.response?.data?.message || 'Failed to update fulfill qty');
    } finally {
      setIsUpdating(false);
    }
  }, [editable, fulfillQty, isUpdating, normalizedQuantity, onUpdated, orderId, orderItemId, updateQuantity]);

  return (
    <div>
      <div className="flex-col gap-2 mb-2">
        <div>
          <span className="font-medium">Quantity</span>
        </div>
        <InputNumber width={10} disabled value={normalizedQuantity} />
      </div>
      <div className="flex-col gap-2">
        <div>
          <span className="font-medium">Fulfill Qty</span>
        </div>
        <div className="flex items-center gap-2">
          <InputNumber
            width={10}
            min={1}
            value={fulfillQty}
            disabled={!editable || isUpdating}
            onChange={(value) => setFulfillQty(typeof value === 'number' ? value : normalizedQuantity)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleUpdate();
              }
            }}
          />
          {editable && (
            <Button size="small" type="primary" loading={isUpdating} disabled={!hasQuantityChanged || isUpdating} onClick={handleUpdate}>
              OK
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(SubItemQuantity);
