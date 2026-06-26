import { Button, Divider, Dropdown, Input, Radio } from 'antd';
import { useMemo, useState } from 'react';
import { MdAddCircleOutline } from 'react-icons/md';
import { CloseOutlined } from '@ant-design/icons';

const SelectProductType = ({ ListData = [], value, onChange, title }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredVendors = useMemo(() => {
    if (!search.trim()) return ListData;
    return ListData.filter((v) => v?.label?.toLowerCase().includes(search.toLowerCase()));
  }, [ListData, search]);

  const selectLabel = useMemo(() => ListData.find((item) => item?.value === value)?.label || '', [ListData, value]);

  const handleSelect = (val) => {
    onChange?.(val);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange?.(null);
    setOpen(false);
    setSearch('');
  };

  const menu = (
    <div style={{ width: 'auto', backgroundColor: 'white' }} className="shadow-sm rounded-lg">
      <div style={{ padding: '8px 8px 4px' }}>
        <Input allowClear value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${title}`} />
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto', padding: '8px' }}>
        <Radio.Group
          value={value}
          onChange={(e) => handleSelect(e.target.value)}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {filteredVendors.map((data) => (
            <Radio
              key={data?.value}
              value={data?.value}
              style={{ paddingLeft: 10, paddingTop: 5, paddingBottom: 5, marginRight: 0 }}
              className="hover:bg-[#f1f5f9] rounded-lg"
            >
              {data?.label}
            </Radio>
          ))}
        </Radio.Group>
        {filteredVendors.length === 0 && <div style={{ paddingTop: 8, textAlign: 'center', color: '#aaa' }}>Not found</div>}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <Button icon={<CloseOutlined />} type="text" onClick={handleClear} danger>
          Clear filters
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown trigger={['click']} open={open} onOpenChange={setOpen} popupRender={() => menu} placement="bottomLeft">
      <div
        style={{
          color: 'black',
          borderStyle: 'dashed',
          maxWidth: 240,
          justifyContent: 'center',
        }}
        className="border-dashed inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]"
      >
        <div className="">
          <MdAddCircleOutline />
        </div>
        <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'black' }}>
          {title}
        </span>
        {selectLabel && (
          <>
            <span style={{ padding: '0 8px', color: '#d9d9d9' }}>|</span>
            <span className="truncate" style={{ color: '#555' }}>
              {selectLabel}
            </span>
          </>
        )}
      </div>
    </Dropdown>
  );
};

export default SelectProductType;
