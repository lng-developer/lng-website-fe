import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { dataFilterStatusFulfillment } from '../../utils/dataFilter';
import { useEffect, useState } from 'react';
import ButtonFilter from '../../components/ButtonFilter';
import { dataColors } from '../../utils/dataColors';
import { Input, Pagination, Table } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

const FulfillmentScale = () => {
  const { collapsed } = useOutletContext();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusFulfillment[0]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);

  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.key]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== record.key));
    }
  };

  const handleShowRowKeys = () => {
    if (isShowRowkeys) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(dataSource.map((item) => item.key));
    }
    setIsShowRowKeys((prev) => !prev);
  };

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dataSource = [
    {
      key: 'TL7005798929',
      orderDate: '28/12/2024',
      groupId: 'TL7005798929',
      groupType: 'Tool 95',
      status: 'Close',
      quality: 'Not Enough',
      quantity: 1,
      orderOwner: 'Nguyễn Huy Hoàng',
      scaleBy: 'Lê Thị Phương CS',
      express: 'No',
      scaleStatus: 'Completed',

      children: [
        {
          key: 'TL7005798929-1',
          no: 1,
          createdAt: '28/12/2024 02:08',
          orderDateDetail: '28/12/2024 01:12',
          type: 'Tool 95',
          history: true,

          productInfo: {
            imageUrl: 'https://example.com/image.jpg',
            asin: 'BOCW1F43KX',
            sku: 'G230185-TSBS-FO-US-20220224-165158',
            status: 'Shipped',
            psd: 'Download PSD',
          },

          customization: {
            style: 'Varsity + Name on sleeve',
            nickname: 'Besties',
            estYear: '1978',
            text: 'Georgette Fran',
            productType: 'Unisex Hoodie',
            color: 'Black',
            size: 'XL',
            surprise: "No, I don't like it",
            giftCard: 'Add Gift Card',
            priority: "I don't think I need to!",
            customUrl: 'https://example.com/customize-url',
            customerPhoto: null,
          },

          taskStatus: 'Completed',

          costCenter: {
            vendorProduct: 'GodGroup - Printed PET Hoodie',
            size: 'XL',
            color: 'Black / 2 Sides',
          },

          csNote: '',
          action: {
            uploadBtn: true,
          },

          orderInfo: {
            orderId: '111-4323604-8773863',
            seller: 'Nguyễn Huy Hoàng',
            fulfillName: '111-4323604-8773863-1184201200401081-0',
            buyerNote: '',
          },
        },
      ],
    },
  ];

  const columns = [
    { title: <span style={{ color: dataColors.title }}>Order Date</span>, dataIndex: 'orderDate', key: 'orderDate', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Group ID</span>, dataIndex: 'groupId', key: 'groupId', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Group Type</span>, dataIndex: 'groupType', key: 'groupType', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Status</span>, dataIndex: 'status', key: 'status', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Quality</span>,
      dataIndex: 'quality',
      key: 'quality',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Quantity</span>, dataIndex: 'quantity', key: 'quantity', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Order Owner</span>,
      dataIndex: 'orderOwner',
      key: 'orderOwner',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Scale By</span>, dataIndex: 'scaleBy', key: 'scaleBy', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Express</span>, dataIndex: 'express', key: 'express', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Scale Status</span>,
      dataIndex: 'scaleStatus',
      key: 'scaleStatus',
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

  useEffect(() => {
    if (isShowRowkeys) {
      // Tự động mở tất cả dòng khi component mount
      setExpandedRowKeys(dataSource.map((item) => item.key));
    }
  }, [isShowRowkeys]);

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
            dataSource={dataSource}
            expandable={{
              expandedRowRender,
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
