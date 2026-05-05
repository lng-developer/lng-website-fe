import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Input, Modal, Pagination, Table, Tooltip, Empty } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { formatDistanceToNow } from 'date-fns';
import { IoSettingsOutline } from 'react-icons/io5';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { LuImport, LuArrowDownNarrowWide } from 'react-icons/lu';
import { MdOutlineRefresh } from 'react-icons/md';
import { TbHistory, TbReplace } from 'react-icons/tb';
import { BiRefresh } from 'react-icons/bi';
import ButtonFilter from '../../components/ButtonFilter';
import SelectFilter from '../../components/SelectFilter';
import StatusComponent from '../../components/StatusComponent';
import DateRangePicker from '../../components/DateRangePicker';
import { dataColors } from '../../utils/dataColors';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { dataFilterStatusEtsy } from '../../utils/dataFilter';
import SubItemImage from './table/SubItemImage';
import SubItemSku from './table/SubItemSku';
import SubItemCustomEtsy from './table/SubItemCustomEtsy';
import SubItemQuantity from './table/SubItemQuantity';
import SubItemCost from './table/SubItemCost';
import SubItemTracking from './table/SubItemTracking';
import ItemCustomer from './table/ItemCustomer';
import ItemBaseCost from './table/ItemBaseCost';
import ItemShippingType from './table/ItemShippingType';
import ItemCase from './table/ItemCase';
import ModalImportEtsy from './ModalImportEtsy';
import { getAllTeam } from '../../apis/teams';
import { LoadingOutlined } from '@ant-design/icons';
import SelectSeller from '../../components/SelectSeller';
import dayjs from 'dayjs';
import OrderLogPopover from '../../components/OrderLogPopover';
import { useAuth } from '../../context/AuthContext';
import { getAllEtsyOrders, getEtsyStatistic, computeEtsyBaseCost } from '../../apis/etsy';
import { getALlShop, replaceOrder, syncVendorTracking } from '../../apis/order';
const LAST_UPDATED_KEY = 'orders_last_updated_at';
const PAGE_SIZE = 10;

