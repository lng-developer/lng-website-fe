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
import { getAllCountStatus, getALlOrder, getALlShop } from '../../apis/order';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { FcShop } from 'react-icons/fc';
import ItemCustomer from './table/ItemCustomer';
import { dataFilterStatus } from '../../utils/dataFilter';
import { formatDistanceToNow } from 'date-fns';
import { IoSettingsOutline } from 'react-icons/io5';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { LuImport } from 'react-icons/lu';
import ModalImportOrder from './ModalImportOrder';
import ItemBaseCost from './table/ItemBaseCost';
import ItemShippingType from './table/ItemShippingType';
import { useOutletContext } from 'react-router-dom';
import ItemCase from './table/ItemCase';
import DateRangePicker from '../../components/DateRangePicker';
const PAGE_SIZE = 10;

const Home = () => {
  const [orders, setOrders] = useState([]);
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatus[0]);
  const [tabFilter, setTabFilter] = useState(dataFilterStatus);
  const [isShowModal, setIsShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const { collapsed } = useOutletContext();
  const [totalCount, setTotalCount] = useState(0);
  const [shippingType, setShippingType] = useState('');
  const [shops, setShops] = useState([]);
  const [selectShop, setSelectShop] = useState('');
  const [loading, setLodaing] = useState(false);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    statuses: '',
    from: defaultFrom,
    to: defaultTo,
    search: '',
    isNoCostCenter: false,
    openCase: false,
  });

  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: newValues.page || Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : 1,
    }));
  };

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
      setExpandedRowKeys(orders.map((item) => item.orderId));
    }
    setIsShowRowKeys((prev) => !prev);
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
    updateFilter({ page: page, perPage: pageSize });
  };

  const handleOnclick = () => {
    setIsShowModal((prev) => !prev);
  };

  // fetch count order by status
  const fetchCountStatus = async () => {
    try {
      const response = await getAllCountStatus({ ...filters, openCase: false });
      if (response.status === 200) {
        const resultTabFilter = dataFilterStatus.map(({ key, title, status }) => ({
          key,
          title,
          status,
          count: response.data[key] ?? 0,
        }));
        setTabFilter(resultTabFilter);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAllOrder = async (params) => {
    setLodaing(true);
    try {
      const response = await getALlOrder(params);
      if (response.status === 200) {
        setOrders(response.data?.data);
        setTotalCount(response.data?.totalCount);
      } else {
        console.log('error');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLodaing(false);
    }
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
    { title: <div style={{ color: dataColors.title, textAlign: 'center' }}>Case</div>, dataIndex: 'case', key: 'case' },
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
      <Table
        columns={subColumns}
        dataSource={record.subItems}
        pagination={false}
        rowKey="key"
        rowClassName={() => 'table-row-center'}
        style={{ padding: 10 }}
      />
    );
  };

  // Xử lý search
  const handleSearch = (e) => {
    if (!e.target.value) {
      updateFilter({ search: '' });
      return;
    }
    updateFilter({ search: e.target.value });
  };

  const handleFilterForStatus = (status) => {
    if (status === 'All') {
      updateFilter({ statuses: '', isNoCostCenter: false, openCase: false });
      return;
    }
    if (status === 'NoCostCenter') {
      updateFilter({ statuses: '', isNoCostCenter: true, openCase: false });
      return;
    }
    if (status === 'openCase') {
      updateFilter({ statuses: '', isNoCostCenter: false, openCase: true });
      return;
    }
    updateFilter({ statuses: status, isNoCostCenter: false, openCase: false });
  };

  // render Orders
  const renderOrderInTable = (data = []) => {
    const results = data.map((item, index) => {
      return {
        key: item?.orderId,
        order: <StatusComponent title={item?.orderId} color={dataColors.default} isDefault={true} />,
        customer: (
          <ItemCustomer
            customerInfor={item?.customer_infor}
            orderId={item?.orderId}
            fetchAllOrder={fetchAllOrder}
            filters={filters}
            address_validation={item?.address_validation}
          />
        ),
        status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
        created: (
          <Flex vertical={true}>
            <span className="font-medium whitespace-nowrap">{formatDate(item?.createdAt)}</span>
            <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
              ({formatDistanceToNow(item?.createdAt, { addSuffix: true })})
            </span>
          </Flex>
        ),
        order_date: (
          <Flex vertical={true}>
            <span className="font-medium whitespace-nowrap">{formatDate(item?.purchase_date)}</span>
            <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
              ({formatDistanceToNow(item?.purchase_date, { addSuffix: true })})
            </span>
          </Flex>
        ),
        shipping_type: (
          <ItemShippingType shipping_type={item?.shipping_type} orderId={item?.orderId} fetchAllOrder={fetchAllOrder} filters={filters} />
        ),
        config_cost_center: (
          <div className="border-1 rounded-full px-2 cursor-pointer" style={{ borderColor: dataColors.pending }}>
            <span className="font-medium ml-2 whitespace-nowrap" style={{ color: dataColors.pending }}>
              Re-test
            </span>
          </div>
        ),
        base_cost: <ItemBaseCost orderId={item?.orderId} base_cost={item?.base_cost} fetchAllOrder={fetchAllOrder} filters={filters} />,
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
        case: <ItemCase orderId={item?.orderId} fetchAllOrder={fetchAllOrder} filters={filters} caseList={item?.case} />,
        subItems: item?.items?.map((itemSub, indexItem) => {
          return {
            key: `${index}-${indexItem}`,
            product: <SubItemImage linkImage={itemSub?.baseImageUrl} />,
            sku: <SubItemSku sku={itemSub?.sku} asin={itemSub?.asin} />,
            price: <SubItemCustom items={itemSub?.version3Data} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />,
            quantity: <SubItemQuantity quantity={itemSub?.quantity} />,
            cost_center: <SubItemCost />,
            tracking_note: (
              <SubItemTracking
                status={item?.status}
                orderId={item?.orderId}
                fetchAllOrder={fetchAllOrder}
                filters={filters}
                fetchCountStatus={fetchCountStatus}
              />
            ),
          };
        }),
      };
    });
    return results;
  };

  const fetchAllShop = async () => {
    try {
      const result = await getALlShop();
      if (result.status === 200) {
        setShops(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllShop();
  }, []);

  useEffect(() => {
    fetchAllOrder(filters);
    fetchCountStatus();
  }, [filters]);

  useEffect(() => {
    if (isShowRowkeys) {
      // Tự động mở tất cả dòng khi component mount
      setExpandedRowKeys(orders.map((item) => item.orderId));
    }
  }, [orders, isShowRowkeys]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
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
              updateFilter={updateFilter}
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
              onChange={handleSearch}
              placeholder="Search orders by ID, Customer..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectFilter
                title="Shipping Type"
                ListData={['Second Day', 'Ground', 'Overnight', 'Economy', 'Standard', 'Expedited']}
                value={shippingType}
                onChange={(val) => {
                  setShippingType(val);
                  updateFilter({ shippingType: val });
                }}
              />
              <SelectFilter
                title="Shop"
                ListData={shops.map((item) => item.name)}
                value={selectShop}
                onChange={(val) => {
                  setSelectShop(val);
                  updateFilter({ shopName: val });
                }}
              />
            </div>
          </div>
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={PAGE_SIZE}
              defaultCurrent={currentPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table
            className="no-indent-table"
            columns={columns}
            dataSource={renderOrderInTable(orders)}
            expandable={{
              indentSize: 0,
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
            rowSelection={rowSelection}
            loading={loading}
          />
        </div>
      </div>
      <ModalImportOrder isModalOpen={isShowModal} setIsModalOpen={setIsShowModal} />
    </div>
  );
};

export default Home;
