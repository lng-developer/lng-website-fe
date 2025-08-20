import { useOutletContext } from 'react-router-dom';
import DateRangePicker from '../../components/DateRangePicker';
import { FaBox, FaDollarSign, FaUser, FaRedo, FaGift, FaPercentage } from 'react-icons/fa';
import SelectFilter from '../../components/SelectFilter';
import { Input, Pagination, Table } from 'antd';
import { dataColors } from '../../utils/dataColors';
import StatusComponent from '../../components/StatusComponent';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { useState } from 'react';

const data = [
  {
    orderId: '111-7539314-4577006',
    date: 'Aug 13, 2025 (8 hours ago)',
    shop: 'Acc 166',
    source_type: 'Amazon',
    revenue: 30.85,
    tip: 1.25,
    tax: 1.37,
    fee: 2.15,
    refund: 0,
    profit: 15.37,
    lng_cost: 11.71,
    cost: 12.5,
    diff: 0.79,
  },
  {
    orderId: '114-4079240-0826657',
    date: 'Aug 13, 2025 (6 hours ago)',
    shop: 'Acc 124',
    source_type: 'Amazon',
    revenue: 55.75,
    tip: 0,
    tax: 3.91,
    fee: 2.5,
    refund: 5.0,
    profit: 20.66,
    lng_cost: 23.68,
    cost: 25.0,
    diff: 1.32,
  },
  {
    orderId: 'ET-925-8871',
    date: 'Aug 12, 2025 (10 hours ago)',
    shop: 'Acc 077',
    source_type: 'Etsy',
    revenue: 41.2,
    tip: 2.0,
    tax: 0,
    fee: 4.12,
    refund: 3.0,
    profit: 19.58,
    lng_cost: 11.9,
    cost: 12.5,
    diff: 0.6,
  },
];

const ReportOrderCost = () => {
  const { collapsed } = useOutletContext();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);

  const handleExpand = (expanded, record) => {
    if (expanded) {
      if (expandedRowKeys) {
        setExpandedRowKeys([...expandedRowKeys, record.key]);
      }
    } else {
      setExpandedRowKeys(expandedRowKeys?.filter((key) => key !== record.key));
    }
  };

  const handleShowRowKeys = () => {
    if (isShowRowkeys) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(data.map((item) => item.key));
    }
    setIsShowRowKeys((prev) => !prev);
  };

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
    <div className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md">
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

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Date Order</span>,
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      fixed: 'left',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Shop</span>,
      dataIndex: 'shop',
      key: 'shop',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Name & Order ID</span>,
      dataIndex: 'orderId',
      key: 'orderId',
      align: 'center',
      fixed: 'left',
      render: (text) => <StatusComponent color={dataColors.asin} title={text} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Source type</span>,
      dataIndex: 'source_type',
      key: 'customize_size_key',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Revenue</span>,
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Tip</span>,
      dataIndex: 'tip',
      key: 'tip',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Tax</span>,
      dataIndex: 'tax',
      key: 'tax',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Fee</span>,
      dataIndex: 'fee',
      key: 'fee',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Refund</span>,
      dataIndex: 'refund',
      key: 'refund',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Profit</span>,
      dataIndex: 'profit',
      key: 'profit',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Cost</span>,
      dataIndex: 'lng_cost',
      key: 'lng_cost',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Cost</span>,
      dataIndex: 'cost',
      key: 'cost',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Diff</span>,
      dataIndex: 'diff',
      key: 'diff',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
  ];

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
                title="Select shop"
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
          <Table
            className="no-indent-table"
            columns={columns}
            dataSource={data}
            expandable={{
              indentSize: 0,
              expandedRowRender: () => {},
              expandIcon: ({ expanded, onExpand, record }) => (
                <div className="flex justify-center items-center  h-full w-full cursor-pointer" onClick={(e) => onExpand(record, e)}>
                  {expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
              expandedRowKeys: expandedRowKeys,
              onExpand: handleExpand,
              columnTitle: (
                <div className="flex justify-center items-center  h-full w-full cursor-pointer" onClick={handleShowRowKeys}>
                  {isShowRowkeys ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
            }}
            bordered={true}
            pagination={false}
            rowKey="key"
          />
        </div>
      </div>
    </div>
  );
};

export default ReportOrderCost;
