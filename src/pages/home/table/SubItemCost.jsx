import { Select, Input } from 'antd';
const { TextArea } = Input;

const SubItemCost = () => {
  return (
    <div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Vendor Product:</span>
        </div>
        <Select
          defaultValue="jack"
          style={{ width: 220 }}
          options={[
            { value: 'jack', label: 'CustomCat - CC1717 Heavyweight Garment-Dyed T-Shirt-1 side' },
            { value: 'lucy', label: 'Lucy' },
            { value: 'Yiminghe', label: 'yiminghe' },
          ]}
        />
      </div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Size:</span>
        </div>
        <Select
          defaultValue="XL"
          style={{ width: 220 }}
          options={[
            { value: 'XL', label: 'XL' },
            { value: 'M', label: 'M' },
            { value: '2XL', label: '2XL' },
          ]}
        />
      </div>
      <div className="mb-2">
        <div>
          <span className="font-medium">Color:</span>
        </div>
        <Select
          defaultValue="lucy"
          style={{ width: 220 }}
          options={[
            { value: 'jack', label: 'Jack' },
            { value: 'lucy', label: 'Lucy' },
            { value: 'Yiminghe', label: 'yiminghe' },
          ]}
        />
      </div>
      <div className="">
        <div>
          <span className="font-medium">Fulfill Name:</span>
        </div>
        <TextArea
          rows={2}
          defaultValue={'112-6460110-1390647-134590789220641-0'}
          value="112-6460110-1390647-134590789220641-0"
          maxLength={200}
          style={{ width: 220 }}
        />
      </div>
    </div>
  );
};

export default SubItemCost;
