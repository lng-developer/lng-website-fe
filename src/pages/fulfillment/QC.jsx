import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Flex, Input, Modal, Pagination, Table, Tooltip, Button } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { dataColors } from '../../utils/dataColors';
import SelectFilter from '../../components/SelectFilter';
import StatusComponent from '../../components/StatusComponent';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { formatDistanceToNow } from 'date-fns';
import { dataFilterStatusQC } from '../../utils/dataFilter';
import ButtonFilter from '../../components/ButtonFilter';
import QcCanvasModal from './ModalQC';
import { MdOutlineImageSearch } from 'react-icons/md';
import { BiRefresh } from 'react-icons/bi';
import {
  getAllCountStatusQC,
  getAllQC,
  getALlShop,
  retryScaleOrder,
  sendFailedOrdersToFulfillment,
  pushSelectedOrdersToFulfillmentPlatform,
} from '../../apis/order';
import { toast } from 'sonner';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import DateRangePicker from '../../components/DateRangePicker';
import { handleColorStatus, handleColorStatusScale } from '../../utils/handleColor';
import ItemProductInfoQC from './ItemProductInfoQC';
import { debounce } from 'lodash';
import { FcApproval } from 'react-icons/fc';
import { IoArrowUndo } from 'react-icons/io5';
import { getAllSellers } from '../../apis/user';
import { MdOutlineRefresh, MdOutlineSend } from 'react-icons/md';
import SelectSeller from '../../components/SelectSeller';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DESIGN_EXPORT_FIELDS, getCustomizationExportValue, getDesignExportValues } from './exportHelpers';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

