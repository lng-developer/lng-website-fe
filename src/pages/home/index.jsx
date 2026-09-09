import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Input, Modal, Pagination, Table, Tooltip, Empty } from 'antd';
import { useOutletContext, useSearchParams } from 'react-router-dom';
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
import StatusComponent from '../../components/StatusComponent';
import DateRangePicker from '../../components/DateRangePicker';
import {
  getAllCountStatus,
  getALlOrder,
  getALlShop,
  replaceOrder,
  retestBasecode,
  syncVendorTracking,
  resetOrdersBulk,
  manualMapping,
} from '../../apis/order';
import { dataColors } from '../../utils/dataColors';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { dataFilterStatus } from '../../utils/dataFilter';
import SubItemImage from './table/SubItemImage';
import SubItemSku from './table/SubItemSku';
import SubItemCustom from './table/SubItemCustom';
import SubItemQuantity from './table/SubItemQuantity';
import SubItemCost from './table/SubItemCost';
import SubItemTracking from './table/SubItemTracking';
import ItemCustomer from './table/ItemCustomer';
import ItemBaseCost from './table/ItemBaseCost';
import ItemShippingType from './table/ItemShippingType';
import ItemCase from './table/ItemCase';
import ModalImportOrder from './ModalImportOrder';
import { getAllTeam } from '../../apis/teams';
import { getALlVendor } from '../../apis/vendor';
import { LoadingOutlined } from '@ant-design/icons';
import SelectSeller from '../../components/SelectSeller';
import dayjs from 'dayjs';
import OrderLogPopover from '../../components/OrderLogPopover';
import { useAuth } from '../../context/AuthContext';
import { BUYER_CUSTOMIZATION_DETAIL_COLUMNS, ORDER_EXPORT_COLUMNS, buildBuyerCustomizationDetailRows, buildOrderExportRows, fetchAllOrderPages, getBuyerFieldOrderMergeRanges } from './orderExport';
const LAST_UPDATED_KEY = 'orders_last_updated_at';
const PAGE_SIZE = 10;
const NO_COST_STATUS_OPTIONS = dataFilterStatus
  .filter(({ status }) => !['All', 'NoCostCenter', 'openCase', 'invalidAddress', 'noPsd'].includes(status))
  .map(({ status }) => status);

