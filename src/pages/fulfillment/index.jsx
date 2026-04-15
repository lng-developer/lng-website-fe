import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dataFilterStatusFulfillment } from '../../utils/dataFilter';
import ButtonFilter from '../../components/ButtonFilter';
import { dataColors } from '../../utils/dataColors';
import { Flex, Input, Pagination, Select, Table, Tooltip } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { MdOutlineRefresh } from 'react-icons/md';
import StatusComponent from '../../components/StatusComponent';
import ItemProductInfo from './table/ItemProductInfo';
import ItemCustom from './table/ItemCustom';
import ItemCostCenter from './table/ItemCostCenter';
import ItemOrderInfo from './table/ItemOrderInfo';
import TextArea from 'antd/es/input/TextArea';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { formatDistanceToNow } from 'date-fns';
import { assignOrderToCs, getAllCountStatusScale, getAllFulfillScale, getALlShop } from '../../apis/order';
import DynamicImageUpload from '../../components/DynamicImageUpload';
import { handleColorStatus, handleColorStatusScale } from '../../utils/handleColor';
import DateRangePicker from '../../components/DateRangePicker';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import dayjs from 'dayjs';
import { getAllUsers } from '../../apis/user';
import { useAuth } from '../../context/AuthContext';
const LAST_UPDATED_KEY = 'orders_fulfill_last_updated_at';
const PAGE_SIZE = 10;
const fulfillmentFilterTabs = [
  dataFilterStatusFulfillment[0],
  {
    key: 'CSUnassigned',
    title: 'CSUnassigned',
    status: 'CSUnassigned',
  },
  ...dataFilterStatusFulfillment.slice(1),
];

