import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dataFilterStatusFulfillment } from '../../utils/dataFilter';
import ButtonFilter from '../../components/ButtonFilter';
import { dataColors } from '../../utils/dataColors';
import { Flex, Input, Pagination, Table, Tooltip } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { MdOutlineRefresh } from 'react-icons/md';
import StatusComponent from '../../components/StatusComponent';
import ItemProductInfo from './table/ItemProductInfo';
import ItemCustom from './table/ItemCustom';
import ItemCostCenter from './table/ItemCostCenter';
import ItemOrderInfo from './table/ItemOrderInfo';
import TextArea from 'antd/es/input/TextArea';
import ItemAction from './table/ItemAction';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { formatDistanceToNow } from 'date-fns';
import DynamicImageUpload from '../../components/DynamicImageUpload';
import { handleColorStatus, handleColorStatusScale } from '../../utils/handleColor';
import DateRangePicker from '../../components/DateRangePicker';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import dayjs from 'dayjs';

const LAST_UPDATED_KEY = 'orders_etsy_scale_last_updated_at';
const PAGE_SIZE = 10;

// Fake data generator
const generateFakeData = (count = 20) => {
  const statuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
  const scaleStatuses = ['Not Started', 'In Progress', 'Completed', 'Failed'];
  const shops = ['EtsyShop1', 'EtsyShop2', 'EtsyShop3', 'EtsyShop4'];
  const sellers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];
  const groupTypes = ['Standard', 'Express', 'Premium'];

  return Array.from({ length: count }, (_, i) => ({
    orderId: `ETSY-${1000 + i}`,
    purchase_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    groupId: `GRP-${100 + i}`,
    groupType: groupTypes[Math.floor(Math.random() * groupTypes.length)],
    shopName: shops[Math.floor(Math.random() * shops.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    scale_overall_status: scaleStatuses[Math.floor(Math.random() * scaleStatuses.length)],
    seller: {
      full_name: sellers[Math.floor(Math.random() * sellers.length)],
    },
    scaleBy: sellers[Math.floor(Math.random() * sellers.length)],
    items: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
      orderItemId: `ITEM-${i}-${j}`,
      listing: `Etsy Product ${i}-${j}`,
      baseImageUrl: 'https://via.placeholder.com/150',
      asin: `ASIN${1000 + i}${j}`,
      sku: `SKU-${1000 + i}-${j}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      scale_status: scaleStatuses[Math.floor(Math.random() * scaleStatuses.length)],
      version3Data: [
        { label: 'Text', value: `Custom text ${i}-${j}` },
        { label: 'Color', value: ['Red', 'Blue', 'Green'][Math.floor(Math.random() * 3)] },
        { label: 'Size', value: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)] },
      ],
      customized_url: 'https://via.placeholder.com/200',
      snapshotImage: Math.random() > 0.5 ? 'https://via.placeholder.com/200' : null,
      cost_center: {
        team: `Team ${Math.floor(Math.random() * 5) + 1}`,
        product_type: ['T-Shirt', 'Mug', 'Poster'][Math.floor(Math.random() * 3)],
      },
      qc_note: `QC note for item ${i}-${j}`,
      fulfillment_file: {
        front: 'https://via.placeholder.com/300',
        back: 'https://via.placeholder.com/300',
      },
    })),
  }));
};

const ScaleEsty = () => {
  const { collapsed } = useOutletContext();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusFulfillment[0]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [dataSource, setDataSource] = useState([]);
  const [allData, setAllData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableHeight, setTableHeight] = useState(0);
  const [tabFilter, setTabFilter] = useState(dataFilterStatusFulfillment);
  const [shops, setShops] = useState(['EtsyShop1', 'EtsyShop2', 'EtsyShop3', 'EtsyShop4']);
  const [selectShop, setSelectShop] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => {
    const saved = localStorage.getItem(LAST_UPDATED_KEY);
    return saved ? new Date(saved) : null;
  });
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    scale_status: '',
    from: defaultFrom,
    to: defaultTo,
    search: '',
    shopName: '',
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

  const updateFilter = useCallback((newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : 1,
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
      { title: <span style={{ color: dataColors.title }}>Action</span>, dataIndex: 'actions', key: 'actions', align: 'center' },
    ],
    []
  );

  const convertToArr = useCallback((object) => {
    return Object?.entries(typeof object === 'object' ? object : {}).map(([key, url]) => ({
      position: key,
      url,
    }));
  }, []);

  const fetchAllFulfill = useCallback(
    async (params) => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        let filteredData = [...allData];

        // Filter by scale status
        if (params.scale_status) {
          filteredData = filteredData.filter((item) => item.scale_overall_status === params.scale_status);
        }

        // Filter by shop
        if (params.shopName) {
          filteredData = filteredData.filter((item) => item.shopName === params.shopName);
        }

        // Filter by search
        if (params.search) {
          filteredData = filteredData.filter((item) => item.orderId.toLowerCase().includes(params.search.toLowerCase()));
        }

        // Filter by date range
        if (params.from && params.to) {
          filteredData = filteredData.filter((item) => {
            const itemDate = new Date(item.purchase_date);
            return itemDate >= new Date(params.from) && itemDate <= new Date(params.to);
          });
        }

        // Pagination
        const start = (params.page - 1) * params.perPage;
        const end = start + params.perPage;
        const paginatedData = filteredData.slice(start, end);

        setDataSource(paginatedData);
        setTotalCount(filteredData.length);
      } catch (error) {
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
        updateLastUpdatedAt();
      }
    },
    [allData, updateLastUpdatedAt]
  );

  const fetchCountStatus = useCallback(async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      const counts = {
        All: allData.length,
        'Not Started': allData.filter((item) => item.scale_overall_status === 'Not Started').length,
        'In Progress': allData.filter((item) => item.scale_overall_status === 'In Progress').length,
        Completed: allData.filter((item) => item.scale_overall_status === 'Completed').length,
        Failed: allData.filter((item) => item.scale_overall_status === 'Failed').length,
      };

      const resultTabFilter = dataFilterStatusFulfillment.map(({ key, title, status }) => ({
        key,
        title,
        status,
        count: counts[key] ?? 0,
      }));
      setTabFilter(resultTabFilter);
    } catch (error) {
      console.log(error);
    }
  }, [allData]);

  const handleFilterForStatus = useCallback(
    (status) => {
      if (status === 'All') {
        updateFilter({ scale_status: '' });
        return;
      }
      updateFilter({ scale_status: status });
    },
    [updateFilter]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((keyword) => {
        updateFilter({ search: keyword || '' });
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
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

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
      scaleBy: <StatusComponent title={item?.scaleBy || 'No data'} color={dataColors.purple} />,
      scaleStatus: <StatusComponent title={item?.scale_overall_status} color={handleColorStatusScale(item?.scale_overall_status)} />,
      actions: <ItemAction />,
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
              value={itemSub?.qc_note}
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
  }, [dataSource, fetchAllFulfill, filters, convertToArr, handleCopy]);

  // Initialize fake data
  useEffect(() => {
    const fakeData = generateFakeData(50);
    setAllData(fakeData);
  }, []);

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
    if (allData.length > 0) {
      fetchAllFulfill(filters);
      fetchCountStatus();
    }
  }, [filters, allData, fetchAllFulfill, fetchCountStatus]);

  useEffect(() => {
    if (isShowRowkeys) {
      setExpandedRowKeys(dataSource.map((item) => item.orderId));
    }
  }, [dataSource, isShowRowkeys]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Etsy Scale Tasks
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
                ListData={shops}
                value={selectShop}
                onChange={(val) => {
                  setSelectShop(val);
                  updateFilter({ shopName: val });
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
              defaultCurrent={currentPage}
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

export default React.memo(ScaleEsty);
