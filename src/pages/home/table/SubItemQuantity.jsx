import { InputNumber } from 'antd';

const SubItemQuantity = ({ quantity = null }) => {
  return (
    <div>
      <div className="flex-col gap-2 mb-2">
        <div>
          <span className="font-medium">Quantity</span>
        </div>
        <InputNumber width={10} disabled={true} defaultValue={quantity} />
      </div>
      <div className="flex-col gap-2">
        <div>
          <span className="font-medium">Fulfill Qty</span>
        </div>
        <InputNumber width={10} min={1} max={10} defaultValue={3} />
      </div>
    </div>
  );
};

export default SubItemQuantity;
