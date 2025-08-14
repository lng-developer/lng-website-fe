import { Select, Input } from 'antd';
import { LuChevronsUpDown } from 'react-icons/lu';
const { TextArea } = Input;

const SubItemCost = ({ data = {}, vendorProduct }) => {
  return (
    <div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Vendor Product:</span>
        </div>
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: 250 }}
          value={data?.vendorProductDisplayName}
          options={vendorProduct}
          placeholder="Select Vendor"
          className="truncate"
          suffixIcon={<LuChevronsUpDown />}
        />
      </div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Size:</span>
        </div>
        <Select style={{ width: 250 }} value={data?.sizeValue} options={[]} placeholder="Select Size" suffixIcon={<LuChevronsUpDown />} />
      </div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Color:</span>
        </div>
        <Select style={{ width: 250 }} value={data?.colorValue} options={[]} placeholder="Select Color" suffixIcon={<LuChevronsUpDown />} />
      </div>
      <div className="">
        <div>
          <span className="font-medium">Fulfill Name:</span>
        </div>
        <TextArea rows={2} maxLength={200} style={{ width: 250 }} />
      </div>
    </div>
  );
};

export default SubItemCost;
