import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Input, Modal, Pagination, Table, Tooltip, Empty } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { formatDistanceToNow } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { IoSettingsOutline } from 'react-icons/io5';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { LuImport, LuArrowDownNarrowWide } from 'react-icons/lu';
import { MdOutlineRefresh } from 'react-icons/md';
import { TbHistory, TbReplace } from 'react-icons/tb';
import { BiRefresh, BiSolidFileExport } from 'react-icons/bi';
import ButtonFilter from '../../components/ButtonFilter';
import SelectFilter from '../../components/SelectFilter';
import SelectProductType from '../../components/SelectProductType';
import StatusComponent from '../../components/StatusComponent';
import DateRangePicker from '../../components/DateRangePicker';
import { dataColors } from '../../utils/dataColors';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { dataFilterStatusEtsy } from '../../utils/dataFilter';
import SubItemSku from './table/SubItemSku';
import SubItemQuantity from './table/SubItemQuantity';
import SubItemCost from './table/SubItemCost';
import SubItemTracking from './table/SubItemTracking';
import ItemCustomer from './table/ItemCustomer';
import ItemBaseCost from './table/ItemBaseCost';
import ItemShippingType from './table/ItemShippingType';
import ItemCase from './table/ItemCase';
import ModalImportEtsy from './ModalImportEtsy';
import OrderEtsySubItemImageOptimized from '../order-etsy/components/optimized-images/OrderEtsySubItemImageOptimized';
import OrderEtsySubItemCustomOptimized from '../order-etsy/components/optimized-images/OrderEtsySubItemCustomOptimized';
import { getAllTeam } from '../../apis/teams';
import { LoadingOutlined } from '@ant-design/icons';
import SelectSeller from '../../components/SelectSeller';
import dayjs from 'dayjs';
import OrderLogPopover from '../../components/OrderLogPopover';
import { buildReplaceItemRows } from './orderEtsyReplaceItems';
import { ETSY_ORDER_EXPORT_COLUMNS, buildEtsyOrderExportRows } from './orderEtsyExport';
import { fetchAllOrderPages } from './orderExport';
import {
  getAllEtsyOrders,
  getEtsyStatistic,
  computeEtsyBaseCost,
  manualMappingEtsy,
  removeEtsyCase,
  replaceEtsyOrder,
  resetEtsyScaleOrdersBulk,
  updateEtsyBaseCost,
  updateEtsyCustomerAddress,
  updateEtsyOpenCase,
  updateEtsyOrderItemQuantity,
} from '../../apis/etsy';
import { getALlShop, syncVendorTracking } from '../../apis/order';
import { getALlVendor } from '../../apis/vendor';
const LAST_UPDATED_KEY = 'orders_last_updated_at';
const PAGE_SIZE = 10;
const NO_COST_STATUS_OPTIONS = dataFilterStatusEtsy
  .filter(({ status }) => !['All', 'NoCostCenter', 'invalidAddress', 'addressUnchecked', 'openCase', 'noPsd'].includes(status))
  .map(({ status }) => status);

