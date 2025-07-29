import { Select, Input } from 'antd';
const { TextArea } = Input;

const SubItemCost = () => {
  return (
    <div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Vendor Product:</span>
        </div>
        <Select style={{ width: 220 }} options={[]} placeholder="Select Vendor" />
      </div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Size:</span>
        </div>
        <Select style={{ width: 220 }} options={[]} placeholder="Select Size" />
      </div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Color:</span>
        </div>
        <Select style={{ width: 220 }} options={[]} placeholder="Select Color" />
      </div>
      <div className="">
        <div>
          <span className="font-medium">Fulfill Name:</span>
        </div>
        <TextArea rows={2} maxLength={200} style={{ width: 220 }} />
      </div>
    </div>
  );
};

export default SubItemCost;
