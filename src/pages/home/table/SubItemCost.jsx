import { Select, Tooltip } from 'antd';
import { LuChevronsUpDown } from 'react-icons/lu';
import { toast } from 'sonner';
import { CopyOutlined } from '@ant-design/icons';

const SubItemCost = ({ data = {}, vendorProduct, fulfillName }) => {
  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.log(err);
      toast.error('Failed to copy!');
    }
  };
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
      <div className="mb-1 max-w-[250px]" style={{ position: 'relative', width: '100%' }}>
        <div className="font-semibold text-gray-800 mb-1">Fulfill Name:</div>
        <div>
          <div
            className="border px-2 py-1 rounded text-sm inline-flex items-center
               max-w-[250px] break-words"
            style={{ borderColor: '#08969b', fontWeight: 500 }}
          >
            {fulfillName}
          </div>
          <Tooltip title="Copy">
            <CopyOutlined
              onClick={() => handleCopy(fulfillName)}
              style={{
                position: 'absolute',
                top: 35,
                right: 5,
                cursor: 'pointer',
                color: '#08969b',
              }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default SubItemCost;
