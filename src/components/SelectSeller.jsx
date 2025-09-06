import { Button, Divider, Dropdown, Input, Radio } from 'antd';
import { useMemo, useState } from 'react';
import { MdAddCircleOutline } from 'react-icons/md';
import { CloseOutlined } from '@ant-design/icons';

const SelectSeller = ({ ListData = [], value, onChange, title = 'Select Seller' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Chuẩn hoá ListData về {label, value}
  const options = useMemo(() => {
    return (Array.isArray(ListData) ? ListData : []).map((it) => {
      const val = it?.value ?? it?._id ?? it?.id ?? it?.email ?? it; // fallback
      const lab = it?.label ?? it?.full_name ?? it?.name ?? String(val ?? '');
      return { label: lab, value: val };
    });
  }, [ListData]);

  // Tìm label đang chọn để hiển thị ở trigger
  const selectedLabel = useMemo(() => {
    const found = options.find((o) => String(o.value) === String(value));
    return found?.label || '';
  }, [options, value]);

  // Lọc theo search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

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
    <div
      style={{
        width: 260,
        backgroundColor: 'white',
        boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
      }}
      className="rounded-lg"
    >
      <div style={{ padding: '8px 8px 4px' }}>
        <Input allowClear value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" />
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto', padding: '8px' }}>
        <Radio.Group
          value={value}
          onChange={(e) => handleSelect(e.target.value)}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {filtered.map((opt) => (
            <Radio
              key={String(opt.value)}
              value={opt.value}
              style={{ paddingLeft: 10, paddingTop: 5, paddingBottom: 5, marginRight: 0 }}
              className="hover:bg-[#f1f5f9] rounded-lg"
            >
              {opt.label}
            </Radio>
          ))}
        </Radio.Group>

        {filtered.length === 0 && <div style={{ paddingTop: 8, textAlign: 'center', color: '#aaa' }}>Not found</div>}
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
    <Dropdown trigger={['click']} open={open} onOpenChange={setOpen} dropdownRender={() => menu} placement="bottomLeft">
      <div
        style={{
          color: 'black',
          borderStyle: 'dashed',
          width: 'auto',
          justifyContent: 'center',
        }}
        className="border-dashed inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer hover:bg-[#f1f5f9] whitespace-nowrap"
      >
        <MdAddCircleOutline />
        <span className="text-sm font-medium" style={{ color: 'black' }}>
          {title}
        </span>
        {selectedLabel && (
          <>
            <span style={{ padding: '0 8px', color: '#d9d9d9' }}>|</span>
            <span style={{ color: '#555' }}>{selectedLabel}</span>
          </>
        )}
      </div>
    </Dropdown>
  );
};

export default SelectSeller;
