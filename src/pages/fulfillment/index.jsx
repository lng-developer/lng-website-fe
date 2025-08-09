import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { dataFilterStatusFulfillment } from '../../utils/dataFilter';
import { useEffect, useState } from 'react';
import ButtonFilter from '../../components/ButtonFilter';
import { dataColors } from '../../utils/dataColors';
import { Input, Pagination, Table } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import StatusComponent from '../../components/StatusComponent';
import ItemDate from './table/ItemDate';
import ItemProductInfo from './table/ItemProductInfo';
import ItemCustom from './table/ItemCustom';
import ItemCostCenter from './table/ItemCostCenter';
import ItemOrderInfo from './table/ItemOrderInfo';
import TextArea from 'antd/es/input/TextArea';
import ItemAction from './table/ItemAction';
import SubItemAction from './table/SubItemAction';

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
    subItems: [
      {
        key: 'TL7005798929-1',
        no: 1,
        createdAt: '28/12/2024 02:08',
        orderDateDetail: '28/12/2024 01:12',
        type: 'Tool 95',
        history: true,
        product_info: {
          imageUrl: 'https://example.com/image.jpg',
          asin: 'BOCW1F43KX',
          sku: 'G230185-TSBS-FO-US-20220224-165158',
          status: 'Shipped',
          psd: 'Download PSD',
        },
        customization: [
          {
            label: 'Custom Name',
            value: 'Mrs. Griffin',
          },
          {
            label: 'Select Product Type',
            value: 'Unisex T-shirt',
          },
          {
            label: 'Color',
            value: 'Sport Grey',
          },
          {
            label: 'Select Size',
            value: 'L',
          },
          {
            label: 'Priority Production',
            value: 'No, Thanks.',
          },
          {
            label: 'If we brought a smile to your day, then our job here is done – sprinkles on the cupcake!',
            value: 'Thank you!!!',
          },
        ],
        task_status: 'Completed',
        cost_center: {
          vendorProduct: 'GodGroup - Printed PET Hoodie',
          size: 'XL',
          color: 'Black / 2 Sides',
        },
        cs_note: '',
        action: {
          uploadBtn: true,
        },
        order_info: {
          orderId: '111-4323604-8773863',
          seller: 'Nguyễn Huy Hoàng',
          fulfillName: '111-4323604-8773863-1184201200401081-0',
          buyerNote: '',
        },
        snapshotImage:
          'https://res.cloudinary.com/debr5x898/image/upload/v1754038955/snapshot_images/80398e95-b6b2-83ae-926c-359de9ee902d.jpg',
      },
    ],
  },
];

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

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Order Date</span>,
      dataIndex: 'orderDate',
      key: 'orderDate',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Group ID</span>,
      dataIndex: 'groupId',
      key: 'groupId',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Group Type</span>,
      dataIndex: 'groupType',
      key: 'groupType',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Quality</span>,
      dataIndex: 'quality',
      key: 'quality',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Quantity</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Order Owner</span>,
      dataIndex: 'orderOwner',
      key: 'orderOwner',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Scale By</span>, dataIndex: 'scaleBy', key: 'scaleBy', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Express</span>,
      dataIndex: 'express',
      key: 'express',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Scale Status</span>,
      dataIndex: 'scaleStatus',
      key: 'scaleStatus',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Action</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
    },
  ];

  // render Orders
  const renderOrderInTable = (data = []) => {
    const results = data.map((item, index) => {
      return {
        key: item?.key,
        orderDate: <span className="font-medium">{item?.orderDate}</span>,
        groupId: <StatusComponent title={item?.groupId} color={dataColors.default} isDefault={true} />,
        groupType: <StatusComponent title={item?.groupType} color={dataColors.process} />,
        status: <StatusComponent title={item?.status} color={dataColors.cancelled} />,
        quality: <StatusComponent title={item?.quality} color={dataColors.yellow} />,
        quantity: <span className="font-medium">{item?.quantity}</span>,
        orderOwner: <span className="font-medium">{item?.orderOwner}</span>,
        scaleBy: <span className="font-medium">{item?.scaleBy}</span>,
        express: <StatusComponent title={item?.express} color={dataColors.cancelled} />,
        scaleStatus: <StatusComponent title={item?.scaleStatus} color={dataColors.success} />,
        actions: <ItemAction />,
        subItems: item?.subItems?.map((itemSub, indexItem) => {
          return {
            key: `${index}-${indexItem}`,
            date: <ItemDate />,
            product_info: <ItemProductInfo />,
            customization: (
              <ItemCustom items={itemSub?.customization} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />
            ),
            task_status: <StatusComponent title="Completed" color={dataColors.success} />,
            cost_center: <ItemCostCenter />,
            cs_note: (
              <div className="mb-1 w-45">
                <div className="font-semibold text-gray-800 mb-1">CS note: </div>
                <TextArea placeholder="CS note" />
              </div>
            ),
            action: <SubItemAction />,
            order_info: <ItemOrderInfo />,
          };
        }),
      };
    });
    return results;
  };

  // Cột con trong bảng mở rộng
  const expandedRowRender = (record) => {
    const subColumns = [
      { title: <span style={{ color: dataColors.title }}>Date</span>, dataIndex: 'date', key: 'date' },
      { title: <span style={{ color: dataColors.title }}>Product Info</span>, dataIndex: 'product_info', key: 'product_info' },
      { title: <span style={{ color: dataColors.title }}>Customization</span>, dataIndex: 'customization', key: 'customization' },
      { title: <span style={{ color: dataColors.title }}>Task Status</span>, dataIndex: 'task_status', key: 'task_status' },
      { title: <span style={{ color: dataColors.title }}>Cost Center</span>, dataIndex: 'cost_center', key: 'cost_center' },
      { title: <span style={{ color: dataColors.title }}>CS Note</span>, dataIndex: 'cs_note', key: 'cs_note' },
      { title: <span style={{ color: dataColors.title }}>Action</span>, dataIndex: 'action', key: 'action' },
      { title: <span style={{ color: dataColors.title }}>Order Info</span>, dataIndex: 'order_info', key: 'order_info' },
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
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                {item?.title}
              </span>
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
              placeholder="Search..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectFilter
                title="Type"
                ListData={['Outline', 'Custom Image', 'Manual Scale', 'Tool']}
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
            dataSource={renderOrderInTable(dataSource)}
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
