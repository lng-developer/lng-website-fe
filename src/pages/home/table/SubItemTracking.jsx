import { Input, Select } from 'antd';
import TextArea from 'antd/es/input/TextArea';

const SubItemTracking = () => {
  return (
    <div>
      <div className="mb-2">
        <Input style={{ width: 220 }} />
      </div>
      <div className="mb-2">
        <Input style={{ width: 220 }} placeholder="Tracking" />
      </div>
      <div className="mb-2">
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
      <TextArea rows={2} placeholder="Note" maxLength={200} style={{ width: 220 }} />
    </div>
  );
};

export default SubItemTracking;