const Home = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVendorId = searchParams.get('vendor') || '';
  const [orders, setOrders] = useState([]);
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatus[0]);
  const [tabFilter, setTabFilter] = useState(dataFilterStatus);
  const [isShowModal, setIsShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const { collapsed } = useOutletContext();

  // State for managing cost center mapping data
  const [mappingData, setMappingData] = useState({});
  const [appliedOrders, setAppliedOrders] = useState(new Set());
  const [editingOrders, setEditingOrders] = useState(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [shippingType, setShippingType] = useState('');
  const [shops, setShops] = useState([]);
  const [selectShop, setSelectShop] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [tableHeight, setTableHeight] = useState(0);
  const [isShowModalReplace, setIsShowModalReplace] = useState(false);
  // const [selectedReplaceItemId, setSelectedReplaceItemId] = useState('');
  const [selectedReplaceItemIds, setSelectedReplaceItemIds] = useState([]);
  const [isShowModalResetOrder, setIsShowModalResetOrder] = useState(false);
  const [selectedResetOrderId, setSelectedResetOrderId] = useState('');

  const [orderInfo, setOrderInfo] = useState({});
  const [teams, setTeams] = useState([]);
  const [selectTeam, setSelectTeam] = useState('');
  const [vendors, setVendors] = useState([]);
  const [selectVendor, setSelectVendor] = useState(initialVendorId);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => {
    const saved = localStorage.getItem(LAST_UPDATED_KEY);
    return saved ? new Date(saved) : null;
  });
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    statuses: '',
    from: defaultFrom,
    to: defaultTo,
    search: '',
    isNoCostCenter: false,
    openCase: false,
    shopName: '',
    teamId: '',
    vendor: initialVendorId,
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

  const fetchCountStatus = useCallback(async () => {
    try {
      const response = await getAllCountStatus({ ...filters, openCase: false, noPsd: false });
      if (response.status === 200) {
        const resultTabFilter = dataFilterStatus.map(({ key, title, status }) => ({
          key,
          title,
          status,
          count: response.data[key] ?? 0,
        }));
        console.log('resultTabFilter :', resultTabFilter);
        setTabFilter(resultTabFilter);
      }
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 400 && filters.vendor) {
        return;
      }
      // toast.error('Error System!');
    }
  }, [filters]);

  const fetchAllOrder = useCallback(
    async (params) => {
      setLoading(true);
      // Only reset applied orders when fetching new data, keep mappingData
      setAppliedOrders(new Set());

      try {
        const response = await getALlOrder(params);
        if (response.status === 200) {
          setOrders(response.data?.data);
          setTotalCount(response.data?.totalCount);
        } else {
          toast.error(response.data?.message);
        }
      } catch (error) {
        console.log(error);
        if (error?.response?.status === 400 && params?.vendor) {
          toast.error(error?.response?.data?.message || 'Invalid vendor filter');
          return;
        }
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
      duration: Infinity, // Đang set là vô hạn
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
        console.log(response);
        toast.success('Import tracking finished!', {
          id: toastId,
          duration: 4000,
          style: {},
          icon: undefined,
        });

        fetchAllOrder(filters);
        fetchCountStatus();
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
  }, [fetchAllOrder, fetchCountStatus, filters, isImporting]);
  const handleCopy = useCallback(async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy!');
    }
  }, []);

  // Callback functions for cost center mapping
  const handleVariantDataChange = useCallback((orderItemId, variantInfo) => {
    setMappingData((prev) => ({
      ...prev,
      [orderItemId]: variantInfo,
    }));
  }, []);

  const handleProductChange = useCallback((orderItemId, product, orderId) => {
    // Mark order as being edited when user starts selecting vendor product
    setEditingOrders((prev) => new Set([...prev, orderId]));

    // Only update mapping data if product is not null
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

  // Apply mapping for all items in an order
  const handleApplyMappingForOrder = useCallback(
    async (orderId, orderItems) => {
      const editedItems = [];
      const incompleteItems = [];

      // Duyệt qua toàn bộ item trong đơn hàng để kiểm tra trạng thái
      for (const item of orderItems) {
        const itemId = item.orderItemId;
        const mappingInfo = mappingData[itemId];
        const originalData = item.cost_center;

        // Trường hợp 1: Item đang được người dùng thao tác chọn lại trong lần này
        if (mappingInfo) {
          // Phải có đủ Product và VariantData (tương đương đã chọn đủ size/color hợp lệ)
          if (mappingInfo.selectedProduct && mappingInfo.variantData) {
            editedItems.push(item);
          } else {
            incompleteItems.push(item);
          }
        }
        // Trường hợp 2: Item không bị sửa, kiểm tra xem dữ liệu gốc đã được mapping chưa
        else {
          // Dựa vào vendorProductId từ dữ liệu gốc để biết đã mapping hay chưa
          if (!originalData || !originalData.vendorProductId) {
            incompleteItems.push(item);
          }
        }
      }

      // YÊU CẦU 2: Nếu có bất kỳ item nào chưa có vendor product/size/color -> Hiện toast và chặn gọi API
      if (incompleteItems.length > 0) {
        toast.warning(`Vui lòng hoàn thành mapping cho tất cả các sản phẩm. Đang thiếu ${incompleteItems.length} item.`);
        return;
      }

      // YÊU CẦU 3: Khi tất cả đã có data hợp lệ, kiểm tra xem có item nào thực sự được sửa không
      if (editedItems.length === 0) {
        toast.info('Không có thay đổi nào để Apply.');
        return;
      }

      try {
        // Chuẩn bị Payload CHỈ chứa các item được người dùng thao tác sửa
        const itemsPayload = editedItems.map((item) => {
          const mappingInfo = mappingData[item.orderItemId];
          return {
            orderItemId: item.orderItemId,
            vendorCostCenterId: mappingInfo.variantData._id,
          };
        });

        // Lấy forcedVendorId từ item đầu tiên được sửa
        const firstItemMapping = mappingData[editedItems[0].orderItemId];

        const payload = {
          orderId,
          forcedVendorId: firstItemMapping.selectedProduct.vendorId,
          items: itemsPayload,
        };

        // GỌI API
        await manualMapping(payload);
        toast.success(`Manual mapping applied successfully for ${editedItems.length} items`);

        // RESET 1: Đánh dấu order đã apply để ẩn nút Apply ngay lập tức
        setAppliedOrders((prev) => new Set([...prev, orderId]));

        // RESET 2: Xóa order khỏi danh sách đang edit
        setEditingOrders((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });

        // RESET 3: Dọn dẹp sạch sẽ TẤT CẢ mapping data của toàn bộ item trong đơn hàng này
        setMappingData((prev) => {
          const newData = { ...prev };
          orderItems.forEach((item) => {
            delete newData[item.orderItemId]; // Xóa data của cả item sửa lẫn không sửa
          });
          return newData;
        });

        // Làm mới dữ liệu (Hàm này sẽ tự động reset appliedOrders về rỗng nhờ setAppliedOrders(new Set()))
        fetchAllOrder(filters);
      } catch (error) {
        console.error('Error applying manual mapping:', error);
        toast.error('Failed to apply manual mapping');
      }
    },
    [mappingData, fetchAllOrder, filters]
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

  const handleSearch = useCallback(
    (e) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );
  useEffect(() => {
    // Đồng bộ currentPage với filters.page
    setCurrentPage(filters.page);
  }, [filters.page]);
  const handleFilterForStatus = useCallback(
    (status) => {
      if (status === 'All') {
        return updateFilter({ statuses: '', isNoCostCenter: false, openCase: false, invalidAddress: false, noPsd: false, page: 1 });
      }

      if (status === 'NoCostCenter') {
        return updateFilter({ statuses: '', isNoCostCenter: true, openCase: false, invalidAddress: false, noPsd: false, page: 1 });
      }

      if (status === 'openCase') {
        return updateFilter({ statuses: '', isNoCostCenter: false, openCase: true, invalidAddress: false, noPsd: false, page: 1 });
      }

      if (status === 'invalidAddress') {
        return updateFilter({ statuses: '', isNoCostCenter: false, openCase: false, invalidAddress: true, noPsd: false, page: 1 });
      }

      if (status === 'noPsd') {
        return updateFilter({ statuses: '', isNoCostCenter: false, openCase: false, invalidAddress: false, noPsd: true, page: 1 });
      }

      updateFilter({ statuses: status, isNoCostCenter: false, openCase: false, invalidAddress: false, noPsd: false, page: 1 });
    },
    [updateFilter]
  );

  const handleNoCostStatusChange = useCallback(
    (status) => {
      updateFilter({ statuses: status || '', page: 1 });
    },
    [updateFilter]
  );

  const handleRetest = useCallback(
    async (id) => {
      if (!(user?.role === 'Admin')) {
        toast.error('Access denied: insufficient permissions');
        return;
      }
      try {
        const response = await retestBasecode({ orderId: id });
        if (response.status === 200) {
          toast.success('Retest success!');
        }
      } catch (error) {
        console.error(error);
        toast.error('Retest error!');
      } finally {
        fetchAllOrder(filters);
        fetchCountStatus();
      }
    },
    [fetchAllOrder, fetchCountStatus, filters, user?.role]
  );

  const handleResetOrder = useCallback(async () => {
    if (!(user?.role === 'Admin')) {
      toast.error('Access denied: insufficient permissions');
      return;
    }
    try {
      const response = await resetOrdersBulk({
        orderIds: [selectedResetOrderId],
      });
      if (response.status === 200) {
        toast.success('Reset order success!');
        setIsShowModalResetOrder(false);
        setSelectedResetOrderId('');
      }
    } catch (error) {
      console.error(error);
      toast.error('Reset order error!');
    } finally {
      fetchAllOrder(filters);
      fetchCountStatus();
    }
  }, [selectedResetOrderId, fetchAllOrder, fetchCountStatus, filters, user?.role]);

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
        toast.success('Retest success!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Retest error!');
    } finally {
      fetchAllOrder(filters);
      fetchCountStatus();
      setIsShowModalReplace(false);
    }
  }, [orderInfo?.orderId, selectedReplaceItemIds, fetchAllOrder, fetchCountStatus, filters]);

  const handleQuantityUpdated = useCallback(() => {
    fetchAllOrder(filters);
    fetchCountStatus();
  }, [fetchAllOrder, fetchCountStatus, filters]);

  const handleExportExcel = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    const toastId = toast.loading('Exporting orders...');

    try {
      const exportOrders = await fetchAllOrderPages(getALlOrder, filters);
      const exportRows = buildOrderExportRows(exportOrders);
      const buyerFieldRows = buildBuyerCustomizationDetailRows(exportOrders);

      if (!exportRows.length) {
        toast.error('No orders found to export!', { id: toastId });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Amazon Orders');
      worksheet.columns = ORDER_EXPORT_COLUMNS;
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

      const buyerFieldsWorksheet = workbook.addWorksheet('Buyer Fields');
      buyerFieldsWorksheet.columns = BUYER_CUSTOMIZATION_DETAIL_COLUMNS;
      buyerFieldRows.forEach((row) => buyerFieldsWorksheet.addRow(row));
      buyerFieldsWorksheet.getRow(1).font = { bold: true };
      buyerFieldsWorksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' },
      };
      getBuyerFieldOrderMergeRanges(buyerFieldRows).forEach(({ startRow, endRow }) => {
        buyerFieldsWorksheet.mergeCells(`A${startRow}:A${endRow}`);
      });
      buyerFieldsWorksheet.getColumn('orderId').alignment = { vertical: 'top' };
      buyerFieldsWorksheet.getColumn('field').alignment = { wrapText: true, vertical: 'top' };
      buyerFieldsWorksheet.getColumn('value').alignment = { wrapText: true, vertical: 'top' };
      buyerFieldsWorksheet.autoFilter = { from: 'A1', to: 'F1' };
      buyerFieldsWorksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `Amazon_Orders_${filters.from || 'all'}_to_${filters.to || 'all'}.xlsx`;
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);

      toast.success(`Exported ${exportRows.length} items from ${exportOrders.length} orders`, { id: toastId });
    } catch (error) {
      console.error('Export orders error:', error);
      toast.error(error?.response?.data?.message || 'Export Excel failed!', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }, [filters, isExporting]);

  // fetch shop/vendor
  const fetchAllShop = useCallback(async () => {
    try {
      const result = await getALlShop({ merchant: 'amazon' });
      if (result.status === 200) {
        setShops(result.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchAllVendors = useCallback(async () => {
    try {
      const result = await getALlVendor();
      if (result.status === 200) {
        setVendors(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load vendors');
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
    const results = (orders || []).map((item, index) => ({
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
          fetchCountStatus={fetchCountStatus}
          filters={filters}
          address_validation={item?.address_validation}
          address_validation_detail={item?.address_validation_detail}
          showMarkValidButton={true}
        />
      ),
      status: (
        <div className="flex items-center justify-center gap-1">
          <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />
          <OrderLogPopover
            orderCreatedAt={item?.createdAt}
            events={item?.history}
            triggerNode={<TbHistory size={16} className="cursor-pointer" />}
          />
        </div>
      ),
      created: (
        <Flex vertical={true}>
          <span className="font-medium whitespace-nowrap">{formatDate(item?.createdAt)}</span>
          <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
            (
            {formatDistanceToNow(item?.createdAt, { addSuffix: true })
              .replace(/^about /, '')
              .replace(/^less than /, '')}
            )
          </span>
        </Flex>
      ),
      order_date: (
        <Flex vertical={true}>
          <span className="font-medium whitespace-nowrap">{formatDate(item?.purchase_date)}</span>
          <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
            (
            {formatDistanceToNow(item?.purchase_date, { addSuffix: true })
              .replace(/^about /, '')
              .replace(/^less than /, '')}
            )
          </span>
        </Flex>
      ),
      shipping_type: (
        <ItemShippingType shipping_type={item?.shipping_type} orderId={item?.orderId} fetchAllOrder={fetchAllOrder} filters={filters} />
      ),
      config_cost_center: (
        <div>
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
          {user?.role === 'Admin' && (
            <div
              className="border-1 rounded-full px-2 my-2 cursor-pointer flex justify-center items-center text-sm"
              style={{ borderColor: dataColors.pending }}
              onClick={() => {
                setSelectedResetOrderId(item?.orderId);
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
          )}
        </div>
      ),
      base_cost: (
        <ItemBaseCost
          orderId={item?.orderId}
          base_cost={item?.base_cost}
          fetchAllOrder={fetchAllOrder}
          filters={filters}
          showResetBaseCost={true}
        />
      ),
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
      store: <StatusComponent title={item?.shopName} color={dataColors.pending} />,
      handling_time: <span className="font-medium whitespace-nowrap">6 Days</span>,
      case: <ItemCase orderId={item?.orderId} fetchAllOrder={fetchAllOrder} filters={filters} caseList={item?.case} />,
      subItems: (item?.items || []).map((itemSub, indexItem) => ({
        key: `${index}-${indexItem}`,
        product: (
          <SubItemImage
            linkImage={itemSub?.baseImageUrl}
            linkFulfill={itemSub?.fulfillment_file}
            seller={item?.seller}
            listing={itemSub?.listing}
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
            seller={item?.seller}
            listing={itemSub?.listing}
          />
        ),
        customer: <SubItemCustom items={itemSub?.version3Data} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />,
        quantity: (
          <SubItemQuantity
            quantity={itemSub?.quantity}
            orderId={item?.orderId}
            orderItemId={itemSub?.orderItemId}
            editable={true}
            onUpdated={handleQuantityUpdated}
          />
        ),
        cost_center: (
          <SubItemCost
            data={itemSub?.cost_center}
            fulfillName={`${item?.orderId}-${itemSub?.orderItemId}`}
            orderId={item?.orderId}
            orderItemId={itemSub?.orderItemId}
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
            orderItemId={itemSub?.orderItemId}
            orderId={item?.orderId}
            status={item?.status}
            fetchAllOrder={fetchAllOrder}
            filters={filters}
            fetchCountStatus={fetchCountStatus}
          />
        ),
      })),
    }));
    return results;
  }, [
    orders,
    fetchAllOrder,
    fetchCountStatus,
    filters,
    handleColorStatus,
    handleRetest,
    handleCopy,
    appliedOrders,
    editingOrders,
    handleProductChange,
    handleQuantityUpdated,
    handleSizeChange,
    handleColorChange,
    handleVariantDataChange,
    handleApplyMappingForOrder,
    user?.role,
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

  const vendorOptions = useMemo(
    () => [
      { label: 'All', value: '' },
      ...vendors.map((item) => ({
        label: item?.name || 'Unnamed vendor',
        value: item?._id,
      })),
    ],
    [vendors]
  );

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
    fetchAllVendors();
  }, [fetchAllVendors]);

  useEffect(() => {
    const currentVendor = searchParams.get('vendor') || '';
    if (currentVendor === filters.vendor) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    if (filters.vendor) {
      nextSearchParams.set('vendor', filters.vendor);
    } else {
      nextSearchParams.delete('vendor');
    }
    setSearchParams(nextSearchParams, { replace: true });
  }, [filters.vendor, searchParams, setSearchParams]);

  useEffect(() => {
    fetchCountStatus();
    fetchAllOrder(filters);
  }, [filters, fetchAllOrder, fetchCountStatus]);

  useEffect(() => {
    if (isShowRowkeys) {
      setExpandedRowKeys(orders.map((item) => item.orderId));
    }
  }, [orders, isShowRowkeys]);

  const replaceItemData = useMemo(() => {
    return (orderInfo?.items || []).map((it, idx) => ({
      key: it?.orderItemId || String(idx),
      orderItemId: it?.orderItemId,
      baseImageUrl: it?.baseImageUrl,
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
            Manage Orders Amazon{' '}
            <span className="text-xs ml-5 italic" style={{ color: dataColors.title, fontStyle: 'italic' }}>
              {lastUpdatedText}
            </span>
          </h1>
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleExportExcel}
              disabled={isExporting}
              aria-label="Export orders to Excel"
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
                  value={filters.statuses || null}
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
              <SelectSeller
                title="Vendor"
                ListData={vendorOptions}
                value={selectVendor}
                onChange={(val) => {
                  const vendorId = val || '';
                  setSelectVendor(vendorId);
                  updateFilter({ vendor: vendorId, page: 1 });
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
              current={currentPage}
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

      <ModalImportOrder isModalOpen={isShowModal} setIsModalOpen={setIsShowModal} />

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
              <span className="font-medium text-black">{selectedResetOrderId || '—'}</span>
            </div>
          </div>

          <div className="text-xs text-red-500 font-medium">⚠️ This action cannot be undone.</div>
        </Flex>
      </Modal>
    </div>
  );
};

export default React.memo(Home);
