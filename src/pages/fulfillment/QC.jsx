import { Flex, Image, Input, Pagination, Table, Tooltip } from 'antd';
import { dataColors } from '../../utils/dataColors';
import SelectFilter from '../../components/SelectFilter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import StatusComponent from '../../components/StatusComponent';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { formatDistanceToNow } from 'date-fns';
import { dataFilterStatusQC } from '../../utils/dataFilter';
import ButtonFilter from '../../components/ButtonFilter';
import QcCanvasModal from './ModalQC';
import { MdOutlineImageSearch } from 'react-icons/md';
import { getAllCountStatusQC, getAllQC } from '../../apis/order';
import { toast } from 'sonner';
import { FcShop } from 'react-icons/fc';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { RiLinkM } from 'react-icons/ri';
import DateRangePicker from '../../components/DateRangePicker';
import { handleColorStatus, handleColorStatusScale } from '../../utils/handleColor';
import ItemProductInfoQC from './ItemProductInfoQC';
import { debounce } from 'lodash';
import QcCanvasModal2 from './Modal2';
const PAGE_SIZE = 10;

const QC = () => {
  const { collapsed } = useOutletContext();
  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusQC[0]);
  const [openModalQC, setOpenMOdalQC] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [tableHeight, setTableHeight] = useState(0);
  const [dataView, setDataView] = useState({});
  const [tabFilter, setTabFilter] = useState(dataFilterStatusQC);
  const [indexQC, setIndexQC] = useState(0);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    scale_status: '',
    from: defaultFrom,
    to: defaultTo,
    search: '',
  });

  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: newValues.page || Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : 1,
    }));
  };

  const handlePageChange = (page, pageSize) => {
    updateFilter({ page: page, perPage: pageSize });
    setCurrentPage(page);
  };

  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.key]);
    } else {
      setExpandedRowKeys(expandedRowKeys?.filter((key) => key !== record.key));
    }
  };

  const handleShowRowKeys = () => {
    if (isShowRowkeys) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(dataSource.map((item) => item.orderId));
    }
    setIsShowRowKeys((prev) => !prev);
  };

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Order ID</span>,
      dataIndex: 'orderId',
      key: 'orderId',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Status QC</span>,
      dataIndex: 'scale_overall_status',
      key: 'scale_overall_status',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Created</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Order Date</span>,
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Status Order</span>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Scale By</span>,
      dataIndex: 'scale_by',
      key: 'scale_by',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>QC By</span>,
      dataIndex: 'qc_by',
      key: 'qc_by',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Basecost</span>,
      dataIndex: 'base_cost',
      key: 'base_cost',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Store</span>,
      dataIndex: 'shopName',
      key: 'shopName',
      align: 'center',
    },
  ];

  const expandedRowRender = (record) => {
    const subColumns = [
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
        title: <span style={{ color: dataColors.title }}>Fulfill Name</span>,
        dataIndex: 'fulfill_name',
        key: 'fulfill_name',
        align: 'center',
      },
      {
        title: <span style={{ color: dataColors.title }}>PNG Status</span>,
        dataIndex: 'png_status',
        key: 'png_status',
        align: 'center',
      },
      {
        title: <span style={{ color: dataColors.title }}>Vendor Product</span>,
        dataIndex: 'cost_center',
        key: 'cost_center',
        align: 'center',
      },
      { title: <span style={{ color: dataColors.title }}>Action</span>, dataIndex: 'action', key: 'action', align: 'center' },
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

  // render Orders
  const renderOrderInTable = (data = []) => {
    const results = data.map((item, index) => {
      return {
        key: item?.orderId,
        orderId: <StatusComponent title={item?.orderId} color={dataColors.default} isDefault={true} />,
        status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
        scale_overall_status: (
          <StatusComponent title={item?.scale_overall_status} color={handleColorStatusScale(item?.scale_overall_status)} />
        ),
        createdAt: (
          <Flex vertical={true}>
            <span className="font-medium whitespace-nowrap">{formatDate(item?.createdAt)}</span>
            <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
              ({formatDistanceToNow(item?.createdAt, { addSuffix: true })})
            </span>
          </Flex>
        ),
        purchase_date: (
          <Flex vertical={true}>
            <span className="font-medium whitespace-nowrap">{formatDate(item?.purchase_date)}</span>
            <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
              ({formatDistanceToNow(item?.purchase_date, { addSuffix: true })})
            </span>
          </Flex>
        ),
        scale_by: <StatusComponent title={item?.seller?.full_name || 'No data'} color={dataColors.process} />,
        base_cost: <span className="font-medium">${item?.base_cost}</span>,
        shopName: (
          <Flex justify="center" style={{ borderColor: dataColors.pending, whiteSpace: 'nowrap' }}>
            <FcShop size={20} />
            <span className="font-medium ml-2 w-auto" style={{ color: dataColors.pending }}>
              {item?.shopName}
            </span>
          </Flex>
        ),
        qc_by: <StatusComponent title={item?.scale_by || 'Đặng Thành Trung CS'} color={dataColors.purple} />,
        subItems: item?.items?.map((itemSub, indexItem) => {
          return {
            key: `${index}-${indexItem}`,
            // orderItemId: <StatusComponent title={itemSub?.orderItemId} color={dataColors.default} isDefault={true} />,
            product_info: (
              <ItemProductInfoQC link={itemSub?.baseImageUrl} sku={itemSub?.sku} asin={itemSub?.asin} quantity={itemSub?.quantity} />
            ),
            scale_status: <StatusComponent title={itemSub?.scale_status} color={handleColorStatusScale(itemSub?.scale_status)} />,
            png_status: <StatusComponent title={'Completed'} color={dataColors.success} />,
            fulfill_name: (
              <div
                style={{ borderColor: dataColors.default, backgroundColor: `${dataColors.default}10` }}
                className={`inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground`}
              >
                <span style={{}}>{`${item?.orderId}-${itemSub?.orderItemId}`}</span>
              </div>
            ),
            cost_center: (
              <div
                style={{ borderColor: dataColors.default, backgroundColor: `${dataColors.default}10` }}
                className={`inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground`}
              >
                <span>{itemSub?.cost_center?.vendorProductDisplayName}</span>
              </div>
            ),
            action: (
              <Tooltip title="QC">
                <button
                  className="cursor-pointer border rounded"
                  style={{ padding: 6, borderColor: dataColors.default }}
                  onClick={() => {
                    setDataView({ orderId: item?.orderId, data: itemSub });
                    // setDataView(item);
                    // setIndexQC(indexItem);
                    setOpenMOdalQC(true);
                  }}
                >
                  <MdOutlineImageSearch size={20} />
                </button>
              </Tooltip>
            ),
          };
        }),
      };
    });
    return results;
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

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const fetchAllQC = async (params) => {
    setLoading(true);
    try {
      const response = await getAllQC(params);
      if (response.status === 200) {
        const result = response.data?.data;
        setDataSource(result);
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

  // fetch count order by status
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

  const handleFilterForStatus = (status) => {
    if (status === 'All') {
      updateFilter({ scale_status: '' });
      return;
    }
    updateFilter({ scale_status: status });
  };

  useEffect(() => {
    fetchAllQC(filters);
    fetchCountStatus();
  }, [filters]);

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 265; // Chiều cao header nếu có
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
    if (isShowRowkeys) {
      // Tự động mở tất cả dòng khi component mount
      setExpandedRowKeys(dataSource.map((item) => item.orderId));
    }
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
            <div className="flex gap-2 items-center">
              <SelectFilter
                title="Seller"
                ListData={['Nguyễn Huy Hoàng', 'Tạ Khánh Tùng']}
                // value={selectShop}
                // onChange={(val) => {
                //   setSelectShop(val);
                //   updateFilter({ shopName: val });
                // }}
              />
            </div>
          </div>
          <div>
            <Pagination
              total={totalCount}
              showTotal={(total) => `Total ${total} items`}
              defaultPageSize={10}
              defaultCurrent={1}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <Table
            className="no-indent-table table-qc"
            columns={columns}
            dataSource={renderOrderInTable(dataSource)}
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
        stageWidth={900}
        stageHeight={520}
        fetchAllQC={fetchAllQC}
        filters={filters}
        fetchCountStatus={fetchCountStatus}
      />
      {/* <QcCanvasModal2
        open={openModalQC}
        onClose={() => setOpenMOdalQC(false)}
        orderInfo={dataView}
        stageWidth={900}
        stageHeight={520}
        fetchAllQC={fetchAllQC}
        filters={filters}
        fetchCountStatus={fetchCountStatus}
        logicalWidth={4200}
        logicalHeight={4800}
        viewportWidth={1000}
        viewportHeight={750}
        indexQC={indexQC}
      /> */}
    </div>

    // <QCPreviewModal
    //   open={true}
    //   layersData={[
    //     {
    //       id: 'front',
    //       label: 'Front',
    //       url: 'https://res.cloudinary.com/debr5x898/image/upload/v1756516674/fulfillment_files/112-4563192-0238605-137817274210201-front.png',
    //       x: 900,
    //       y: 360,
    //       scale: 1,
    //       rotation: 0,
    //       visible: true,
    //       opacity: 1,
    //     },
    //     {
    //       id: 'rightSleeve',
    //       label: 'Right Sleeve',
    //       url: 'https://res.cloudinary.com/debr5x898/image/upload/v1756516677/fulfillment_files/112-4563192-0238605-137817274210201-right_sleeve.png',
    //       x: 420,
    //       y: 960,
    //       scale: 1,
    //       rotation: 0,
    //       visible: true,
    //       opacity: 1,
    //     },
    //   ]}
    //   logicalWidth={4200}
    //   logicalHeight={4800}
    //   viewportWidth={1000}
    //   viewportHeight={750}
    //   itemInfo={{
    //     orderId: '112-456…',
    //     asin: 'B0F…',
    //     vendor: 'Merchfox',
    //     color: 'Royal Blue',
    //     size: '3XL',
    //   }}
    // />
  );
};

export default QC;
