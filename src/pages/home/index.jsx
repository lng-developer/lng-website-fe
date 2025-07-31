import { Flex, Input, Pagination, Table } from 'antd';
import ButtonFilter from '../../components/ButtonFilter';
import SelectFilter from '../../components/SelectFilter';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import SubItemImage from './table/SubItemImage';
import SubItemSku from './table/SubItemSku';
import SubItemCustom from './table/SubItemCustom';
import SubItemQuantity from './table/SubItemQuantity';
import SubItemCost from './table/SubItemCost';
import SubItemTracking from './table/SubItemTracking';
import { useEffect, useState } from 'react';
import { getALlOrder } from '../../apis/order';
import { formatDate } from '../../utils/fomatDate';
import { FcShop } from 'react-icons/fc';
import { FcPlus } from 'react-icons/fc';
import ItemCustomer from './table/ItemCustomer';
import { dataFilterStatus } from '../../utils/dataFilter';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { IoSettingsOutline } from 'react-icons/io5';
import { Button, DatePicker } from 'antd';
import locale from 'antd/es/date-picker/locale/en_US';
import enUS from 'antd/es/date-picker/locale/en_US';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

import { LuImport } from 'react-icons/lu';
import ModalImportOrder from './ModalImportOrder';
import ItemBaseCost from './table/ItemBaseCost';
import ItemShippingType from './table/ItemShippingType';
import { useOutletContext } from 'react-router-dom';
const customLocale = {
  ...enUS,
  lang: {
    ...locale.lang,
    ok: 'Apply',
  },
};
const PAGE_SIZE = 10;
const { RangePicker } = DatePicker;

