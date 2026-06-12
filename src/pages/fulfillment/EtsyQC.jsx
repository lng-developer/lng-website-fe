import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Flex, Input, Modal, Pagination, Table, Tooltip } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { debounce } from 'lodash';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDistanceToNow } from 'date-fns';
import { FcApproval } from 'react-icons/fc';
import { IoArrowUndo } from 'react-icons/io5';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { MdOutlineImageSearch, MdOutlineRefresh, MdOutlineSend } from 'react-icons/md';
import ButtonFilter from '../../components/ButtonFilter';
import DateRangePicker from '../../components/DateRangePicker';
import SelectFilter from '../../components/SelectFilter';
import SelectSeller from '../../components/SelectSeller';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { handleColorStatus, handleColorStatusScale } from '../../utils/handleColor';
import { getALlShop } from '../../apis/order';
import { getAllSellers } from '../../apis/user';
import { confirmEtsyScaleForItem, getAllEtsyQC, getAllEtsyQCStatistics, pushSelectedEtsyOrdersToFulfillmentPlatform } from '../../apis/etsy';
import QcCanvasModal from './ModalQC';
import ItemProductInfoEtsyQC from './ItemProductInfoEtsyQC';
import { toast } from 'sonner';
import { getCustomizationExportValue, getDesignExportValues } from './exportHelpers';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

const etsyQcFilterTabs = [
  { key: 'All', title: 'All', status: 'All' },
  { key: 'Pending', title: 'Pending', status: 'Pending' },
  { key: 'Ready', title: 'Ready', status: 'Ready' },
  { key: 'Sent', title: 'Completed', status: 'Sent' },
  { key: 'QC Rejected', title: 'QC Rejected', status: 'QC Rejected' },
  { key: 'Address Invalid', title: 'Address Invalid', status: 'Address Invalid' },
];

const getEtsyItemId = (item) => item?.transactionId || item?.orderItemId;

const getEtsyCustomItems = (item) => {
  if (Array.isArray(item?.version3Data)) return item.version3Data;
  if (item?.variations && typeof item.variations === 'object') {
    return Object.entries(item.variations).map(([label, value]) => ({ label, value }));
  }
  return [];
};

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const findCustomizationValue = (item, keywords = []) => {
  const normalizedKeywords = keywords.map(normalizeText);
  return (
    getEtsyCustomItems(item).find((customItem) => {
      const label = normalizeText(customItem?.label);
      return normalizedKeywords.some((keyword) => label.includes(keyword));
    })?.value || ''
  );
};

const getWorkshopProductType = (item) => {
  const costCenter = item?.cost_center || {};
  const displayName = costCenter?.productType || costCenter?.product_type || costCenter?.vendorProductDisplayName || '';
  return String(displayName).replace(/^\s*.*?\s*[-–—]\s+/, '').trim();
};

const getWorkshopSize = (item) => item?.cost_center?.sizeValue || findCustomizationValue(item, ['size', 'kich co', 'kích cỡ']);

const getWorkshopColor = (item) => item?.cost_center?.colorValue || findCustomizationValue(item, ['color', 'colour', 'mau', 'màu']);

const getWorkshopEmbroideryPosition = (item, designValues) => {
  const explicitPosition = findCustomizationValue(item, ['vi tri theu', 'vị trí thêu', 'embroidery position', 'position']);
  if (explicitPosition) return explicitPosition;

  const positions = [];
  if (designValues.designFront) positions.push('Front');
  if (designValues.designLeft || designValues.designRight) positions.push('Sleeve');
  return positions.join(', ');
};

const renderDate = (dateValue) => {
  if (!dateValue) {
    return <StatusComponent title="No data" color={dataColors.default} isDefault />;
  }

  return (
    <Flex vertical>
      <span className="font-medium whitespace-nowrap">{formatDate(dateValue)}</span>
      <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
        (
        {formatDistanceToNow(dateValue, { addSuffix: true })
          .replace(/^about /, '')
          .replace(/^less than /, '')}
        )
      </span>
    </Flex>
  );
};

