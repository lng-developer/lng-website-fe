import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { dataFilterStatusFulfillment } from '../../utils/dataFilter';
import { useState } from 'react';
import ButtonFilter from '../../components/ButtonFilter';
import { dataColors } from '../../utils/dataColors';
import { Input, Pagination, Table } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

const FulfillmentScale = () => {
  const { collapsed } = useOutletContext();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusFulfillment[0]);

  const handleClickButton = (item) => {
    setIsActivefilter(item);
  };

  const renderColor = (stt) => {
    switch (stt) {
      case 'Total':
        return dataColors.pending;
      case 'Pending':
        return dataColors.yellow;
      case 'InProgress':
        return dataColors.process;
      case 'Completed':
        return dataColors.success;
      case 'Rejected':
        return dataColors.cancelled;
      default:
        return dataColors.default;
    }
  };

  const columns = [
    { title: <span style={{ color: dataColors.title }}>Order Date</span>, dataIndex: 'order', key: 'ord', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Group ID</span>, dataIndex: 'status', key: 'customer', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Group Type</span>, dataIndex: 'created', key: 'date', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Status</span>, dataIndex: 'order_date', key: 'order_date', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Quality</span>,
      dataIndex: 'shipping_type',
      key: 'shipping_type',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Quantity</span>, dataIndex: 'customer', key: 'customer', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Order Owner</span>,
      dataIndex: 'config_cost_center',
      key: 'config_cost_center',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Scale By</span>, dataIndex: 'base_cost', key: 'basecost', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Express</span>, dataIndex: 'store', key: 'store', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Scale Status</span>,
      dataIndex: 'delivery_date',
      key: 'delivery_date',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Action</span>,
      dataIndex: 'handling_time',
      key: 'handling_time',
      align: 'center',
    },
  ];

  // Cột con trong bảng mở rộng
  const expandedRowRender = (record) => {
    const subColumns = [
      { title: <span style={{ color: dataColors.title }}>Image & Print Side</span>, dataIndex: 'product', key: 'product' },
      { title: <span style={{ color: dataColors.title }}>SKU, Variant & Seller</span>, dataIndex: 'sku', key: 'sku' },
      { title: <span style={{ color: dataColors.title }}>Customization</span>, dataIndex: 'price', key: 'price' },
      { title: <span style={{ color: dataColors.title }}>QTY</span>, dataIndex: 'quantity', key: 'quantity' },
      { title: <span style={{ color: dataColors.title }}>Cost Center</span>, dataIndex: 'cost_center', key: 'cost_center' },
      { title: <span style={{ color: dataColors.title }}>Tracking & Note</span>, dataIndex: 'tracking_note', key: 'tracking_note' },
    ];

    return (
      <Table columns={subColumns} dataSource={record.subItems} pagination={false} rowKey="key" rowClassName={() => 'table-row-center'} />
    );
  };

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Group Task Scale
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              //   onClick={handleClickAdd}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Vendor Fulfill
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex gap-3 items-center">
          {dataFilterStatusFulfillment.map((item, index) => (
            <button
              key={index}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-10 space-x-1 px-2 cursor-pointer hover:bg-[#f1f5f9]"
              style={{
                borderColor: isActiveFilter?.key === item?.key ? dataColors.pending : '#e2e8f0',
                backgroundColor: isActiveFilter?.key === item?.key ? dataColors.backgroundHover : '',
              }}
              onClick={() => handleClickButton(item)}
            >
              <span className="text-sm font-medium">{item?.title}</span>
              <div
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs transition-colors font-medium ml-[3px]"
                style={{ backgroundColor: renderColor(item.status) }}
              >
                <span className="truncate font-bold text-white">{3}</span>
              </div>
            </button>
          ))}
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
                ListData={['Second Day', 'Ground', 'Overnight', 'Economy', 'Standard', 'Expedited']}
                // value={selectShop}
                // onChange={(val) => {
                //   setSelectShop(val);
                //   updateFilter({ shopName: val });
                // }}
              />
            </div>
          </div>
          <div>
            <Pagination
              total={30}
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
            columns={columns}
            expandable={{
              expandedRowRender,
              expandIcon: ({ expanded, onExpand, record }) => (
                <div className="flex justify-center items-center  h-full w-full cursor-pointer" onClick={(e) => onExpand(record, e)}>
                  {expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
            }}
            rowKey="key"
            bordered={true}
            pagination={false}
          />
        </div>
      </div>
    </div>
  );
};

export default FulfillmentScale;