const OrderEtsy = () => {
  const [orders, setOrders] = useState([]);
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusEtsy[0]);
  const [tabFilter, setTabFilter] = useState(dataFilterStatusEtsy);
  const [isShowModal, setIsShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const { collapsed } = useOutletContext();
  const [mappingData, setMappingData] = useState({});
  const [appliedOrders, setAppliedOrders] = useState(new Set());
  const [editingOrders, setEditingOrders] = useState(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [shippingType, setShippingType] = useState('');
  const [shops, setShops] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectShop, setSelectShop] = useState('');
  const [selectVendor, setSelectVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [tableHeight, setTableHeight] = useState(0);
  const [isShowModalReplace, setIsShowModalReplace] = useState(false);
  const [selectedReplaceItemIds, setSelectedReplaceItemIds] = useState([]);
  const [isShowModalResetOrder, setIsShowModalResetOrder] = useState(false);
  const [selectedResetOrderId, setSelectedResetOrderId] = useState('');

  const [orderInfo, setOrderInfo] = useState({});
  const [teams, setTeams] = useState([]);
  const [selectTeam, setSelectTeam] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
    addressUnchecked: false,
    openCase: false,
    noPsd: false,
    shopName: '',
    teamId: '',
    vendorId: '',
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
      setAppliedOrders(new Set());
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

  const getEtsyItemId = useCallback((item) => item?.transactionId || item?.orderItemId, []);

  const handleVariantDataChange = useCallback((orderItemId, variantInfo) => {
    setMappingData((prev) => ({
      ...prev,
      [orderItemId]: variantInfo,
    }));
  }, []);

  const handleProductChange = useCallback((orderItemId, product, orderId) => {
    setEditingOrders((prev) => new Set([...prev, orderId]));

    if (product) {
      setMappingData((prev) => ({
        ...prev,
        [orderItemId]: {
          ...prev[orderItemId],
          selectedProduct: product,
        },
      }));
    }
  }, []);

  const handleSizeChange = useCallback((orderItemId, size) => {
    setMappingData((prev) => ({
      ...prev,
      [orderItemId]: {
        ...prev[orderItemId],
        selectedSize: size,
      },
    }));
  }, []);

  const handleColorChange = useCallback((orderItemId, color) => {
    setMappingData((prev) => ({
      ...prev,
      [orderItemId]: {
        ...prev[orderItemId],
        selectedColor: color,
      },
    }));
  }, []);

  const handleApplyMappingForOrder = useCallback(
    async (orderId, orderItems) => {
      const editedItems = [];
      const incompleteItems = [];

      for (const item of orderItems) {
        const itemId = getEtsyItemId(item);
        const mappingInfo = mappingData[itemId];
        const originalData = item.cost_center;

        if (mappingInfo) {
          if (mappingInfo.selectedProduct && mappingInfo.variantData) {
            editedItems.push(item);
          } else {
            incompleteItems.push(item);
          }
        } else if (!originalData || !originalData.vendorProductId) {
          incompleteItems.push(item);
        }
      }

      if (incompleteItems.length > 0) {
        toast.warning(`Please complete mapping for all products. Missing ${incompleteItems.length} item.`);
        return;
      }

      if (editedItems.length === 0) {
        toast.info('No changes to apply.');
        return;
      }

      try {
        const itemsPayload = editedItems.map((item) => {
          const itemId = getEtsyItemId(item);
          const mappingInfo = mappingData[itemId];
          return {
            transactionId: itemId,
            vendorCostCenterId: mappingInfo.variantData._id,
          };
        });

        const firstItemId = getEtsyItemId(editedItems[0]);
        const firstItemMapping = mappingData[firstItemId];
        const payload = {
          orderId,
          forcedVendorId: firstItemMapping.selectedProduct.vendorId,
          items: itemsPayload,
        };

        await manualMappingEtsy(payload);
        toast.success(`Manual mapping applied successfully for ${editedItems.length} items`);

        setAppliedOrders((prev) => new Set([...prev, orderId]));
        setEditingOrders((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
        setMappingData((prev) => {
          const next = { ...prev };
          orderItems.forEach((item) => {
            delete next[getEtsyItemId(item)];
          });
          return next;
        });

        fetchAllOrder(filters);
        fetchEtsyStatistic();
      } catch (error) {
        console.error('Error applying Etsy manual mapping:', error);
        toast.error(error?.response?.data?.message || 'Failed to apply manual mapping');
      }
    },
    [fetchAllOrder, fetchEtsyStatistic, filters, getEtsyItemId, mappingData]
  );

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
      setSelectVendor(null);
      const resetSpecialFilters = { isNoCostCenter: false, invalidAddress: false, addressUnchecked: false, openCase: false, noPsd: false, vendorId: '' };
      if (status === 'All')
        return updateFilter({ status: '', ...resetSpecialFilters, page: 1 });
      if (status === 'NoCostCenter')
        return updateFilter({ status: '', ...resetSpecialFilters, isNoCostCenter: true, page: 1 });
      if (status === 'addressUnchecked')
        return updateFilter({ status: '', ...resetSpecialFilters, addressUnchecked: true, page: 1 });
      if (status === 'invalidAddress')
        return updateFilter({ status: '', ...resetSpecialFilters, invalidAddress: true, page: 1 });
      if (status === 'openCase')
        return updateFilter({ status: '', ...resetSpecialFilters, openCase: true, page: 1 });
      if (status === 'noPsd')
        return updateFilter({ status: '', ...resetSpecialFilters, noPsd: true, page: 1 });
      // Status thông thường: New, Fulfilled, Shipped, Cancelled, Refund
      updateFilter({ status, ...resetSpecialFilters, page: 1 });
    },
    [updateFilter]
  );

  const handleNoCostStatusChange = useCallback(
    (status) => {
      updateFilter({ status: status || '', page: 1 });
    },
    [updateFilter]
  );

  const handleRetest = useCallback(
    async (id) => {
      try {
        const toastId = toast.loading('Computing base cost...');
        const response = await computeEtsyBaseCost({ orderId: id, forceAddressValidation: true });
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

  const handleEtsyTrackingUpdated = useCallback((payload) => {
    if (!payload?.orderId || !payload?.transactionId) return;

    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (String(order?.orderId) !== String(payload.orderId)) return order;

        return {
          ...order,
          status: payload.orderStatus || order.status,
          orderStatus: payload.orderStatus || order.orderStatus,
          items: (order?.items || []).map((orderItem) => {
            const itemId = orderItem?.transactionId || orderItem?.orderItemId;
            if (String(itemId) !== String(payload.transactionId)) return orderItem;

            return {
              ...orderItem,
              tracking_info: {
                ...(orderItem.tracking_info || {}),
                ...(payload.tracking_info || payload.applied || {}),
                ...(Object.prototype.hasOwnProperty.call(payload, 'note') ? { note: payload.note } : {}),
              },
            };
          }),
        };
      })
    );
  }, []);

  const handleReplace = useCallback(async () => {
    try {
      const transactionIds = buildReplaceItemRows(orderInfo?.items || [])
        .filter((item) => selectedReplaceItemIds.includes(item.key))
        .map((item) => item.transactionId)
        .filter(Boolean);

      if (!transactionIds?.length) {
        toast.error('Please select at least one item to replace');
        return;
      }

      const replacePayload = {
        transactionIds,
        note: 'Replace wrong size',
      };

      console.log('[Etsy Replace] request', {
        orderId: orderInfo?.orderId,
        selectedReplaceItemIds,
        payload: replacePayload,
      });

      const response = await replaceEtsyOrder(orderInfo?.orderId, replacePayload);

      console.log('[Etsy Replace] response', {
        status: response?.status,
        data: response?.data,
      });

      if (response.status === 200) {
        toast.success('Replace success!');
      }
    } catch (error) {
      console.error('[Etsy Replace] error', {
        orderId: orderInfo?.orderId,
        selectedReplaceItemIds,
        error,
        response: error?.response?.data,
      });
      toast.error('Replace error!');
    } finally {
      fetchAllOrder(filters);
      fetchEtsyStatistic();
      setIsShowModalReplace(false);
      setSelectedReplaceItemIds([]);
    }
  }, [orderInfo?.items, orderInfo?.orderId, selectedReplaceItemIds, fetchAllOrder, fetchEtsyStatistic, filters]);

  const handleResetOrder = useCallback(async () => {
    if (!selectedResetOrderId) {
      toast.error('Please select an order to reset');
      return;
    }

    try {
      const response = await resetEtsyScaleOrdersBulk({
        orderIds: [selectedResetOrderId],
        note: 'redo',
      });
      if (response.status === 200) {
        toast.success('Reset order success!');
        setIsShowModalResetOrder(false);
        setSelectedResetOrderId('');
      } else {
        toast.error(response.data?.message || 'Reset order error!');
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Reset order error!');
    } finally {
      fetchAllOrder(filters);
      fetchEtsyStatistic();
    }
  }, [fetchAllOrder, fetchEtsyStatistic, filters, selectedResetOrderId]);

  const handleQuantityUpdated = useCallback(() => {
    fetchAllOrder(filters);
    fetchEtsyStatistic();
  }, [fetchAllOrder, fetchEtsyStatistic, filters]);

  const handleExportExcel = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    const toastId = toast.loading('Exporting Etsy orders...');

    try {
      const exportOrders = await fetchAllOrderPages(getAllEtsyOrders, filters);
      const exportRows = buildEtsyOrderExportRows(exportOrders);

      if (!exportRows.length) {
        toast.error('No orders found to export!', { id: toastId });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Etsy Orders');
      worksheet.columns = ETSY_ORDER_EXPORT_COLUMNS;
      exportRows.forEach((row) => worksheet.addRow(row));

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' },
      };
      worksheet.getColumn('address').alignment = { wrapText: true, vertical: 'top' };
      worksheet.getColumn('costCenter').alignment = { wrapText: true, vertical: 'top' };
      worksheet.getColumn('tracking').alignment = { wrapText: true, vertical: 'top' };
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `Etsy_Orders_${filters.from || 'all'}_to_${filters.to || 'all'}.xlsx`;
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);

      toast.success(`Exported ${exportRows.length} items from ${exportOrders.length} orders`, { id: toastId });
    } catch (error) {
      console.error('Export Etsy orders error:', error);
      toast.error(error?.response?.data?.message || 'Export Excel failed!', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }, [filters, isExporting]);

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

  const fetchAllVendor = useCallback(async () => {
    try {
      const response = await getALlVendor();
      if (response.status === 200) {
        setVendors(
          (response.data || []).map((item) => ({
            value: item?._id,
            label: item?.name,
          }))
        );
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
            address_validation_detail={item?.address_validation_detail}
            updateCustomerInfoRequest={updateEtsyCustomerAddress}
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
          <div className="flex flex-col items-center gap-2">
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
            <div
              className="border-1 rounded-full px-2 cursor-pointer flex justify-center items-center text-sm"
              style={{ borderColor: dataColors.pending }}
              onClick={() => {
                setSelectedResetOrderId(item?.orderId || '');
                setIsShowModalResetOrder(true);
              }}
            >
              <div>
                <BiRefresh size={16} color={dataColors.pending} />
              </div>
              <span className="font-medium whitespace-nowrap ml-1" style={{ color: dataColors.pending }}>
                Reset Order
              </span>
            </div>
          </div>
        ),
        base_cost: (
          <ItemBaseCost
            orderId={item?.orderId}
            base_cost={item?.base_cost}
            fetchAllOrder={fetchAllOrder}
            filters={filters}
            updateBaseCostRequest={updateEtsyBaseCost}
          />
        ),
        replace: (
          <div
            className="border-1 rounded-full px-2 cursor-pointer flex justify-center items-center text-sm"
            style={{ borderColor: dataColors.pending }}
            onClick={() => {
              setOrderInfo(item);
              setSelectedReplaceItemIds([]);
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
        case: (
          <ItemCase
            orderId={item?.orderId}
            fetchAllOrder={fetchAllOrder}
            filters={filters}
            caseList={item?.case}
            openCaseHandler={updateEtsyOpenCase}
            removeCaseHandler={removeEtsyCase}
          />
        ),
        subItems: (item?.items || []).map((itemSub, indexItem) => {
          const itemId = getEtsyItemId(itemSub);
          return {
            key: `${index}-${indexItem}`,
            product: (
              <OrderEtsySubItemImageOptimized
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
                seller={itemSub?.seller || item?.seller}
                sellerName={itemSub?.seller?.full_name || itemSub?.seller?.sellerCode || item?.seller?.full_name || '—'}
                listing={itemSub?.listingId}
              />
            ),
            customer: (
              <OrderEtsySubItemCustomOptimized
                items={itemSub?.version3Data}
                customUrl={itemSub?.customized_url}
                linkImage={itemSub?.snapshotImage}
                listingId={itemSub?.listingId}
                customFiles={itemSub?.customFiles || []}
                orderId={item?.orderId}
                transactionId={itemId}
              />
            ),
            quantity: (
              <SubItemQuantity
                quantity={itemSub?.quantity}
                orderId={item?.orderId}
                orderItemId={itemId}
                editable={true}
                updateQuantity={updateEtsyOrderItemQuantity}
                onUpdated={handleQuantityUpdated}
              />
            ),
            cost_center: (
              <SubItemCost
                data={itemSub?.cost_center}
                fulfillName={`${item?.orderId}-${itemId}`}
                orderId={item?.orderId}
                orderItemId={itemId}
                onProductChange={handleProductChange}
                onSizeChange={handleSizeChange}
                onColorChange={handleColorChange}
                onVariantDataChange={handleVariantDataChange}
                isLastItem={indexItem === (item?.items || []).length - 1}
                onApplyMapping={handleApplyMappingForOrder}
                orderItems={item?.items || []}
                isOrderApplied={appliedOrders.has(item?.orderId)}
                isOrderEditing={editingOrders.has(item?.orderId)}
              />
            ),
            tracking_note: (
              <SubItemTracking
                tracking_info={itemSub?.tracking_info}
                orderItemId={itemId}
                transactionId={itemId}
                orderId={item?.orderId}
                status={item?.status}
                fetchAllOrder={fetchAllOrder}
                filters={filters}
                fetchCountStatus={fetchEtsyStatistic}
                isEtsyOrder={true}
                onTrackingUpdated={handleEtsyTrackingUpdated}
              />
            ),
          };
        }),
      };
    });
    return results;
  }, [
    orders,
    fetchAllOrder,
    fetchEtsyStatistic,
    filters,
    handleColorStatus,
    handleRetest,
    handleCopy,
    getEtsyItemId,
    handleProductChange,
    handleSizeChange,
    handleColorChange,
    handleVariantDataChange,
    handleApplyMappingForOrder,
    handleEtsyTrackingUpdated,
    handleQuantityUpdated,
    appliedOrders,
    editingOrders,
  ]);

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
    fetchAllVendor();
  }, [fetchAllVendor]);

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
    return buildReplaceItemRows(orderInfo?.items || []);
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
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleExportExcel}
              disabled={isExporting}
              aria-label="Export Etsy orders to Excel"
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </span>
              <div style={{ color: 'black' }}>
                <BiSolidFileExport size={15} />
              </div>
            </button>
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

        <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="w-[280px] flex-none">
              <Input
                onChange={handleSearch}
                placeholder="Search orders by ID, Customer..."
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {filters.isNoCostCenter && (
                <SelectFilter
                  title="Status"
                  ListData={NO_COST_STATUS_OPTIONS}
                  value={filters.status || null}
                  onChange={handleNoCostStatusChange}
                />
              )}
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
              <SelectProductType
                title="Vendor"
                ListData={vendors}
                value={selectVendor}
                onChange={(val) => {
                  setSelectVendor(val);
                  updateFilter({ vendorId: val || '', page: 1 });
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
        onCancel={() => {
          setIsShowModalReplace(false);
          setSelectedReplaceItemIds([]);
        }}
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
            rowKey="key"
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

      <Modal
        title="Reset Order Confirmation"
        width={480}
        style={{ top: '30%' }}
        okText="Confirm Reset"
        cancelText="Cancel"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalResetOrder}
        onOk={handleResetOrder}
        onCancel={() => {
          setIsShowModalResetOrder(false);
          setSelectedResetOrderId('');
        }}
        okButtonProps={{ danger: true }}
      >
        <Flex vertical gap={16}>
          <div className="text-sm text-[#64748b]">
            Are you sure you want to reset this order? This action will reset the order status and cannot be undone.
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="text-sm">
              <span className="text-[#64748b]">Order ID: </span>
              <span className="font-medium text-black">{selectedResetOrderId || '---'}</span>
            </div>
          </div>

          <div className="text-xs text-red-500 font-medium">This action cannot be undone.</div>
        </Flex>
      </Modal>
    </div>
  );
};

export default React.memo(OrderEtsy);