const EtsyQC = () => {
  const { collapsed } = useOutletContext();
  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isActiveFilter, setIsActivefilter] = useState(etsyQcFilterTabs[0]);
  const [tabFilter, setTabFilter] = useState(etsyQcFilterTabs);
  const [openModalQC, setOpenModalQC] = useState(false);
  const [dataView, setDataView] = useState({});
  const [indexQC, setIndexQC] = useState(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [tableHeight, setTableHeight] = useState(0);
  const [sellers, setSellers] = useState([]);
  const [selectSeller, setSelectSeller] = useState();
  const [shops, setShops] = useState([]);
  const [selectShop, setSelectShop] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pushingToFulfillmentPlatform, setPushingToFulfillmentPlatform] = useState(false);
  const [openFulfillmentPushModal, setOpenFulfillmentPushModal] = useState(false);
  const [fulfillmentPushResult, setFulfillmentPushResult] = useState(null);
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
  const isPushableFilter = isActiveFilter?.status === 'Ready' || isActiveFilter?.status === 'Failed';

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
    () => [
      { title: <span style={{ color: dataColors.title }}>Order ID</span>, dataIndex: 'orderId', key: 'orderId', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Status QC</span>, dataIndex: 'scale_overall_status', key: 'scale_overall_status', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Created</span>, dataIndex: 'createdAt', key: 'createdAt', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Order Date</span>, dataIndex: 'purchase_date', key: 'purchase_date', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Status Order</span>, dataIndex: 'status', key: 'status', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Shipping Type</span>, dataIndex: 'shipping_type', key: 'shipping_type', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Shop</span>, dataIndex: 'shopName', key: 'shopName', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Scale By</span>, dataIndex: 'scale_by', key: 'scale_by', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>QC By</span>, dataIndex: 'qc_by', key: 'qc_by', align: 'center' },
    ],
    []
  );

  const subColumns = useMemo(
    () => [
      { title: <span style={{ color: dataColors.title }}>Product Info</span>, dataIndex: 'product_info', key: 'product_info', align: 'left' },
      { title: <span style={{ color: dataColors.title }}>Scale Status</span>, dataIndex: 'scale_status', key: 'scale_status', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Order Owner</span>, dataIndex: 'seller', key: 'seller', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Fulfill Name</span>, dataIndex: 'fulfill_name', key: 'fulfill_name', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Customization</span>, dataIndex: 'customization', key: 'customization', align: 'left' },
      { title: <span style={{ color: dataColors.title }}>Vendor Product</span>, dataIndex: 'cost_center', key: 'cost_center', align: 'center' },
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

  const fetchAllQC = useCallback(async (params) => {
    setLoading(true);
    try {
      const response = await getAllEtsyQC(params);
      if (response.status === 200) {
        setDataSource(response.data?.data || []);
        setTotalCount(response.data?.totalCount || 0);
      } else {
        toast.error(response.data?.message || 'Failed to fetch Etsy QC');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch Etsy QC');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCountStatus = useCallback(async () => {
    try {
      const response = await getAllEtsyQCStatistics(filters);
      if (response.status === 200) {
        setTabFilter(
          etsyQcFilterTabs.map(({ key, title, status }) => ({
            key,
            title,
            status,
            count: response.data?.overall?.counts?.[key] ?? 0,
          }))
        );
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
        setSellers(
          (res.data || []).map((item) => ({
            label: item?.full_name,
            value: item?._id,
          }))
        );
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch sellers');
    }
  }, []);

  const fetchAllShop = useCallback(async () => {
    try {
      const result = await getALlShop({ merchant: 'etsy' });
      if (result.status === 200) {
        setShops(Array.isArray(result.data) ? result.data : result.data?.data || []);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

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

  const handleExportExcel = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      toast.error('Please select orders to export');
      return;
    }

    try {
      const selectedOrders = dataSource.filter((order) => selectedRowKeys.includes(order.orderId));
      if (selectedOrders.length === 0) {
        toast.error('No matching orders found for export');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Etsy Workshop Export');
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 20 },
        { header: 'Link ảnh Mockup', key: 'mockUp', width: 55 },
        { header: 'Design front', key: 'designFront', width: 55 },
        { header: 'Design Sleeve', key: 'designSleeve', width: 55 },
        { header: 'Loại áo', key: 'productType', width: 32 },
        { header: 'Size', key: 'size', width: 14 },
        { header: 'Màu áo', key: 'color', width: 18 },
        { header: 'Vị trí thêu', key: 'embroideryPosition', width: 22 },
        { header: 'Số lượng', key: 'quantity', width: 12 },
        { header: 'Customization', key: 'customization', width: 60 },
      ];

      selectedOrders.forEach((order) => {
        (order.items || []).forEach((item) => {
          const designValues = getDesignExportValues(item.fulfillment_file);
          worksheet.addRow({
            orderId: order.orderId || '',
            mockUp: item.baseImageUrl || item.baseImage?.imageUrl || '',
            designFront: designValues.designFront || '',
            designSleeve: [designValues.designLeft, designValues.designRight].filter(Boolean).join('\n'),
            productType: getWorkshopProductType(item),
            size: getWorkshopSize(item),
            color: getWorkshopColor(item),
            embroideryPosition: getWorkshopEmbroideryPosition(item, designValues),
            quantity: item.quantity || 0,
            customization: getCustomizationExportValue(item),
          });
        });
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' },
      };
      ['mockUp', 'designFront', 'designSleeve', 'productType', 'embroideryPosition', 'customization'].forEach((key) => {
        worksheet.getColumn(key).alignment = { wrapText: true, vertical: 'top' };
      });

      const now = new Date();
      const filename = `Etsy_Workshop_Export_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);
      toast.success(`Exported ${selectedOrders.length} Etsy orders for workshop`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel file');
    }
  }, [selectedRowKeys, dataSource]);

  const openPushFulfillmentModal = useCallback(() => {
    if (!isPushableFilter) {
      toast.error('Please switch to Ready filter before pushing Etsy orders to Fulfillment Platform v2');
      return;
    }

    if (selectedRowKeys.length === 0) {
      toast.error('Please select Etsy orders to push');
      return;
    }

    if (selectedOrdersForFulfillment.length === 0) {
      toast.error('No matching Etsy orders found to push');
      return;
    }

    setFulfillmentPushResult(null);
    setOpenFulfillmentPushModal(true);
  }, [isPushableFilter, selectedOrdersForFulfillment.length, selectedRowKeys.length]);

  const closePushFulfillmentModal = useCallback(() => {
    setOpenFulfillmentPushModal(false);
    setFulfillmentPushResult(null);
  }, []);

  const handlePushSelectedToFulfillmentPlatform = useCallback(async () => {
    if (selectedOrdersForFulfillment.length === 0) {
      toast.error('No matching Etsy orders found to push');
      return;
    }

    setPushingToFulfillmentPlatform(true);

    try {
      const response = await pushSelectedEtsyOrdersToFulfillmentPlatform({
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
          `Pushed ${selectedOrdersForFulfillment.length} Etsy orders to FFv2. Inserted: ${inserted}, skipped: ${skipped}, errors: ${errorsCount}`
        );
        setSelectedRowKeys([]);
        fetchAllQC(filters);
        fetchCountStatus();
      } else {
        toast.error(response.data?.message || 'Failed to push Etsy orders to Fulfillment Platform');
      }
    } catch (error) {
      console.error('Push Etsy Fulfillment Platform test error:', error);
      toast.error(error?.response?.data?.message || 'Failed to push Etsy orders to Fulfillment Platform');
    } finally {
      setPushingToFulfillmentPlatform(false);
    }
  }, [fetchAllQC, fetchCountStatus, filters, selectedOrdersForFulfillment]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const qcQueue = useMemo(() => {
    const queue = [];
    (dataSource || []).forEach((order, orderIndex) => {
      (order?.items || []).forEach((it, itemIndex) => {
        if (String(it?.scale_status || '').toLowerCase() === 'pending') {
          queue.push({
            orderIndex,
            itemIndex,
            orderId: order?.orderId,
            orderItemId: getEtsyItemId(it),
          });
        }
      });
    });
    return queue;
  }, [dataSource]);

  const goNextAfter = useCallback(
    (currentOrderId, currentOrderItemId) => {
      if (!qcQueue.length) {
        setOpenModalQC(false);
        return;
      }

      const idx = qcQueue.findIndex((x) => x.orderId === currentOrderId && x.orderItemId === currentOrderItemId);
      const next = idx >= 0 ? qcQueue[idx + 1] : qcQueue[0];
      if (!next) {
        setOpenModalQC(false);
        return;
      }

      const nextOrder = dataSource?.[next.orderIndex];
      if (!nextOrder) {
        setOpenModalQC(false);
        return;
      }

      setDataView(nextOrder);
      setIndexQC(next.itemIndex);
      setOpenModalQC(true);
    },
    [qcQueue, dataSource]
  );

  const tableData = useMemo(() => {
    return (dataSource || []).map((item) => ({
      key: item?.orderId,
      orderId: (
        <button className="cursor-pointer" onClick={() => handleCopy(item?.orderId)}>
          <StatusComponent title={item?.orderId} color={dataColors.default} isDefault />
        </button>
      ),
      status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
      scale_overall_status: <StatusComponent title={item?.scale_overall_status} color={handleColorStatusScale(item?.scale_overall_status)} />,
      createdAt: renderDate(item?.createdAt),
      purchase_date: renderDate(item?.purchase_date || item?.saleDate || item?.createdAt),
      scale_by: <StatusComponent title={item?.scaledBy?.full_name || item?.scaleBy?.full_name || item?.scaleBy || 'No data'} color={dataColors.process} />,
      shipping_type: <StatusComponent title={item?.shipping_type || 'No data'} color={dataColors.asin} />,
      shopName: <StatusComponent title={item?.shopName || 'No data'} color={dataColors.pending} />,
      qc_by: <StatusComponent title={item?.cs_assignee?.full_name || item?.qcBy?.full_name || 'No data'} color={dataColors.purple} />,
      subItems: (item?.items || []).map((itemSub, indexItem) => {
        const itemId = getEtsyItemId(itemSub);
        const customItems = getEtsyCustomItems(itemSub);
        return {
          key: `${item?.orderId}-${itemId || indexItem}`,
          product_info: (
            <ItemProductInfoEtsyQC
              link={itemSub?.baseImageUrl || itemSub?.baseImage?.imageUrl}
              title={itemSub?.title || itemSub?.itemName}
              listingId={itemSub?.listingId}
              sku={itemSub?.sku}
              quantity={itemSub?.quantity}
            />
          ),
          scale_status: <StatusComponent title={itemSub?.scale_status} color={handleColorStatusScale(itemSub?.scale_status)} />,
          seller: <StatusComponent title={item?.seller?.full_name || item?.seller?.sellerCode || 'No data'} color={dataColors.process} />,
          fulfill_name: (
            <div
              style={{ borderColor: dataColors.default, backgroundColor: `${dataColors.default}10` }}
              className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground"
            >
              <span>{`${item?.orderId}-${itemId}`}</span>
            </div>
          ),
          customization: (
            <div className="text-left">
              {customItems.map((customItem, idx) => (
                <div key={idx} className="mb-1 max-w-[260px] whitespace-normal break-words">
                  <span className="font-medium">{customItem?.label}:</span>
                  <span className="text-[#64748B] ml-2">{customItem?.value || <span className="text-red-500">x</span>}</span>
                </div>
              ))}
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
                      setDataView(item);
                      setIndexQC(indexItem);
                      setOpenModalQC(true);
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
        };
      }),
    }));
  }, [dataSource, handleCopy]);

  useEffect(() => {
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
            Etsy QC
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

        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <Input
              onChange={handleSearch}
              placeholder="Search..."
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center">
              <SelectSeller
                title="Seller"
                ListData={sellers}
                value={selectSeller}
                onChange={(val) => {
                  setSelectSeller(val);
                  updateFilter({ sellerId: val || '', page: 1 });
                }}
              />
              <SelectFilter
                title="Shop"
                ListData={shops.map((item) => item?.name).filter(Boolean)}
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
              <Tooltip title={isPushableFilter ? 'Push selected Etsy orders to Fulfillment Platform v2 and update Portal status' : 'Switch to Ready filter to push Etsy orders to Fulfillment Platform v2'}>
                <Button
                  type="primary"
                  icon={<MdOutlineSend />}
                  onClick={openPushFulfillmentModal}
                  loading={pushingToFulfillmentPlatform}
                  disabled={!isPushableFilter || selectedRowKeys.length === 0 || pushingToFulfillmentPlatform}
                >
                  Push Platform Test ({selectedRowKeys.length})
                </Button>
              </Tooltip>
            </div>
          </div>

          <div>
            <Pagination
              total={totalCount}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS.map((size) => size.toString())}
              showSizeChanger
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
        title="Push Etsy orders to Fulfillment Platform v2"
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
            message="Portal backend will push these Etsy orders to Fulfillment Platform v2 and update Portal order status like the existing fulfillment flow."
          />

          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <div className="font-medium text-slate-900">Selected payload</div>
            <div className="mt-1">Source channel: ETSY</div>
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
        onClose={() => setOpenModalQC(false)}
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
        confirmHandler={confirmEtsyScaleForItem}
        getItemId={getEtsyItemId}
        platform="etsy"
      />
    </div>
  );
};

export default React.memo(EtsyQC);