const QC = () => {
  const { collapsed } = useOutletContext();

  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusQC[0]);

  const [openModalQC, setOpenMOdalQC] = useState(false);
  const [dataView, setDataView] = useState({});
  const [indexQC, setIndexQC] = useState(0);

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [tableHeight, setTableHeight] = useState(0);

  const [tabFilter, setTabFilter] = useState(dataFilterStatusQC);

  const [sellers, setSellers] = useState([]);
  const [selectSeller, setSelectSeller] = useState();
  const [shops, setShops] = useState([]);
  const [selectShop, setSelectShop] = useState('');

  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    scale_status: '',
    from: defaultFrom,
    to: defaultTo,
    search: '',
    sellerId: '',
    shopName: '',
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [sendingToFulfillment, setSendingToFulfillment] = useState(false);
  const [pushingToFulfillmentPlatform, setPushingToFulfillmentPlatform] = useState(false);
  const [openFulfillmentPushModal, setOpenFulfillmentPushModal] = useState(false);
  const [fulfillmentPushResult, setFulfillmentPushResult] = useState(null);
  const isFailedFilter = isActiveFilter?.status === 'Failed' || isActiveFilter?.title === 'Failed';

  const selectedOrdersForFulfillment = useMemo(
    () => dataSource.filter((order) => selectedRowKeys.includes(order.orderId)),
    [dataSource, selectedRowKeys]
  );

  const selectedFulfillmentItemCount = useMemo(
    () => selectedOrdersForFulfillment.reduce((sum, order) => sum + (Array.isArray(order.items) ? order.items.length : 0), 0),
    [selectedOrdersForFulfillment]
  );

  const updateFilter = useCallback((newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      // Nếu newValues có page thì dùng page đó, nếu không thì giữ nguyên page hiện tại
      page: Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : prev.page,
    }));
  }, []);

  const handlePageChange = useCallback(
    (page, newPageSize) => {
      const updatedPageSize = newPageSize || pageSize;
      updateFilter({ page, perPage: updatedPageSize });
      setCurrentPage(page);
      if (newPageSize && newPageSize !== pageSize) {
        setPageSize(updatedPageSize);
      }
    },
    [updateFilter, pageSize]
  );

  const handleExpand = useCallback((expanded, record) => {
    setExpandedRowKeys((prev) => (expanded ? [...prev, record.key] : prev.filter((key) => key !== record.key)));
  }, []);

  const handleShowRowKeys = useCallback(() => {
    setExpandedRowKeys(isShowRowkeys ? [] : dataSource.map((item) => item.orderId));
    setIsShowRowKeys((prev) => !prev);
  }, [isShowRowkeys, dataSource]);

  const columns = useMemo(
    () =>
      [
        { title: <span style={{ color: dataColors.title }}>Order ID</span>, dataIndex: 'orderId', key: 'orderId', align: 'center' },
        {
          title: <span style={{ color: dataColors.title }}>Status QC</span>,
          dataIndex: 'scale_overall_status',
          key: 'scale_overall_status',
          align: 'center',
        },
        { title: <span style={{ color: dataColors.title }}>Created</span>, dataIndex: 'createdAt', key: 'createdAt', align: 'center' },
        {
          title: <span style={{ color: dataColors.title }}>Order Date</span>,
          dataIndex: 'purchase_date',
          key: 'purchase_date',
          align: 'center',
        },
        { title: <span style={{ color: dataColors.title }}>Status Order</span>, dataIndex: 'status', key: 'status', align: 'center' },
        {
          title: <span style={{ color: dataColors.title }}>Shipping Type</span>,
          dataIndex: 'shipping_type',
          key: 'shipping_type',
          align: 'center',
        },
        { title: <span style={{ color: dataColors.title }}>Shop</span>, dataIndex: 'shopName', key: 'shopName', align: 'center' },
        { title: <span style={{ color: dataColors.title }}>Scale By</span>, dataIndex: 'scale_by', key: 'scale_by', align: 'center' },
        { title: <span style={{ color: dataColors.title }}>QC By</span>, dataIndex: 'qc_by', key: 'qc_by', align: 'center' },
        isFailedFilter && {
          title: <span style={{ color: dataColors.title }}>Retry</span>,
          dataIndex: 'action_retry',
          key: 'action_retry',
          align: 'center',
        },
      ].filter(Boolean),
    [isFailedFilter]
  );

  const subColumns = useMemo(
    () => [
      {
        title: <span style={{ color: dataColors.title }}>Product Info</span>,
        dataIndex: 'product_info',
        key: 'product_info',
        align: 'left',
      },
      {
        title: <span style={{ color: dataColors.title }}>Scale Status</span>,
        dataIndex: 'scale_status',
        key: 'scale_status',
        align: 'center',
      },
      {
        title: <span style={{ color: dataColors.title }}>Order Owner</span>,
        dataIndex: 'seller',
        key: 'seller',
        align: 'center',
      },
      {
        title: <span style={{ color: dataColors.title }}>Fulfill Name</span>,
        dataIndex: 'fulfill_name',
        key: 'fulfill_name',
        align: 'center',
      },
      { title: <span style={{ color: dataColors.title }}>PNG Status</span>, dataIndex: 'png_status', key: 'png_status', align: 'center' },
      {
        title: <span style={{ color: dataColors.title }}>Vendor Product</span>,
        dataIndex: 'cost_center',
        key: 'cost_center',
        align: 'center',
      },
      { title: <span style={{ color: dataColors.title }}>Action</span>, dataIndex: 'action', key: 'action', align: 'center' },
    ],
    []
  );

  const expandedRowRender = useCallback(
    (record) => (
      <Table
        columns={subColumns}
        dataSource={record.subItems}
        pagination={false}
        rowKey="key"
        rowClassName={() => 'table-row-center'}
        style={{ padding: 16 }}
      />
    ),
    [subColumns]
  );

  // =============== API ===============
  const fetchAllQC = useCallback(async (params) => {
    setLoading(true);
    try {
      const response = await getAllQC(params);
      if (response.status === 200) {
        setDataSource(response.data?.data || []);
        setTotalCount(response.data?.totalCount || 0);
      } else {
        toast.error(response.data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCountStatus = useCallback(async () => {
    try {
      const response = await getAllCountStatusQC(filters);
      if (response.status === 200) {
        const resultTabFilter = dataFilterStatusQC.map(({ key, title, status }) => ({
          key,
          title,
          status,
          count: response.data?.overall?.counts[key] ?? 0,
        }));
        setTabFilter(resultTabFilter);
      }
    } catch (error) {
      console.log(error);
    }
  }, [filters]);

  const handleFilterForStatus = useCallback(
    (status) => {
      updateFilter({ scale_status: status === 'All' ? '' : status, page: 1 });
    },
    [updateFilter]
  );

  const fetchAllSellersMemo = useCallback(async () => {
    try {
      const res = await getAllSellers();
      if (res.status === 200) {
        const result = (res.data || []).map((item) => ({
          label: item?.full_name,
          value: item?._id,
        }));
        setSellers(result);
      } else {
        toast.error(res.data?.message || 'Fetch error');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unexpected error');
    }
  }, []);

  const fetchAllShop = useCallback(async () => {
    try {
      const result = await getALlShop();
      if (result.status === 200) setShops(result.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  // debounce search
  const debouncedSearch = useMemo(() => debounce((keyword) => updateFilter({ search: keyword || '', page: 1 }), 300), [updateFilter]);
  const handleSearch = useCallback((e) => debouncedSearch(e.target.value), [debouncedSearch]);

  const handleCopy = useCallback(async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy!');
    }
  }, []);

  // Export Excel function
  const handleExportExcel = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      toast.error('Please select orders to export');
      return;
    }

    try {
      // Filter selected orders from original dataSource
      const selectedOrders = dataSource.filter((order) => selectedRowKeys.includes(order.orderId));

      if (selectedOrders.length === 0) {
        toast.error('No matching orders found for export');
        return;
      }

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('QC Export');

      // Define columns
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 20 },
        { header: 'Mock Up', key: 'mockUp', width: 50 },
        ...DESIGN_EXPORT_FIELDS.map((field) => ({ header: field.header, key: field.key, width: 50 })),
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Full Name (Shipping)', key: 'fullName', width: 25 },
        { header: 'Address 1 (Shipping)', key: 'address1', width: 30 },
        { header: 'Address 2 (Shipping)', key: 'address2', width: 30 },
        { header: 'City (Shipping)', key: 'city', width: 20 },
        { header: 'Postcode (Shipping)', key: 'postcode', width: 15 },
        { header: 'State Name (Shipping)', key: 'state', width: 20 },
        { header: 'Customization', key: 'customization', width: 60 },
      ];

      // Add data rows
      selectedOrders.forEach((order) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const rowData = {
              orderId: order.orderId || '',
              mockUp: item.baseImageUrl || '',
              ...getDesignExportValues(item.fulfillment_file),
              quantity: item.quantity || 0,
              fullName: order.customer_infor?.name || '',
              address1: order.customer_infor?.address || '',
              address2: order.customer_infor?.address_2 || '',
              city: order.customer_infor?.city || '',
              postcode: order.customer_infor?.zip_code || '',
              state: order.customer_infor?.state || '',
              customization: getCustomizationExportValue(item),
            };

            worksheet.addRow(rowData);
          });
        }
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' },
      };
      worksheet.getColumn('customization').alignment = { wrapText: true, vertical: 'top' };

      // Generate filename with current date
      const now = new Date();
      const filename = `QC_Export_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.xlsx`;

      // Generate buffer and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);

      const totalItems = selectedOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
      toast.success(`Exported ${totalItems} items from ${selectedOrders.length} orders to Excel`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel file');
    }
  }, [selectedRowKeys, dataSource]);

  const handleSendSelectedToFulfillment = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      toast.error('Please select failed orders to send');
      return;
    }

    if (selectedOrdersForFulfillment.length === 0) {
      toast.error('No matching orders found to send');
      return;
    }

    const payload = { orderIds: selectedOrdersForFulfillment.map((order) => order.orderId) };
    setSendingToFulfillment(true);

    try {
      const response = await sendFailedOrdersToFulfillment(payload);
      if (response.status >= 200 && response.status < 300) {
        toast.success(`Sent ${selectedOrdersForFulfillment.length} orders to fulfillment`);
        setSelectedRowKeys([]);
        fetchAllQC(filters);
        fetchCountStatus();
      } else {
        toast.error(response.data?.message || 'Failed to send orders to fulfillment');
      }
    } catch (error) {
      console.error('Send fulfillment error:', error);
      toast.error(error?.response?.data?.message || 'Failed to send orders to fulfillment');
    } finally {
      setSendingToFulfillment(false);
    }
  }, [fetchAllQC, fetchCountStatus, filters, selectedOrdersForFulfillment, selectedRowKeys.length]);

  const openPushFulfillmentModal = useCallback(() => {
    if (!isFailedFilter) {
      toast.error('Please switch to Failed filter before pushing orders to Fulfillment Platform v2');
      return;
    }

    if (selectedRowKeys.length === 0) {
      toast.error('Please select orders to push');
      return;
    }

    if (selectedOrdersForFulfillment.length === 0) {
      toast.error('No matching orders found to push');
      return;
    }

    setFulfillmentPushResult(null);
    setOpenFulfillmentPushModal(true);
  }, [isFailedFilter, selectedOrdersForFulfillment.length, selectedRowKeys.length]);

  const closePushFulfillmentModal = useCallback(() => {
    setOpenFulfillmentPushModal(false);
    setFulfillmentPushResult(null);
  }, []);

  const handlePushSelectedToFulfillmentPlatform = useCallback(async () => {
    if (selectedOrdersForFulfillment.length === 0) {
      toast.error('No matching orders found to push');
      return;
    }

    setPushingToFulfillmentPlatform(true);

    try {
      const response = await pushSelectedOrdersToFulfillmentPlatform({
        orderIds: selectedOrdersForFulfillment.map((order) => order.orderId),
      });
      if (response.status >= 200 && response.status < 300) {
        const fulfillment = response.data?.fulfillment || {};
        const received = fulfillment.received ?? selectedOrdersForFulfillment.length;
        const inserted = fulfillment.inserted ?? 0;
        const updated = fulfillment.updated ?? 0;
        const skipped = fulfillment.skipped ?? 0;
        const errorsCount = Array.isArray(fulfillment.errors) ? fulfillment.errors.length : 0;

        setFulfillmentPushResult({
          received,
          inserted,
          updated,
          skipped,
          errorsCount,
        });
        toast.success(
          `Pushed ${selectedOrdersForFulfillment.length} orders to FFv2. Inserted: ${inserted}, skipped: ${skipped}, errors: ${errorsCount}`
        );
        setSelectedRowKeys([]);
        fetchAllQC(filters);
        fetchCountStatus();
      } else {
        toast.error(response.data?.message || 'Failed to push orders to Fulfillment Platform');
      }
    } catch (error) {
      console.error('Push Fulfillment Platform test error:', error);
      toast.error(error?.response?.data?.message || 'Failed to push orders to Fulfillment Platform');
    } finally {
      setPushingToFulfillmentPlatform(false);
    }
  }, [fetchAllQC, fetchCountStatus, filters, selectedOrdersForFulfillment]);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleRetry = useCallback(
    async (orderId) => {
      try {
        const response = await retryScaleOrder(orderId);
        if (response.status === 200) {
          toast.success('Retry request sent successfully!');
          // Load lại dữ liệu sau khi retry thành công
          fetchAllQC(filters);
        } else {
          toast.error('Retry failed!');
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || 'Retry error!');
      }
    },
    [fetchAllQC, filters]
  );

  /**
   * NEW: Queue tất cả item Pending theo đúng thứ tự hiển thị list hiện tại.
   * Mỗi entry là 1 "target" để modal nhảy qua item/order kế tiếp.
   */
  const qcQueue = useMemo(() => {
    const queue = [];
    (dataSource || []).forEach((order, orderIndex) => {
      (order?.items || []).forEach((it, itemIndex) => {
        if (String(it?.scale_status || '').toLowerCase() === 'pending') {
          queue.push({
            orderIndex,
            itemIndex,
            orderId: order?.orderId,
            orderItemId: it?.orderItemId,
          });
        }
      });
    });
    return queue;
  }, [dataSource]);

  /**
   * NEW: Sau Pass/Reject, parent tự chọn target kế tiếp trong queue và set lại modal content.
   */
  const goNextAfter = useCallback(
    (currentOrderId, currentOrderItemId) => {
      if (!qcQueue.length) {
        setOpenMOdalQC(false);
        return;
      }

      const idx = qcQueue.findIndex((x) => x.orderId === currentOrderId && x.orderItemId === currentOrderItemId);
      const next = idx >= 0 ? qcQueue[idx + 1] : qcQueue[0];

      if (!next) {
        setOpenMOdalQC(false);
        return;
      }

      const nextOrder = dataSource?.[next.orderIndex];
      if (!nextOrder) {
        setOpenMOdalQC(false);
        return;
      }

      setDataView(nextOrder);
      setIndexQC(next.itemIndex);
      setOpenMOdalQC(true);
    },
    [qcQueue, dataSource]
  );

  // =============== TABLE DATA ===============
  const tableData = useMemo(() => {
    return (dataSource || []).map((item, index) => ({
      key: item?.orderId,
      orderId: (
        <button className="cursor-pointer" onClick={() => handleCopy(item?.orderId)}>
          <StatusComponent title={item?.orderId} color={dataColors.default} isDefault={true} />
        </button>
      ),
      status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
      scale_overall_status: (
        <StatusComponent title={item?.scale_overall_status} color={handleColorStatusScale(item?.scale_overall_status)} />
      ),
      createdAt: (
        <Flex vertical>
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
      purchase_date: (
        <Flex vertical>
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
      scale_by: <StatusComponent title={item?.scaledBy?.full_name || 'No data'} color={dataColors.process} />,
      action_retry: isFailedFilter ? (
        <Tooltip title="Retry Scale">
          <div
            className="border-1 rounded-full  cursor-pointer flex justify-center items-center text-sm"
            style={{ borderColor: dataColors.pending }}
            onClick={(e) => {
              e.stopPropagation();
              handleRetry(item.orderId);
            }}
          >
            <div>
              <BiRefresh size={16} color={dataColors.pending} />
            </div>
            <span className="font-medium whitespace-nowrap ml-1" style={{ color: dataColors.pending }}>
              Retry
            </span>
          </div>
        </Tooltip>
      ) : null,
      shipping_type: <StatusComponent title={item?.shipping_type} color={dataColors.asin} />,
      shopName: <StatusComponent title={item?.shopName} color={dataColors.pending} />,
      qc_by: <StatusComponent title={item?.scale_by || 'Đặng Thành Trung CS'} color={dataColors.purple} />,
      subItems: (item?.items || []).map((itemSub, indexItem) => ({
        key: `${index}-${indexItem}`,
        product_info: (
          <ItemProductInfoQC
            link={itemSub?.baseImageUrl}
            listing={itemSub?.listing}
            sku={itemSub?.sku}
            asin={itemSub?.asin}
            quantity={itemSub?.quantity}
          />
        ),
        scale_status: <StatusComponent title={itemSub?.scale_status} color={handleColorStatusScale(itemSub?.scale_status)} />,
        seller: <StatusComponent title={item?.seller?.full_name} color={dataColors.process} />,
        png_status: (
          <StatusComponent
            title={itemSub?.listing?.psd?.status}
            color={itemSub?.listing?.psd?.status === 'Available' ? dataColors.success : dataColors.cancelled}
          />
        ),
        fulfill_name: (
          <div
            style={{ borderColor: dataColors.default, backgroundColor: `${dataColors.default}10` }}
            className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground"
          >
            <span>{`${item?.orderId}-${itemSub?.orderItemId}`}</span>
          </div>
        ),
        cost_center: (
          <div
            style={{ borderColor: dataColors.default, backgroundColor: `${dataColors.default}10` }}
            className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground"
          >
            <span>{itemSub?.cost_center?.vendorProductDisplayName || 'No data'}</span>
          </div>
        ),
        action: (
          <>
            {itemSub?.scale_status === 'Pending' ? (
              <Tooltip title="QC">
                <button
                  className="cursor-pointer border rounded"
                  style={{ padding: 6, borderColor: dataColors.default }}
                  onClick={() => {
                    setDataView(item); // orderInfo
                    setIndexQC(indexItem); // item index trong order
                    setOpenMOdalQC(true);
                  }}
                >
                  <MdOutlineImageSearch size={20} />
                </button>
              </Tooltip>
            ) : itemSub?.scale_status === 'Complete' ? (
              <div className="flex justify-center items-center">
                <FcApproval size={25} />
              </div>
            ) : (
              <div className="flex justify-center items-center">
                <IoArrowUndo size={25} color={dataColors.cancelled} />
              </div>
            )}
          </>
        ),
      })),
    }));
  }, [dataSource, handleCopy, handleRetry, isFailedFilter]);

  // =============== EFFECTS ===============
  useEffect(() => {
    // Đồng bộ currentPage và pageSize với filters
    setCurrentPage(filters.page);
    if (filters.perPage !== pageSize) {
      setPageSize(filters.perPage);
    }
  }, [filters.page, filters.perPage, pageSize]);

  useEffect(() => {
    fetchAllShop();
  }, [fetchAllShop]);

  useEffect(() => {
    fetchAllSellersMemo();
  }, [fetchAllSellersMemo]);

  useEffect(() => {
    fetchAllQC(filters);
    fetchCountStatus();
  }, [filters, fetchAllQC, fetchCountStatus]);

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 240;
      const marginBottom = 20;
      setTableHeight(window.innerHeight - headerHeight - marginBottom);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isShowRowkeys) setExpandedRowKeys(dataSource.map((item) => item.orderId));
  }, [dataSource, isShowRowkeys]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            QC Fulfillment
          </h1>
          <div className="flex justify-center items-center">
            <DateRangePicker
              mode="range"
              showOutsideDays
              modifiersClassNames={{ selected: 'my-selected', range_middle: 'my-range-middle' }}
              modifiersStyles={{ range_middle: { backgroundColor: '#f3f4f6', fontWeight: 'normal' } }}
              updateFilter={updateFilter}
            />
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
            <div className="w-[270px] flex-none">
            <Input
              onChange={handleSearch}
              placeholder="Search text..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full"
            />
            </div>
              <SelectSeller
                title="Seller"
                ListData={sellers}
                value={selectSeller}
                onChange={(val) => {
                  setSelectSeller(val || undefined);
                  updateFilter({ sellerId: val || '', page: 1 });
                }}
              />
              <SelectFilter
                title="Shop"
                ListData={shops.map((item) => item.name).filter(Boolean)}
                value={selectShop}
                onChange={(val) => {
                  setSelectShop(val || '');
                  updateFilter({ shopName: val || '', page: 1 });
                }}
              />
              <Tooltip title="Refresh">
                <button
                  className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                  onClick={() => {
                    fetchAllQC(filters);
                    fetchCountStatus();
                    toast.success('Refresh success!');
                  }}
                >
                  <MdOutlineRefresh size={20} />
                </button>
              </Tooltip>

              <Tooltip title="Export Excel">
                <Button
                  type="primary"
                  onClick={handleExportExcel}
                  disabled={selectedRowKeys.length === 0}
                  style={{
                    backgroundColor: selectedRowKeys.length > 0 ? '#52c41a' : undefined,
                    borderColor: selectedRowKeys.length > 0 ? '#52c41a' : undefined,
                  }}
                >
                  Export Excel ({selectedRowKeys.length})
                </Button>
              </Tooltip>

              {isFailedFilter && (
                <Tooltip title="Send selected orders to fulfillment">
                  <Button
                    type="primary"
                    danger
                    icon={<MdOutlineSend />}
                    onClick={handleSendSelectedToFulfillment}
                    loading={sendingToFulfillment}
                    disabled={selectedRowKeys.length === 0 || sendingToFulfillment}
                  >
                    Send Fulfillment ({selectedRowKeys.length})
                  </Button>
                </Tooltip>
              )}

              <Tooltip
                title={
                  isFailedFilter
                    ? 'Push selected failed orders to Fulfillment Platform v2 and update Portal status'
                    : 'Switch to Failed filter to push orders to Fulfillment Platform v2'
                }
              >
                <Button
                  type="primary"
                  icon={<MdOutlineSend />}
                  onClick={openPushFulfillmentModal}
                  loading={pushingToFulfillmentPlatform}
                  disabled={!isFailedFilter || selectedRowKeys.length === 0 || pushingToFulfillmentPlatform}
                >
                  Push Fulfillment LNG ({selectedRowKeys.length})
                </Button>
              </Tooltip>
          </div>

          <div className="flex-none">
            <Pagination
              total={totalCount}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS.map((size) => size.toString())}
              showSizeChanger={true}
              current={currentPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>

        <div className="mt-4">
          <Table
            className="no-indent-table table-qc"
            columns={columns}
            dataSource={tableData}
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
              type: 'checkbox',
            }}
            expandable={{
              indentSize: 0,
              expandedRowRender,
              expandIcon: ({ expanded, onExpand, record }) => (
                <div className="flex justify-center items-center h-full w-full cursor-pointer" onClick={(e) => onExpand(record, e)}>
                  {expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
              expandedRowKeys,
              onExpand: handleExpand,
              columnTitle: (
                <div className="flex justify-center items-center h-full w-full cursor-pointer" onClick={handleShowRowKeys}>
                  {isShowRowkeys ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
            }}
            rowKey="key"
            bordered
            pagination={false}
            loading={loading}
            sticky={{ offsetHeader: 0 }}
            scroll={{ y: tableHeight }}
            tableLayout="auto"
          />
        </div>
      </div>

      <Modal
        title="Push failed orders to Fulfillment Platform v2"
        open={openFulfillmentPushModal}
        onCancel={closePushFulfillmentModal}
        onOk={handlePushSelectedToFulfillmentPlatform}
        okText="Push orders"
        cancelText="Close"
        confirmLoading={pushingToFulfillmentPlatform}
        okButtonProps={{
          disabled: selectedOrdersForFulfillment.length === 0,
        }}
        destroyOnHidden
      >
        <Flex vertical gap={12}>
          <Alert
            type="warning"
            showIcon
            message="Portal backend will push these failed orders to Fulfillment Platform v2 and update Portal order status like the existing fulfillment flow."
          />

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <div className="font-medium text-slate-900">Selected payload</div>
            <div className="mt-1">Source channel: AMAZON</div>
            <div>Orders: {selectedOrdersForFulfillment.length}</div>
            <div>Items: {selectedFulfillmentItemCount}</div>
            {selectedOrdersForFulfillment.length > 0 && (
              <div className="mt-1 truncate">First order: {selectedOrdersForFulfillment[0]?.orderId}</div>
            )}
          </div>

          {fulfillmentPushResult && (
            <Alert
              type={fulfillmentPushResult.errorsCount > 0 ? 'warning' : 'success'}
              showIcon
              message={`Received: ${fulfillmentPushResult.received}, inserted: ${fulfillmentPushResult.inserted}, updated: ${fulfillmentPushResult.updated}, skipped: ${fulfillmentPushResult.skipped}, errors: ${fulfillmentPushResult.errorsCount}`}
            />
          )}
        </Flex>
      </Modal>

      <QcCanvasModal
        open={openModalQC}
        onClose={() => setOpenMOdalQC(false)}
        orderInfo={dataView}
        fetchAllQC={fetchAllQC}
        filters={filters}
        fetchCountStatus={fetchCountStatus}
        logicalWidth={4200}
        logicalHeight={4800}
        viewportWidth={1000}
        viewportHeight={750}
        indexQC={indexQC}
        onNextAfter={goNextAfter}
      />
    </div>
  );
};

export default React.memo(QC);