const OrderEtsy = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusEtsy[0]);
  const [tabFilter, setTabFilter] = useState(dataFilterStatusEtsy);
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
  const [tableHeight, setTableHeight] = useState(0);
  const [isShowModalReplace, setIsShowModalReplace] = useState(false);
  const [selectedReplaceItemId, setSelectedReplaceItemId] = useState('');
  const [selectedReplaceItemIds, setSelectedReplaceItemIds] = useState([]);

  const [orderInfo, setOrderInfo] = useState({});
  const [teams, setTeams] = useState([]);
  const [selectTeam, setSelectTeam] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => {
    const saved = localStorage.getItem(LAST_UPDATED_KEY);
    return saved ? new Date(saved) : null;
  });
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    status: '',
    from: defaultFrom,
    to: defaultTo,
    search: '',
    isNoCostCenter: false,
    invalidAddress: false,
    openCase: false,
    noPsd: false,
    shopName: '',
    teamId: '',
    shippingType: '',
  });

  const updateLastUpdatedAt = useCallback(() => {
    const now = new Date();
    setLastUpdatedAt(now);
    localStorage.setItem(LAST_UPDATED_KEY, now.toISOString());
  }, []);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdatedAt) return 'Last updated: —';
    return `Last updated at ${dayjs(lastUpdatedAt).format('HH:mm')}`;
  }, [lastUpdatedAt]);

  // ---- Callbacks & Memos ----
  const updateFilter = useCallback((newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      // Nếu newValues có page thì dùng page đó, nếu không thì giữ nguyên page hiện tại
      page: Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : prev.page,
    }));
  }, []);

  const handleExpand = useCallback((expanded, record) => {
    setExpandedRowKeys((prev) => (expanded ? [...prev, record.key] : prev.filter((key) => key !== record.key)));
  }, []);

  const handleShowRowKeys = useCallback(() => {
    setExpandedRowKeys(() => (isShowRowkeys ? [] : orders.map((item) => item.orderId)));
    setIsShowRowKeys((prev) => !prev);
  }, [isShowRowkeys, orders]);

  const rowSelection = useMemo(
    () => ({
      type: 'checkbox',
      selectedRowKeys,
      onChange: setSelectedRowKeys,
    }),
    [selectedRowKeys]
  );

  const handlePageChange = useCallback(
    (page, pageSize) => {
      updateFilter({ page, perPage: pageSize });
      setCurrentPage(page);

      // Scroll tới vị trí table khi đổi trang
      setTimeout(() => {
        const tableElement = document.querySelector('.ant-table-tbody');
        if (tableElement) {
          tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    },
    [updateFilter]
  );

  const handleOnclick = useCallback(() => {
    setIsShowModal((prev) => !prev);
  }, []);

  const handleColorStatus = useCallback((stt) => {
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
  }, []);

  const fetchEtsyStatistic = useCallback(async () => {
    try {
      const response = await getEtsyStatistic({ ...filters });
      if (response.status === 200) {
        const resultTabFilter = dataFilterStatusEtsy.map(({ key, title, status }) => ({
          key,
          title,
          status,
          count: response.data[key] ?? 0,
        }));
        setTabFilter(resultTabFilter);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error loading statistic!');
    }
  }, [filters]);

  const fetchAllOrder = useCallback(
    async (params) => {
      setLoading(true);
      try {
        const response = await getAllEtsyOrders(params);

        if (response.status === 200) {
          setOrders(response.data?.data || []);
          setTotalCount(response.data?.totalCount ?? response.data?.total ?? 0);
        } else {
          toast.error(response.data?.message);
        }
      } catch (error) {
        console.log(error);
        toast.error('Error System!');
      } finally {
        setLoading(false);
        updateLastUpdatedAt();
      }
    },
    [updateLastUpdatedAt]
  );
  const handleImportTracking = useCallback(async () => {
    if (isImporting) return;

    setIsImporting(true);

    const toastId = toast('Processing import tracking...', {
      duration: Infinity,
      icon: <LoadingOutlined spin style={{ color: '#003a8c', fontSize: '16px' }} />,
      style: {
        backgroundColor: '#e6f7ff',
        border: '1px solid #69b1ff',
        color: '#003a8c',
        fontWeight: 500,
        gap: '12px',
      },
    });

    try {
      const response = await syncVendorTracking({ max: 300 });

      if (response.status === 200) {
        toast.success('Import tracking finished!', {
          id: toastId,
          duration: 4000,
          style: {},
          icon: undefined,
        });

        fetchAllOrder(filters);
        fetchEtsyStatistic();
      } else {
        toast.error('Import tracking failed!', {
          id: toastId,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'System Error!', {
        id: toastId,
        duration: 4000,
      });
    } finally {
      setIsImporting(false);
    }
  }, [fetchAllOrder, fetchEtsyStatistic, filters, isImporting]);
  const handleCopy = useCallback(async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy!');
    }
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((keyword) => {
        updateFilter({ search: keyword || '', page: 1 });
      }, 300),
    [updateFilter]
  );
  useEffect(() => {
    // Clear debounce on unmount để tránh memory leak
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    // Đồng bộ currentPage với filters.page
    setCurrentPage(filters.page);
  }, [filters.page]);

  const handleSearch = useCallback(
    (e) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  const handleFilterForStatus = useCallback(
    (status) => {
      setCurrentPage(1);
      if (status === 'All')
        return updateFilter({ status: '', isNoCostCenter: false, invalidAddress: false, openCase: false, noPsd: false, page: 1 });
      if (status === 'NoCostCenter')
        return updateFilter({ status: '', isNoCostCenter: true, invalidAddress: false, openCase: false, noPsd: false, page: 1 });
      if (status === 'invalidAddress')
        return updateFilter({ status: '', isNoCostCenter: false, invalidAddress: true, openCase: false, noPsd: false, page: 1 });
      if (status === 'openCase')
        return updateFilter({ status: '', isNoCostCenter: false, invalidAddress: false, openCase: true, noPsd: false, page: 1 });
      if (status === 'noPsd')
        return updateFilter({ status: '', isNoCostCenter: false, invalidAddress: false, openCase: false, noPsd: true, page: 1 });
      // Status thông thường: New, Fulfilled, Shipped, Cancelled, Refund
      updateFilter({ status, isNoCostCenter: false, invalidAddress: false, openCase: false, noPsd: false, page: 1 });
    },
    [updateFilter]
  );

  const handleRetest = useCallback(
    async (id) => {
      try {
        const toastId = toast.loading('Computing base cost...');
        const response = await computeEtsyBaseCost({ orderId: id });
        if (response.status === 200) {
          toast.success('Compute base cost success!', { id: toastId });
        } else {
          toast.error(response.data?.message || 'Compute failed!', { id: toastId });
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || 'Compute base cost error!');
      } finally {
        fetchAllOrder(filters);
        fetchEtsyStatistic();
      }
    },
    [fetchAllOrder, fetchEtsyStatistic, filters]
  );

  const handleReplace = useCallback(async () => {
    try {
      if (!selectedReplaceItemIds?.length) {
        toast.error('Please select at least one item to replace');
        return;
      }

      const response = await replaceOrder(orderInfo?.orderId, {
        orderItemIds: selectedReplaceItemIds,
      });

      if (response.status === 200) {
        toast.success('Replace success!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Replace error!');
    } finally {
      fetchAllOrder(filters);
      fetchEtsyStatistic();
      setIsShowModalReplace(false);
    }
  }, [orderInfo?.orderId, selectedReplaceItemIds, fetchAllOrder, fetchEtsyStatistic, filters]);

  // fetch shop/vendor
  const fetchAllShop = useCallback(async () => {
    try {
      const result = await getALlShop({ merchant: 'etsy' });
      if (result.status === 200) {
        setShops(result.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // columns
  const columns = useMemo(
    () => [
      { title: <span style={{ color: dataColors.title }}>Order ID</span>, dataIndex: 'order', key: 'ord', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Status</span>, dataIndex: 'status', key: 'status', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Created At</span>, dataIndex: 'created', key: 'date', align: 'center' },
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
      { title: <span style={{ color: dataColors.title }}>Replace</span>, dataIndex: 'replace', key: 'replace', align: 'center' },
      {
        title: <span style={{ color: dataColors.title }}>Handling</span>,
        dataIndex: 'handling_time',
        key: 'handling_time',
        align: 'center',
      },
      { title: <div style={{ color: dataColors.title, textAlign: 'center' }}>Case</div>, dataIndex: 'case', key: 'case' },
    ],
    [collapsed]
  );

  // sub table
  const expandedRowRender = useCallback((record) => {
    const subColumns = [
      { title: <span style={{ color: dataColors.title }}>Image & Print Side</span>, dataIndex: 'product', key: 'product' },
      { title: <span style={{ color: dataColors.title }}>SKU, Variant & Seller</span>, dataIndex: 'sku', key: 'sku' },
      { title: <span style={{ color: dataColors.title }}>Customization</span>, dataIndex: 'customer', key: 'customer', width: 300 },
      { title: <span style={{ color: dataColors.title }}>QTY</span>, dataIndex: 'quantity', key: 'quantity' },
      { title: <span style={{ color: dataColors.title }}>Cost Center</span>, dataIndex: 'cost_center', key: 'cost_center', width: 320 },
      {
        title: <span style={{ color: dataColors.title }}>Tracking & Note</span>,
        dataIndex: 'tracking_note',
        key: 'tracking_note',
        width: 300,
      },
    ];
    return (
      <Table
        columns={subColumns}
        dataSource={record.subItems}
        pagination={false}
        rowKey="key"
        rowClassName={() => 'table-row-center'}
        style={{ padding: 16 }}
      />
    );
  }, []);

  const tableData = useMemo(() => {
    const results = (orders || []).map((item, index) => {
      // Response mới: backend đã map sẵn customer_infor
      const mappedCustomerInfo = item?.customer_infor || {};

      return {
        key: item?.orderId,
        order: (
          <button className="cursor-pointer" onClick={() => handleCopy(item?.orderId)}>
            <StatusComponent title={item?.orderId} color={dataColors.default} isDefault={true} />
          </button>
        ),
        customer: (
          <ItemCustomer
            customerInfor={mappedCustomerInfo}
            orderId={item?.orderId}
            fetchAllOrder={fetchAllOrder}
            filters={filters}
            address_validation={item?.address_validation}
          />
        ),
        status: (
          <div className="flex items-center justify-center gap-1">
            <StatusComponent title={item?.status || 'New'} color={handleColorStatus(item?.status || 'New')} />
            <OrderLogPopover
              orderCreatedAt={item?.createdAt}
              events={item?.history || []} // API Etsy chưa có
              triggerNode={<TbHistory size={16} className="cursor-pointer" />}
            />
          </div>
        ),
        created: (
          <Flex vertical={true}>
            <span className="font-medium whitespace-nowrap">{item?.createdAt ? formatDate(item.createdAt) : '—'}</span>
            <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
              {item?.createdAt
                ? `(${formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                    .replace(/^about /, '')
                    .replace(/^less than /, '')})`
                : ''}
            </span>
          </Flex>
        ),
        order_date: (
          <Flex vertical={true}>
            <span className="font-medium whitespace-nowrap">{item?.purchase_date ? formatDate(item.purchase_date) : '—'}</span>
            <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
              {item?.purchase_date
                ? `(${formatDistanceToNow(new Date(item.purchase_date), { addSuffix: true })
                    .replace(/^about /, '')
                    .replace(/^less than /, '')})`
                : ''}
            </span>
          </Flex>
        ),
        shipping_type: (
          <ItemShippingType
            shipping_type={item?.shipping_type || 'Unknown'}
            orderId={item?.orderId}
            fetchAllOrder={fetchAllOrder}
            filters={filters}
          />
        ),
        config_cost_center: (
          <div
            className="border-1 rounded-full px-2 cursor-pointer flex justify-center items-center text-sm"
            style={{ borderColor: dataColors.pending }}
            onClick={() => handleRetest(item?.orderId)}
          >
            <div>
              <BiRefresh size={16} color={dataColors.pending} />
            </div>
            <span className="font-medium whitespace-nowrap ml-1" style={{ color: dataColors.pending }}>
              Re-Test
            </span>
          </div>
        ),
        base_cost: <ItemBaseCost orderId={item?.orderId} base_cost={item?.base_cost} fetchAllOrder={fetchAllOrder} filters={filters} />,
        replace: (
          <div
            className="border-1 rounded-full px-2 cursor-pointer flex justify-center items-center text-sm"
            style={{ borderColor: dataColors.pending }}
            onClick={() => {
              setOrderInfo(item);
              setIsShowModalReplace(true);
            }}
          >
            <div>
              <TbReplace color={dataColors.pending} />
            </div>
            <span className="font-medium whitespace-nowrap ml-1" style={{ color: dataColors.pending }}>
              Replace
            </span>
          </div>
        ),
        store: <StatusComponent title={item?.shopName || 'No Data'} color={dataColors.pending} />,
        handling_time: <span className="font-medium whitespace-nowrap">{item?.remain || 'Unknown'}</span>,
        case: <ItemCase orderId={item?.orderId} fetchAllOrder={fetchAllOrder} filters={filters} caseList={item?.case} />,
        subItems: (item?.items || []).map((itemSub, indexItem) => ({
          key: `${index}-${indexItem}`,
          product: (
            <SubItemImage
              linkImage={itemSub?.baseImageUrl}
              linkFulfill={itemSub?.fulfillment_file}
              seller={item?.seller}
              listing={itemSub?.listingId}
              scale_status={itemSub?.scale_status}
              asin={itemSub?.asin}
              scale_by={item?.scaledBy}
            />
          ),
          sku: (
            <SubItemSku
              sku={itemSub?.sku}
              mapped_sku={itemSub?.mapped_sku}
              asin={itemSub?.asin}
              sellerName={item?.seller?.full_name || '—'}
              listing={itemSub?.listingId}
            />
          ),
          customer: (
            <SubItemCustomEtsy items={itemSub?.version3Data} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />
          ),
          quantity: <SubItemQuantity quantity={itemSub?.quantity} />,
          cost_center: (
            <SubItemCost
              data={itemSub?.cost_center}
              fulfillName={`${item?.orderId}-${itemSub?.orderItemId}`}
              orderId={item?.orderId}
              orderItemId={itemSub?.orderItemId}
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
              fetchCountStatus={fetchEtsyStatistic}
            />
          ),
        })),
      };
    });
    return results;
  }, [orders, fetchAllOrder, fetchEtsyStatistic, filters, handleColorStatus, handleRetest, handleCopy]);

  const fetchAllTeams = useCallback(async () => {
    try {
      const result = await getAllTeam();
      if (result.status === 200) {
        setTeams(result.data?.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 240;
      const availableHeight = window.innerHeight - headerHeight - 20;
      setTableHeight(availableHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAllShop();
  }, [fetchAllShop]);

  useEffect(() => {
    fetchAllTeams();
  }, [fetchAllTeams]);

  useEffect(() => {
    fetchEtsyStatistic();
    fetchAllOrder(filters);
  }, [filters, fetchAllOrder, fetchEtsyStatistic]);

  useEffect(() => {
    if (isShowRowkeys) {
      setExpandedRowKeys(orders.map((item) => item.orderId));
    }
  }, [orders, isShowRowkeys]);

  const replaceItemData = useMemo(() => {
    return (orderInfo?.items || []).map((it, idx) => ({
      key: it?.transactionId || String(idx), // Etsy dùng transactionId
      orderItemId: it?.transactionId, // Map transactionId thành orderItemId cho UI
      baseImageUrl: it?.baseImageUrl, // Hiện tại API chưa có
      sku: it?.sku,
      mapped_sku: it?.mapped_sku,
      quantity: it?.quantity,
    }));
  }, [orderInfo]);

  const replaceItemColumns = useMemo(
    () => [
      {
        title: <span style={{ color: dataColors.title }}>Product</span>,
        dataIndex: 'baseImageUrl',
        key: 'product',
        render: (src, record) => (
          <div className="flex items-center gap-2">
            <div className="border rounded" style={{ width: 44, height: 44, overflow: 'hidden', borderColor: dataColors.default }}>
              {src ? (
                <img
                  src={src}
                  alt="product"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
            </div>
            <div className="flex flex-col">
              <span className="font-medium whitespace-nowrap">{record?.sku || record?.mapped_sku || '—'}</span>
              <span className="text-xs" style={{ color: dataColors.title }}>
                Item: {record?.orderItemId || '—'}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: <span style={{ color: dataColors.title }}>QTY</span>,
        dataIndex: 'quantity',
        key: 'qty',
        width: 70,
        align: 'center',
        render: (v) => <span className="font-medium">{v ?? 1}</span>,
      },
    ],
    []
  );

  return (
    <div className="overflow-hidden">
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0 flex items-center" style={{ color: 'black' }}>
            Manage Orders Etsy{' '}
            <span className="text-xs ml-5 italic" style={{ color: dataColors.title, fontStyle: 'italic' }}>
              {lastUpdatedText}
            </span>
          </h1>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md  text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer "
              onClick={handleImportTracking}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Pull Tracking
              </span>
              <div style={{ color: 'black' }}>
                <LuArrowDownNarrowWide size={15} />
              </div>
            </button>
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
                  backgroundColor: '#f3f4f6',
                  fontWeight: 'normal',
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
                  updateFilter({ shippingType: val, page: 1 });
                }}
              />
              <SelectFilter
                title="Shop"
                ListData={shops.map((item) => item.name)}
                value={selectShop}
                onChange={(val) => {
                  setSelectShop(val);
                  updateFilter({ shopName: val, page: 1 });
                }}
              />
              <SelectSeller
                title="Team"
                ListData={teams}
                value={selectTeam}
                onChange={(val) => {
                  setSelectTeam(val);
                  updateFilter({ teamId: val, page: 1 });
                }}
              />
            </div>
            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => {
                  fetchAllOrder(filters);
                  fetchEtsyStatistic();
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
              pageSize={filters.perPage}
              current={currentPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              showSizeChanger
              className="custom-pagination"
            />
          </div>
        </div>

        <div className="mt-4">
          <Table
            className="no-indent-table no-backgroud-title"
            columns={columns}
            dataSource={tableData}
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

      <ModalImportEtsy
        isModalOpen={isShowModal}
        setIsModalOpen={setIsShowModal}
        onImportSuccess={() => {
          fetchAllOrder(filters);
          fetchEtsyStatistic();
        }}
      />

      <Modal
        title="Replace order"
        width={720}
        style={{ top: '30%' }}
        okText="Confirm"
        cancelText="Cancel"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalReplace}
        onOk={handleReplace}
        onCancel={() => setIsShowModalReplace(false)}
        okButtonProps={{ disabled: !selectedReplaceItemIds?.length }}
      >
        <Flex vertical gap={12}>
          <div className="text-sm text-[#64748b]">
            Select the products (order items) you want to replace. Only the selected items will be replaced.
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-[#64748b]">
              Order: <span className="font-medium text-black">{orderInfo?.orderId || '—'}</span>
            </div>
            <div className="text-xs text-[#94a3b8]">
              Selected: <span className="font-medium text-black">{selectedReplaceItemIds?.length || 0}</span>
            </div>
          </div>

          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="orderItemId"
            columns={replaceItemColumns}
            dataSource={replaceItemData}
            rowSelection={{
              type: 'checkbox', // ✅ multi select
              selectedRowKeys: selectedReplaceItemIds,
              onChange: (keys) => setSelectedReplaceItemIds(keys || []),
            }}
            locale={{ emptyText: <Empty description="No items found" /> }}
            scroll={{ y: 320 }}
          />

          <div className="text-xs text-[#94a3b8]">This action cannot be undone.</div>
        </Flex>
      </Modal>
    </div>
  );
};

export default React.memo(OrderEtsy);
