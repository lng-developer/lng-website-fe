import { useOutletContext } from 'react-router-dom';
import DateRangePicker from '../../components/DateRangePicker';
import { FaBox, FaDollarSign, FaUser, FaRedo, FaGift, FaPercentage } from 'react-icons/fa';
import SelectFilter from '../../components/SelectFilter';
import { Input, Pagination } from 'antd';

const ReportOrderCost = () => {
  const { collapsed } = useOutletContext();
  const defaultItems = [
    { key: 'orders', label: 'Orders', value: 130, icon: <FaBox className="text-white" />, iconBg: 'bg-slate-600' },
    { key: 'revenue', label: 'Revenue', value: 6859.73, prefix: '$', icon: <FaDollarSign className="text-white" />, iconBg: 'bg-rose-500' },
    { key: 'profit', label: 'Profit', value: 3360.53, prefix: '$', icon: <FaUser className="text-white" />, iconBg: 'bg-blue-500' },
    { key: 'lng', label: 'LNG Cost', value: 2333.05, prefix: '$', icon: <FaDollarSign className="text-white" />, iconBg: 'bg-emerald-500' },
    {
      key: 'vendor',
      label: 'Vendor Cost',
      value: 7.33,
      prefix: '$',
      icon: <FaDollarSign className="text-white" />,
      iconBg: 'bg-amber-500',
    },
    { key: 'diff', label: 'Diff', value: 2325.72, prefix: '$', icon: <FaPercentage className="text-white" />, iconBg: 'bg-violet-500' },
    { key: 'refund', label: 'Refund', value: 0, prefix: '$', icon: <FaRedo className="text-white" />, iconBg: 'bg-fuchsia-500' },
    { key: 'tip', label: 'Tip', value: 0, prefix: '$', icon: <FaGift className="text-white" />, iconBg: 'bg-yellow-400' },
    { key: 'tax', label: 'Tax', value: 0, prefix: '$', icon: <FaPercentage className="text-white" />, iconBg: 'bg-orange-500' },
    { key: 'totalTaxRefund', label: 'Total Tax Refund', value: 0, icon: <FaRedo className="text-white" />, iconBg: 'bg-sky-500' },
    { key: 'tipOrder', label: 'Tip Order', value: 0, icon: <FaGift className="text-white" />, iconBg: 'bg-sky-500' },
  ];

  const formatNumber = (n) =>
    typeof n === 'number' ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n;

  const IconWrap = ({ bg, children }) => <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>{children}</div>;

  const Card = ({ item }) => (
    <div className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <IconWrap bg={item.iconBg}>{item.icon}</IconWrap>
        <div className="text-slate-600 text-[13px] leading-4 font-medium">{item.label}</div>
      </div>
      <div className="text-right tabular-nums font-semibold text-slate-800">
        {typeof item.value === 'number' ? (
          <span>
            {item.prefix || ''}
            {formatNumber(item.value)}
          </span>
        ) : (
          <span>{item.value}</span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Orders Cost
          </h1>
          <div className="flex justify-center items-center">
            <DateRangePicker
              mode="range"
              showOutsideDays
              modifiersClassNames={{
                selected: 'my-selected',
                range_middle: 'my-range-middle',
              }}
              modifiersStyles={{
                range_middle: {
                  backgroundColor: '#f3f4f6', // màu xám nhạt
                  fontWeight: 'normal', // không in đậm
                },
              }}
              // updateFilter={updateFilter}
            />
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex items-center gap-4 w-full">
          <div className="w-full">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {defaultItems.map((it) => (
                <Card key={it.key || it.label} item={it} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <Input
              // onChange={handleSearch}
              placeholder="Search orders by ID, Customer..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectFilter
                title="Shipping Type"
                ListData={['Second Day', 'Ground', 'Overnight', 'Economy', 'Standard', 'Expedited']}
                // value={shippingType}
                // onChange={(val) => {
                //   setShippingType(val);
                //   updateFilter({ shippingType: val });
                // }}
              />
              <SelectFilter
                title="Shop"
                // ListData={shops.map((item) => item.name)}
                // value={selectShop}
                // onChange={(val) => {
                //   console.log(val);

                //   setSelectShop(val);
                //   updateFilter({ shopName: val });
                // }}
              />
            </div>
          </div>
          <div>
            <Pagination
              total={50}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={10}
              defaultCurrent={1}
              // onChange={handlePageChange}
              // onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          {/* <Table columns={columns} dataSource={dataSource} rowKey="key" bordered={true} pagination={false} scroll={{ x: 'max-content' }} /> */}
        </div>
      </div>
    </div>
  );
};

export default ReportOrderCost;