const Home = () => {
  const [orders, setOrders] = useState([]);
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatus[0]);
  const [tabFilter, setTabFilter] = useState(dataFilterStatus);
  const [curentData, setCurentData] = useState([]);
  const [isShowModal, setIsShowModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState([]);
  const [range, setRange] = useState();
  const [status, setStatus] = useState('');
  const [valueSearch, setValueSearch] = useState('');
  const [isFilterStatus, setIsFilterStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const { collapsed } = useOutletContext();
  const [totalCount, setTotalCount] = useState(0);

  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.key]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== record.key));
    }
  };

  const rowSelection = {
    type: 'checkbox',
    selectedRowKeys,
    onChange: (newKeys) => {
      setSelectedRowKeys(newKeys);
    },
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = orders.slice(startIndex, endIndex);

  const handleOnclick = () => {
    setIsShowModal((prev) => !prev);
  };

  // fetch count order by status
  const fetchCountStatus = (data = []) => {
    const resultTabFilter = dataFilterStatus.map((tab) => {
      const count = tab.status === 'All' ? data.length : data.filter((item) => item.status === tab.status).length;

      return { ...tab, count };
    });
    setTabFilter(resultTabFilter);
  };

  const changeDataForFilter = (dateRange, status, search) => {
    const filtered = curentData?.filter((order) => {
      const orderDate = parseISO(order?.purchase_date);
      const matchDateRange = () => {
        if (dateRange?.length === 2) {
          const [start, end] = [startOfDay(dateRange[0]), endOfDay(dateRange[1])];
          return isWithinInterval(orderDate, { start, end });
        }
        return true;
      };
      const matchStatus = status ? order.status === status : true;
      const matchSearch = search ? order.orderId.toLowerCase().includes(search.toLowerCase()) : true;

      return matchDateRange() && matchStatus && matchSearch;
    });
    setOrders(filtered);
  };

  const fetchAllOrder = async () => {
    try {
      const response = await getALlOrder();
      if (response.status === 200) {
        setOrders(response.data?.data);
        setTotalCount(response.data?.totalCount);
        setCurentData(response.data?.data);
        fetchCountStatus(response.data?.data);
      } else {
        console.log('error');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleApply = () => {
    setOpen(false); // ✅ chỉ đóng khi ấn Apply
    changeDataForFilter(range, '', valueSearch);
    setIsFilterStatus(false);
  };

  const handleColorStatus = (stt) => {
    switch (stt) {
      case 'New':
        return dataColors.success;
      case 'Fulfilled':
        return dataColors.process;
      case 'Shipped':
        return dataColors.pending;
      case 'Cancelled':
        return dataColors.cancelled;
      default:
        return dataColors.default;
    }
  };

  const columns = [
    { title: <span style={{ color: dataColors.title }}>Order</span>, dataIndex: 'order', key: 'ord', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Status</span>, dataIndex: 'status', key: 'customer', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Created</span>, dataIndex: 'created', key: 'date', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Order Date</span>, dataIndex: 'order_date', key: 'order_date', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Shipping Type</span>,
      dataIndex: 'shipping_type',
      key: 'shipping_type',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Customer</span>, dataIndex: 'customer', key: 'customer', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Config Cost Center</span>,
      dataIndex: 'config_cost_center',
      key: 'config_cost_center',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Basecost</span>, dataIndex: 'base_cost', key: 'basecost', align: 'center' },
    { title: <span style={{ color: dataColors.title }}>Store</span>, dataIndex: 'store', key: 'store', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Delivery Date</span>,
      dataIndex: 'delivery_date',
      key: 'delivery_date',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Handling Time</span>,
      dataIndex: 'handling_time',
      key: 'handling_time',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Case</span>, dataIndex: 'case', key: 'case', align: 'center' },
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

  // Xử lý search
  const handleSearch = (e) => {
    if (!e.target.value) {
      setValueSearch('');
      changeDataForFilter(range, status, '');
      return;
    }
    setValueSearch(e.target.value);
    changeDataForFilter(range, status, e.target.value);
  };

  const handleFilterForStatus = (status) => {
    setIsFilterStatus(true);
    if (status === 'All') {
      setStatus('');
      changeDataForFilter(range, '', valueSearch);
      return;
    }
    setStatus(status);
    changeDataForFilter(range, status, valueSearch);
  };

  // render Orders
  const renderOrderInTable = (data = []) => {
    const results = data.map((item, index) => {
      return {
        key: item?.orderId,
        order: <StatusComponent title={item?.orderId} color={dataColors.default} isDefault={true} />,
        customer: <ItemCustomer customerInfor={item?.customer_infor} orderId={item?.orderId} fetchAllOrder={fetchAllOrder} />,
        status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
        created: <span className="font-medium">{formatDate(item?.createdAt)}</span>,
        order_date: <span className="font-medium">{formatDate(item?.purchase_date)}</span>,
        shipping_type: <ItemShippingType shipping_type={item?.shipping_type} />,
        config_cost_center: (
          <div className="border-1 rounded-full px-2 cursor-pointer" style={{ borderColor: dataColors.pending }}>
            <span className="font-medium ml-2" style={{ color: dataColors.pending }}>
              Re-test
            </span>
          </div>
        ),
        base_cost: <ItemBaseCost orderId={item?.orderId} base_cost={item?.base_cost} fetchAllOrder={fetchAllOrder} />,
        store: (
          <Flex justify="center" style={{ borderColor: dataColors.pending, whiteSpace: 'nowrap' }}>
            <FcShop size={20} />
            <span className="font-medium ml-2 w-auto" style={{ color: dataColors.pending }}>
              {item?.shopName}
            </span>
          </Flex>
        ),
        delivery_date: <span className="font-medium">July 25, 2025</span>,
        handling_time: <span className="font-medium">6 Days</span>,
        case: (
          <div className="flex justify-center cursor-pointer">
            <FcPlus size={20} />
          </div>
        ),
        subItems: item?.items?.map((itemSub, indexItem) => {
          return {
            key: `${index}-${indexItem}`,
            product: <SubItemImage linkImage={itemSub?.baseImageUrl} />,
            sku: <SubItemSku sku={itemSub?.sku} asin={itemSub?.asin} />,
            price: <SubItemCustom items={itemSub?.version3Data} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />,
            quantity: <SubItemQuantity quantity={itemSub?.quantity} />,
            cost_center: <SubItemCost />,
            tracking_note: <SubItemTracking status={item?.status} orderId={item?.orderId} fetchAllOrder={fetchAllOrder} />,
          };
        }),
      };
    });
    return results;
  };

  useEffect(() => {
    fetchAllOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFilterStatus) {
      return;
    }
    fetchCountStatus(orders);
  }, [isFilterStatus, orders]);

  useEffect(() => {
    // Tự động mở tất cả dòng khi component mount
    setExpandedRowKeys(orders.map((item) => item.orderId));
  }, [orders]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-20'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Orders
          </h1>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={handleOnclick}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Import Orders
              </span>
              <div style={{ color: 'black' }}>
                <LuImport size={15} />
              </div>
            </button>
            <RangePicker
              locale={customLocale}
              format="MMM D, YYYY"
              value={value}
              size="large"
              open={open}
              className="range-center"
              onChange={(dates) => setRange(dates)}
              onCalendarChange={(val) => {
                if (val?.[0] && val?.[1]) {
                  setValue(val);
                  setOpen(true); // giữ popup luôn mở
                }
              }}
              onOpenChange={(nextOpen) => {
                // chỉ mở, không cho tự đóng
                if (nextOpen) setOpen(true);
              }}
              panelRender={(panelNode) => (
                <div>
                  {panelNode}
                  <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-4 py-2">
                    <Button
                      type="default"
                      size="middle"
                      onClick={() => {
                        setOpen(false);
                      }}
                    >
                      Close
                    </Button>
                    <Button type="primary" size="middle" onClick={handleApply}>
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            />
            <button
              style={{ color: 'black' }}
              className={`border-[${dataColors.default}] inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium disabled:opacity-50 border border-input h-10 px-4 py-2 cursor-pointer`}
            >
              <IoSettingsOutline />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex gap-3 items-center">
          {tabFilter.map((item, index) => (
            <ButtonFilter
              key={index}
              item={item}
              isActive={isActiveFilter?.key}
              handleFilterForStatus={handleFilterForStatus}
              setIsActivefilter={setIsActivefilter}
              count={item?.count}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <Input
              value={valueSearch}
              onChange={handleSearch}
              placeholder="Search orders by ID, Customer..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectFilter />
              <SelectFilter />
              <SelectFilter />
            </div>
          </div>
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={10}
              defaultCurrent={1}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table
            columns={columns}
            dataSource={renderOrderInTable(paginatedData)}
            expandable={{
              expandedRowRender,
              expandIcon: ({ expanded, onExpand, record }) => (
                <div className="flex justify-center items-center  h-full w-full cursor-pointer" onClick={(e) => onExpand(record, e)}>
                  {expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
              expandedRowKeys: expandedRowKeys,
              onExpand: handleExpand,
            }}
            rowKey="key"
            bordered={true}
            pagination={false}
            rowSelection={rowSelection}
            style={{ verticalAlign: 'top !important' }}
          />
        </div>
      </div>
      <ModalImportOrder isModalOpen={isShowModal} setIsModalOpen={setIsShowModal} />
    </div>
  );
};

export default Home;