const FulfillmentScale = () => {
  const { user } = useAuth();
  const { collapsed } = useOutletContext();
  const [isActiveFilter, setIsActivefilter] = useState(fulfillmentFilterTabs[0]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableHeight, setTableHeight] = useState(0);
  const [tabFilter, setTabFilter] = useState(fulfillmentFilterTabs);
  const [shops, setShops] = useState([]);
  const [csUsers, setCsUsers] = useState([]);
  const [selectShop, setSelectShop] = useState('');
  const [assigningOrderId, setAssigningOrderId] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => {
    const saved = localStorage.getItem(LAST_UPDATED_KEY);
    return saved ? new Date(saved) : null;
  });
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    scale_status: '',
    unassigned: false,
    from: defaultFrom,
    to: defaultTo,
    search: '',
    shopName: '',
  });
  const canAssignCs = user?.role === 'Admin' || user?.role === 'Design Leader';

  const updateLastUpdatedAt = useCallback(() => {
    const now = new Date();
    setLastUpdatedAt(now);
    localStorage.setItem(LAST_UPDATED_KEY, now.toISOString());
  }, []);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdatedAt) return 'Last updated: —';
    return `Last updated at ${dayjs(lastUpdatedAt).format('HH:mm')}`;
  }, [lastUpdatedAt]);

  const getAssignErrorMessage = useCallback((error) => {
    const responseData = error?.response?.data;

    if (responseData?.message === 'Selected user is not Customer Service') {
      const roleName = responseData?.debug?.role_name;
      return roleName ? `${responseData.message} (${roleName})` : responseData.message;
    }

    return responseData?.message || 'Assign CS failed';
  }, []);

  // ====== Callbacks & Memos ======
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

  const handleExpand = useCallback((expanded, record) => {
    setExpandedRowKeys((prev) => (expanded ? [...prev, record.key] : prev.filter((key) => key !== record.key)));
  }, []);

  const handleShowRowKeys = useCallback(() => {
    setExpandedRowKeys(() => (isShowRowkeys ? [] : dataSource.map((item) => item.orderId)));
    setIsShowRowKeys((prev) => !prev);
  }, [isShowRowkeys, dataSource]);

  const columns = useMemo(
    () => [
      { title: <span style={{ color: dataColors.title }}>Order ID</span>, dataIndex: 'orderId', key: 'orderId', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Order Date</span>, dataIndex: 'orderDate', key: 'orderDate', align: 'center' },
      {
        title: <span style={{ color: dataColors.title }}>Scale Status</span>,
        dataIndex: 'scaleStatus',
        key: 'scaleStatus',
        align: 'center',
      },
      { title: <span style={{ color: dataColors.title }}>Group ID</span>, dataIndex: 'groupId', key: 'groupId', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Group Type</span>, dataIndex: 'groupType', key: 'groupType', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Shop</span>, dataIndex: 'shopName', key: 'shopName', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Order Status</span>, dataIndex: 'status', key: 'status', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Order Owner</span>, dataIndex: 'orderOwner', key: 'orderOwner', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>QC By</span>, dataIndex: 'scaleBy', key: 'scaleBy', align: 'center' },
      {
        title: <span style={{ color: dataColors.title }}>Assign CS</span>,
        dataIndex: 'assignCS',
        key: 'assignCS',
        align: 'center',
        width: 260,
      },
      { title: <span style={{ color: dataColors.title }}>CS Status</span>, dataIndex: 'actions', key: 'actions', align: 'center' },
    ],
    []
  );

  const convertToArr = useCallback((object) => {
    return Object?.entries(typeof object === 'object' ? object : {}).map(([key, url]) => ({
      position: key,
      url,
    }));
  }, []);

  // --- fetchers ---
  const fetchAllFulfill = useCallback(
    async (params) => {
      setLoading(true);
      try {
        const response = await getAllFulfillScale(params);
        if (response.status === 200) {
          setDataSource(response.data?.data);
          setTotalCount(response.data?.totalCount);
        } else {
          toast.error(response.data?.message);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message);
      } finally {
        setLoading(false);
        updateLastUpdatedAt();
      }
    },
    [updateLastUpdatedAt]
  );

  const fetchCountStatus = useCallback(async () => {
    try {
      const response = await getAllCountStatusScale(filters);
      if (response.status === 200) {
        const resultTabFilter = fulfillmentFilterTabs.map(({ key, title, status }) => ({
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

  const handleAssignCs = useCallback(
    async (order, csUserId) => {
      if (!canAssignCs) {
        toast.error('Access denied: insufficient permissions');
        return;
      }

      if (!order?.orderId) {
        toast.error('Order not found');
        return;
      }

      if (!csUserId) {
        toast.error('Please select a CS user');
        return;
      }

      const currentCsUserId = order?.cs_assignee?._id || order?.csAssigneeId;
      if (currentCsUserId === csUserId) {
        return;
      }

      setAssigningOrderId(order.orderId);
      try {
        const response = await assignOrderToCs(order.orderId, { csUserId });

        if (response.status === 200) {
          toast.success(response.data?.message || 'Assigned order to CS successfully');
          fetchAllFulfill(filters);
          fetchCountStatus();
        } else {
          toast.error(response.data?.message || 'Assign CS failed');
        }
      } catch (error) {
        toast.error(getAssignErrorMessage(error));
      } finally {
        setAssigningOrderId('');
      }
    },
    [canAssignCs, fetchAllFulfill, fetchCountStatus, filters, getAssignErrorMessage]
  );

  const handleFilterForStatus = useCallback(
    (status) => {
      if (status === 'All') {
        updateFilter({ scale_status: '', unassigned: false, page: 1 });
        return;
      }

      if (status === 'CSUnassigned') {
        updateFilter({ scale_status: '', unassigned: true, page: 1 });
        return;
      }

      updateFilter({ scale_status: status, unassigned: false, page: 1 });
    },
    [updateFilter]
  );

  const fetchAllShop = useCallback(async () => {
    try {
      const result = await getALlShop();
      if (result.status === 200) {
        setShops(result.data);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchCsUsers = useCallback(async () => {
    try {
      const result = await getAllUsers({ all: true, perPage: 1000 });
      const users = Array.isArray(result.data) ? result.data : result.data?.data || [];
      const filteredCsUsers = users.filter((item) => {
        const roleName = item?.role_name || item?.role_id?.name || item?.role?.name;
        return roleName === 'Customer Service';
      });

      setCsUsers(filteredCsUsers);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load CS users');
    }
  }, []);

  // --- debounce search ---
  const debouncedSearch = useMemo(
    () =>
      debounce((keyword) => {
        updateFilter({ search: keyword || '', page: 1 });
      }, 300),
    [updateFilter]
  );

  const handleSearch = useCallback(
    (e) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  useEffect(() => {
    // cleanup tránh memory leak
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // --- sub table columns (memo để không khởi tạo lại) ---
  const subColumns = useMemo(
    () => [
      { title: <span style={{ color: dataColors.title }}>Product Info</span>, dataIndex: 'product_info', key: 'product_info', width: 220 },
      { title: <span style={{ color: dataColors.title }}>Customization</span>, dataIndex: 'customization', key: 'customization' },
      { title: <span style={{ color: dataColors.title }}>Task Status</span>, dataIndex: 'task_status', key: 'task_status' },
      { title: <span style={{ color: dataColors.title }}>Cost Center</span>, dataIndex: 'cost_center', key: 'cost_center', width: 220 },
      { title: <span style={{ color: dataColors.title }}>CS Note</span>, dataIndex: 'cs_note', key: 'cs_note' },
      { title: <span style={{ color: dataColors.title }}>Action</span>, dataIndex: 'action', key: 'action' },
      { title: <span style={{ color: dataColors.title }}>Order Info</span>, dataIndex: 'order_info', key: 'order_info' },
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

  const handleCopy = useCallback(async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy!');
    }
  }, []);

  // --- table data (memo hóa nặng nhất) ---
  const tableData = useMemo(() => {
    const results = (dataSource || []).map((item, index) => ({
      key: item?.orderId,
      orderId: (
        <button className="cursor-pointer" onClick={() => handleCopy(item?.orderId)}>
          <StatusComponent title={item?.orderId} color={dataColors.pink} />
        </button>
      ),
      orderDate: (
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
      groupId: <StatusComponent title={item?.groupId || 'No data'} color={dataColors.default} isDefault />,
      groupType: <StatusComponent title={item?.groupType || 'No data'} color={dataColors.process} />,
      shopName: <StatusComponent title={item?.shopName || 'No data'} color={dataColors.pending} />,
      status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
      orderOwner: <StatusComponent title={item?.seller?.full_name || 'No data'} color={dataColors.process} />,
      scaleBy: <StatusComponent title={item?.scaleBy || 'Đặng Thành Trung CS'} color={dataColors.purple} />,
      scaleStatus: <StatusComponent title={item?.scale_overall_status} color={handleColorStatusScale(item?.scale_overall_status)} />,
      assignCS: (
        <Select
          className="min-w-[220px] text-left"
          placeholder="Select customer service"
          value={item?.cs_assignee?._id || item?.csAssigneeId}
          onChange={(value) => handleAssignCs(item, value)}
          options={csUsers.map((userItem) => ({
            value: userItem?._id,
            label: `${userItem?.full_name || userItem?.email || 'Unknown'} - ${userItem?.email || 'No email'}`,
          }))}
          showSearch
          optionFilterProp="label"
          loading={assigningOrderId === item?.orderId}
          disabled={!canAssignCs || assigningOrderId === item?.orderId}
        />
      ),
      actions: (
        <Flex vertical align="center" gap={6}>
          <StatusComponent
            title={item?.cs_assignee?.full_name || item?.cs_assignment_status || 'Unassigned'}
            color={item?.cs_assignee?.full_name ? dataColors.process : dataColors.default}
            isDefault={!item?.cs_assignee?.full_name}
          />
          {/* <StatusComponent
            title={item?.cs_assignment_status || 'Unassigned'}
            color={item?.cs_assignment_status === 'Assigned' ? dataColors.process : dataColors.default}
            isDefault={item?.cs_assignment_status !== 'Assigned'}
          /> */}
        </Flex>
      ),
      subItems: (item?.items || []).map((itemSub, indexItem) => ({
        key: `${index}-${indexItem}`,
        product_info: (
          <ItemProductInfo
            listing={itemSub?.listing}
            imageUrl={itemSub?.baseImageUrl}
            asin={itemSub?.asin}
            sku={itemSub?.sku}
            status={item?.status}
          />
        ),
        customization: <ItemCustom items={itemSub?.version3Data} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />,
        task_status: <StatusComponent title={itemSub?.scale_status} color={handleColorStatusScale(itemSub?.scale_status)} />,
        cost_center: <ItemCostCenter cost_center={itemSub?.cost_center} />,
        cs_note: (
          <div className="mb-1 w-45">
            <div className="font-semibold text-gray-800 mb-1">CS note: </div>
            <TextArea
              value={itemSub?.tracking_info?.note}
              placeholder="CS note"
              spellCheck={false}
              style={{ color: dataColors.cancelled, fontWeight: 500 }}
            />
          </div>
        ),
        action: (
          <DynamicImageUpload
            initialKinds={['front']}
            serverItems={convertToArr(itemSub?.fulfillment_file)}
            orderId={item?.orderId}
            orderItemId={itemSub?.orderItemId}
            fetchAllFulfill={fetchAllFulfill}
            filters={filters}
          />
        ),
        order_info: (
          <ItemOrderInfo
            orderId={item?.orderId}
            seller={item?.seller?.full_name}
            fulfillName={`${item?.orderId}-${itemSub?.orderItemId}`}
            quantity={itemSub?.quantity}
          />
        ),
      })),
    }));
    return results;
  }, [assigningOrderId, canAssignCs, csUsers, dataSource, fetchAllFulfill, filters, convertToArr, handleAssignCs, handleCopy]);

  // ====== Effects ======
  useEffect(() => {
    // Đồng bộ currentPage với filters.page
    setCurrentPage(filters.page);
  }, [filters.page]);

  useEffect(() => {
    fetchAllShop();
  }, [fetchAllShop]);

  useEffect(() => {
    if (canAssignCs) {
      fetchCsUsers();
    }
  }, [canAssignCs, fetchCsUsers]);

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 240;
      const marginBottom = 20;
      const availableHeight = window.innerHeight - headerHeight - marginBottom;
      setTableHeight(availableHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAllFulfill(filters);
    fetchCountStatus();
  }, [filters, fetchAllFulfill, fetchCountStatus]);

  useEffect(() => {
    if (isShowRowkeys) {
      setExpandedRowKeys(dataSource.map((item) => item.orderId));
    }
  }, [dataSource, isShowRowkeys]);

  // ====== JSX ======
  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Group Task Scale
            <span className="text-xs ml-5 italic" style={{ color: dataColors.title, fontStyle: 'italic' }}>
              {lastUpdatedText}
            </span>
          </h1>
          <div className="flex justify-center items-center gap-2">
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
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            />
            <div className="flex gap-2 items-center ">
              <SelectFilter
                title="Shop"
                ListData={shops.map((item) => item.name)}
                value={selectShop}
                onChange={(val) => {
                  setSelectShop(val);
                  updateFilter({ shopName: val, page: 1 });
                }}
              />
            </div>
            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => {
                  fetchAllFulfill(filters);
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
            />
          </div>
        </div>

        <div className="mt-4">
          <Table
            className="no-indent-table no-backgroud-title scale"
            columns={columns}
            dataSource={tableData}
            expandable={{
              indentSize: 0,
              expandedRowRender,
              expandIcon: ({ expanded, onExpand, record }) => (
                <div className="flex justify-center items-center h-full w-full cursor-pointer" onClick={(e) => onExpand(record, e)}>
                  {expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
              expandedRowKeys: expandedRowKeys,
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
    </div>
  );
};

export default React.memo(FulfillmentScale);
