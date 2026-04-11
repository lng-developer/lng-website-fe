import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Flex, Input, Pagination, Table, Tooltip, Button } from 'antd';
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
import { getAllCountStatusQC, getAllQC, getALlShop, retryScaleOrder } from '../../apis/order';
import { toast } from 'sonner';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import DateRangePicker from '../../components/DateRangePicker';
import { handleColorStatus, handleColorStatusScale } from '../../utils/handleColor';
import ItemProductInfoQC from './ItemProductInfoQC';
import { debounce } from 'lodash';
import { FcApproval } from 'react-icons/fc';
import { IoArrowUndo } from 'react-icons/io5';
import { getAllSellers } from '../../apis/user';
import { MdOutlineRefresh } from 'react-icons/md';
import SelectSeller from '../../components/SelectSeller';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const PAGE_SIZE = 10;

const QC = () => {
  const { collapsed } = useOutletContext();

  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
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
    perPage: PAGE_SIZE,
    scale_status: '',
    from: defaultFrom,
    to: defaultTo,
    search: '',
    sellerId: '',
    shopName: '',
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const updateFilter = useCallback((newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      // Nếu newValues có page thì dùng page đó, nếu không thì giữ nguyên page hiện tại
      page: Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : prev.page,
    }));
  }, []);

  const handlePageChange = useCallback(
    (page, pageSize) => {
      updateFilter({ page, perPage: pageSize });
      setCurrentPage(page);
    },
    [updateFilter]
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
        isActiveFilter.title === 'Failed' && {
          title: <span style={{ color: dataColors.title }}>Retry</span>,
          dataIndex: 'action_retry',
          key: 'action_retry',
          align: 'center',
        },
      ].filter(Boolean),
    [isActiveFilter.title]
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
      const selectedOrders = dataSource.filter(order => selectedRowKeys.includes(order.orderId));
      
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
        { header: 'Design', key: 'design', width: 50 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Full Name (Shipping)', key: 'fullName', width: 25 },
        { header: 'Address 1 (Shipping)', key: 'address1', width: 30 },
        { header: 'Address 2 (Shipping)', key: 'address2', width: 30 },
        { header: 'City (Shipping)', key: 'city', width: 20 },
        { header: 'Postcode (Shipping)', key: 'postcode', width: 15 },
        { header: 'State Name (Shipping)', key: 'state', width: 20 }
      ];
      
      // Add data rows
      selectedOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            // Get fulfillment file URLs
            const designUrls = [];
            if (item.fulfillment_file && typeof item.fulfillment_file === 'object') {
              Object.values(item.fulfillment_file).forEach(url => {
                if (url && typeof url === 'string') {
                  designUrls.push(url);
                }
              });
            }
            
            const rowData = {
              orderId: order.orderId || '',
              mockUp: item.baseImageUrl || '',
              design: designUrls.join(', '),
              quantity: item.quantity || 0,
              fullName: order.customer_infor?.name || '',
              address1: order.customer_infor?.address || '',
              address2: order.customer_infor?.address_2 || '',
              city: order.customer_infor?.city || '',
              postcode: order.customer_infor?.zip_code || '',
              state: order.customer_infor?.state || ''
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
        fgColor: { argb: 'FFE6F3FF' }
      };
      
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
      action_retry:
        isActiveFilter.title === 'Failed' ? (
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
  }, [dataSource, handleCopy]);

  // =============== EFFECTS ===============
  useEffect(() => {
    // Đồng bộ currentPage với filters.page
    setCurrentPage(filters.page);
  }, [filters.page]);

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
                  updateFilter({ sellerId: val, page: 1 });
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
                    borderColor: selectedRowKeys.length > 0 ? '#52c41a' : undefined
                  }}
                >
                  Export Excel ({selectedRowKeys.length})
                </Button>
              </Tooltip>
            </div>
          </div>

          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={PAGE_SIZE}
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
