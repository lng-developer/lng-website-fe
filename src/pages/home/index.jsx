import { Flex, Input, Pagination, Table, Tooltip } from 'antd';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllCountStatus, getALlOrder, getALlShop, retestBasecode } from '../../apis/order';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
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
import { MdOutlineRefresh } from 'react-icons/md';
import { BiRefresh } from 'react-icons/bi';
import ItemCase from './table/ItemCase';
import DateRangePicker from '../../components/DateRangePicker';
import { toast } from 'sonner';
import { getALlVendorProduct } from '../../apis/vendor';
import { TbHistory } from 'react-icons/tb';
import { debounce } from 'lodash';
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
  const [loading, setLoading] = useState(false);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [vendorProduct, setVendorProduct] = useState([]);
  const [tableHeight, setTableHeight] = useState(0);
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
    updateFilter({ page: page, perPage: pageSize });
    setCurrentPage(page);
  };

  const handleOnclick = () => {
    setIsShowModal((prev) => !prev);
  };

  // fetch count order by status
  const fetchCountStatus = useCallback(async () => {
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
  }, [filters]);

  const fetchAllOrder = async (params) => {
    setLoading(true);
    try {
      const response = await getALlOrder(params);
      if (response.status === 200) {
        setOrders(response.data?.data);
        setTotalCount(response.data?.totalCount);
      } else {
        toast.error(response.data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
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
    { title: <span style={{ color: dataColors.title }}>Status</span>, dataIndex: 'status', key: 'status', align: 'center' },
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
      title: <span style={{ color: dataColors.title }}>Config Cost</span>,
      dataIndex: 'config_cost_center',
      key: 'config_cost_center',
      width: 100,
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title, marginLeft: !collapsed ? 0 : -5 }}>Basecost</span>,
      dataIndex: 'base_cost',
      key: 'basecost',
      width: 80,
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Store</span>, dataIndex: 'store', key: 'store', align: 'center' },
    // {
    //   title: <span style={{ color: dataColors.title }}>Delivery Date</span>,
    //   dataIndex: 'delivery_date',
    //   key: 'delivery_date',
    //   align: 'center',
    //   width: 130,
    // },
    {
      title: <span style={{ color: dataColors.title }}>Handling</span>,
      dataIndex: 'handling_time',
      key: 'handling_time',
      align: 'center',
      with: 120,
    },
    { title: <div style={{ color: dataColors.title, textAlign: 'center' }}>Case</div>, dataIndex: 'case', key: 'case' },
  ];

  // Cột con trong bảng mở rộng
  const expandedRowRender = (record) => {
    const subColumns = [
      { title: <span style={{ color: dataColors.title }}>Image & Print Side</span>, dataIndex: 'product', key: 'product' },
      { title: <span style={{ color: dataColors.title }}>SKU, Variant & Seller</span>, dataIndex: 'sku', key: 'sku' },
      { title: <span style={{ color: dataColors.title }}>Customization</span>, dataIndex: 'customer', key: 'customer', width: 300 },
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

  const debouncedSearch = useMemo(
    () =>
      debounce(async (keyword) => {
        if (!keyword) {
          updateFilter({ search: '' });
          return;
        }
        updateFilter({ search: keyword });
      }, 300),
    []
  );

  // Xử lý search
  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
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

  const handleRetest = async (id) => {
    try {
      const response = await retestBasecode({
        orderId: id,
      });
      if (response.status === 200) {
        toast.success('Retest success!');
        console.log(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error('Retest error!');
    } finally {
      fetchAllOrder(filters);
      fetchCountStatus();
    }
  };

  // render Orders
  const renderOrderInTable = (data = []) => {
    const results = data.map((item, index) => {
      return {
        key: item?.orderId,
        order: (
          <button className="cursor-pointer" onClick={() => handleCopy(item?.orderId)}>
            <StatusComponent title={item?.orderId} color={dataColors.default} isDefault={true} />
          </button>
        ),
        customer: (
          <ItemCustomer
            customerInfor={item?.customer_infor}
            orderId={item?.orderId}
            fetchAllOrder={fetchAllOrder}
            filters={filters}
            address_validation={item?.address_validation}
          />
        ),
        status: (
          <div className="flex items-center justify-center gap-1">
            <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />
            <TbHistory size={16} className="cursor-pointer" />
          </div>
        ),
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
          <div
            className="border-1 rounded-full px-2 cursor-pointer flex justify-center items-center"
            style={{ borderColor: dataColors.pending }}
            onClick={() => handleRetest(item?.orderId)}
          >
            <div>
              <BiRefresh size={18} color={dataColors.pending} />
            </div>
            <span className="font-medium whitespace-nowrap ml-1" style={{ color: dataColors.pending }}>
              Re-Test
            </span>
          </div>
        ),
        base_cost: <ItemBaseCost orderId={item?.orderId} base_cost={item?.base_cost} fetchAllOrder={fetchAllOrder} filters={filters} />,
        store: <StatusComponent title={item?.shopName} color={dataColors.pending} />,
        // delivery_date: <span className="font-medium">July 25, 2025</span>,
        handling_time: <span className="font-medium">6 Days</span>,
        case: <ItemCase orderId={item?.orderId} fetchAllOrder={fetchAllOrder} filters={filters} caseList={item?.case} />,
        subItems: item?.items?.map((itemSub, indexItem) => {
          return {
            key: `${index}-${indexItem}`,
            product: (
              <SubItemImage
                linkImage={itemSub?.baseImageUrl}
                linkFulfill={itemSub?.fulfillment_file}
                fetchAllOrder={fetchAllOrder}
                filters={filters}
                orderId={item?.orderId}
                orderItemId={itemSub?.orderItemId}
                seller={item?.seller}
                listing={itemSub?.listing}
                scale_status={itemSub?.scale_status}
                asin={itemSub?.asin}
              />
            ),
            sku: (
              <SubItemSku
                sku={itemSub?.sku}
                mapped_sku={itemSub?.mapped_sku}
                asin={itemSub?.asin}
                seller={item?.seller}
                listing={itemSub?.listing}
              />
            ),
            customer: (
              <SubItemCustom items={itemSub?.version3Data} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />
            ),
            quantity: <SubItemQuantity quantity={itemSub?.quantity} />,
            cost_center: (
              <SubItemCost
                data={itemSub?.cost_center}
                vendorProduct={vendorProduct}
                fulfillName={`${item?.orderId}-${itemSub?.orderItemId}`}
              />
            ),
            tracking_note: (
              <SubItemTracking
                tracking_info={itemSub?.tracking_info}
                orderItemId={itemSub?.orderItemId}
                orderId={item?.orderId}
                status={item?.status}
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

  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.log(err);
      toast.error('Failed to copy!');
    }
  };

  const fetchAllVendorProduct = async () => {
    try {
      const response = await getALlVendorProduct({
        all: true,
      });
      if (response.status === 200) {
        const result = response.data?.data?.map((item) => {
          return {
            value: item?._id,
            label: `${item?.vendor?.name} - ${item?.product_name}`,
          };
        });
        setVendorProduct(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 240; // Chiều cao header nếu có
      const marginBottom = 20;

      const availableHeight = window.innerHeight - headerHeight - marginBottom;
      setTableHeight(availableHeight);
    };

    handleResize(); // Gọi lần đầu
    window.addEventListener('resize', handleResize); // Lắng nghe resize

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    fetchAllVendorProduct();
  }, []);

  useEffect(() => {
    fetchAllShop();
  }, []);

  useEffect(() => {
    fetchCountStatus();
    fetchAllOrder(filters);
  }, [filters]);

  useEffect(() => {
    if (isShowRowkeys) {
      // Tự động mở tất cả dòng khi component mount
      setExpandedRowKeys(orders.map((item) => item.orderId));
    }
  }, [orders, isShowRowkeys]);

  return (
    <div className="overflow-hidden">
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
                  fetchCountStatus();
                }}
              />
              <SelectFilter
                title="Shop"
                ListData={shops.map((item) => item.name)}
                value={selectShop}
                onChange={(val) => {
                  setSelectShop(val);
                  updateFilter({ shopName: val });
                  fetchCountStatus();
                }}
              />
            </div>
            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => {
                  fetchAllOrder(filters);
                  fetchCountStatus();
                  toast.success('Refresh success!');
                }}
              >
                <MdOutlineRefresh size={20} />
              </button>
            </Tooltip>
          </div>
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={PAGE_SIZE}
              defaultCurrent={currentPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              className="custom-pagination"
            />
          </div>
        </div>
        <div className="mt-4">
          <Table
            className="no-indent-table no-backgroud-title"
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
            sticky={{ offsetHeader: 0 }}
            scroll={{ y: tableHeight }}
            tableLayout="auto"
          />
        </div>
      </div>
      <ModalImportOrder isModalOpen={isShowModal} setIsModalOpen={setIsShowModal} />
    </div>
  );
};

export default Home;
