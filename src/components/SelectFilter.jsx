import { Button, Divider, Dropdown, Input, Radio } from 'antd';
import { useMemo, useState } from 'react';
import { MdAddCircleOutline } from 'react-icons/md';
import { CloseOutlined } from '@ant-design/icons';
import { LuChevronsUpDown } from 'react-icons/lu';

const SelectFilter = ({ ListData = [], value, onChange, title, isSeller = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Lọc danh sách vendor theo từ khóa
  const filteredVendors = useMemo(() => {
    if (!search.trim()) return ListData;
    return ListData.filter((v) => v.toLowerCase().includes(search.toLowerCase()));
  }, [ListData, search]);

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
    <div style={{ width: 240, backgroundColor: 'white' }} className="shadow-sm rounded-lg">
      <div style={{ padding: '8px 8px 4px' }}>
        <Input allowClear value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search`} />
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto', padding: '8px' }}>
        <Radio.Group
          value={value}
          onChange={(e) => handleSelect(e.target.value)}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {filteredVendors.map((vendor) => (
            <Radio
              key={vendor}
              value={vendor}
              style={{ paddingLeft: 10, paddingTop: 5, paddingBottom: 5, marginRight: 0 }}
              className="hover:bg-[#f1f5f9] rounded-lg"
            >
              {vendor}
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
          borderStyle: isSeller ? 'solid' : 'dashed',
          width: isSeller ? '190px' : 'auto',
          justifyContent: isSeller ? 'space-between' : 'center',
        }}
        className="border-dashed inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9]"
      >
        {!isSeller && (
          <div className="">
            <MdAddCircleOutline />
          </div>
        )}
        <span className="text-sm font-medium" style={{ color: 'black' }}>
          {title}
        </span>
        {!isSeller && value && (
          <>
            <span style={{ padding: '0 8px', color: '#d9d9d9' }}>|</span>
            <span style={{ color: '#555' }}>{value}</span>
          </>
        )}
        {isSeller && <LuChevronsUpDown className="ml-2" />}
      </div>
    </Dropdown>
  );
};

export default SelectFilter;
