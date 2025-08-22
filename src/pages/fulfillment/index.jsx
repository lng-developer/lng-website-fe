import { useOutletContext } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { dataFilterStatusFulfillment } from '../../utils/dataFilter';
import { useEffect, useState } from 'react';
import ButtonFilter from '../../components/ButtonFilter';
import { dataColors } from '../../utils/dataColors';
import { Flex, Input, Pagination, Table } from 'antd';
import SelectFilter from '../../components/SelectFilter';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import StatusComponent from '../../components/StatusComponent';
import ItemDate from './table/ItemDate';
import ItemProductInfo from './table/ItemProductInfo';
import ItemCustom from './table/ItemCustom';
import ItemCostCenter from './table/ItemCostCenter';
import ItemOrderInfo from './table/ItemOrderInfo';
import TextArea from 'antd/es/input/TextArea';
import ItemAction from './table/ItemAction';
import SubItemAction from './table/SubItemAction';
import { formatDate } from '../../utils/fomatDate';
import { formatDistanceToNow } from 'date-fns';
import { getALlOrder } from '../../apis/order';
const PAGE_SIZE = 10;

const FulfillmentScale = () => {
  const { collapsed } = useOutletContext();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterStatusFulfillment[0]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableHeight, setTableHeight] = useState(0);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    statuses: 'New',
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
      title: <span style={{ color: dataColors.title }}>Order Date</span>,
      dataIndex: 'orderDate',
      key: 'orderDate',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Group ID</span>,
      dataIndex: 'groupId',
      key: 'groupId',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Group Type</span>,
      dataIndex: 'groupType',
      key: 'groupType',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Quality</span>,
      dataIndex: 'quality',
      key: 'quality',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Quantity</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      width: 80,
    },
    {
      title: <span style={{ color: dataColors.title }}>Order Owner</span>,
      dataIndex: 'orderOwner',
      key: 'orderOwner',
      align: 'center',
    },
    { title: <span style={{ color: dataColors.title }}>Scale By</span>, dataIndex: 'scaleBy', key: 'scaleBy', align: 'center' },
    {
      title: <span style={{ color: dataColors.title }}>Express</span>,
      dataIndex: 'express',
      key: 'express',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Scale Status</span>,
      dataIndex: 'scaleStatus',
      key: 'scaleStatus',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Action</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
    },
  ];

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

  // render Orders
  const renderOrderInTable = (data = []) => {
    const results = data.map((item, index) => {
      return {
        key: item?.orderId,
        orderDate: (
          <Flex vertical={true}>
            <span className="font-medium whitespace-nowrap">{formatDate(item?.purchase_date)}</span>
            <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
              ({formatDistanceToNow(item?.purchase_date, { addSuffix: true })})
            </span>
          </Flex>
        ),
        groupId: <StatusComponent title={item?.groupId || 'No data'} color={dataColors.default} isDefault={true} />,
        groupType: <StatusComponent title={item?.groupType || 'No data'} color={dataColors.process} />,
        status: <StatusComponent title={item?.status} color={handleColorStatus(item?.status)} />,
        quality: <StatusComponent title={item?.quality || 'No data'} color={dataColors.yellow} />,
        quantity: <span className="font-medium">{item?.quantity || '0'}</span>,
        orderOwner: <span className="font-medium">{item?.orderOwner || 'Nguyễn Huy Hoàng'}</span>,
        scaleBy: <span className="font-medium">{item?.scaleBy || 'Lê Thị Phương CS'}</span>,
        express: <StatusComponent title={item?.express || 'No data'} color={dataColors.cancelled} />,
        scaleStatus: <StatusComponent title={item?.scaleStatus || 'No data'} color={dataColors.success} />,
        actions: <ItemAction />,
        subItems: item?.items?.map((itemSub, indexItem) => {
          return {
            key: `${index}-${indexItem}`,
            date: <ItemDate />,
            product_info: (
              <ItemProductInfo imageUrl={itemSub?.baseImageUrl} asin={itemSub?.asin} sku={itemSub?.sku} status={item?.status} />
            ),
            customization: (
              <ItemCustom items={itemSub?.version3Data} customUrl={itemSub?.customized_url} linkImage={itemSub?.snapshotImage} />
            ),
            task_status: <StatusComponent title="Completed" color={dataColors.success} />,
            cost_center: <ItemCostCenter cost_center={itemSub?.cost_center} />,
            cs_note: (
              <div className="mb-1 w-45">
                <div className="font-semibold text-gray-800 mb-1">CS note: </div>
                <TextArea placeholder="CS note" />
              </div>
            ),
            action: (
              <SubItemAction
                fetchAllFulfill={fetchAllFulfill}
                filters={filters}
                scale_status={itemSub?.scale_status}
                orderId={item?.orderId}
                orderItemId={itemSub?.orderItemId}
                fulfillment_file={itemSub?.fulfillment_file}
              />
            ),
            order_info: (
              <ItemOrderInfo orderId={item?.orderId} seller={'Nguyễn Huy Hoàng'} fulfillName={'T11-4323604-8773863-11842012004108I'} />
            ),
          };
        }),
      };
    });
    return results;
  };

  // Cột con trong bảng mở rộng
  const expandedRowRender = (record) => {
    const subColumns = [
      { title: <span style={{ color: dataColors.title }}>Date</span>, dataIndex: 'date', key: 'date' },
      { title: <span style={{ color: dataColors.title }}>Product Info</span>, dataIndex: 'product_info', key: 'product_info' },
      { title: <span style={{ color: dataColors.title }}>Customization</span>, dataIndex: 'customization', key: 'customization' },
      { title: <span style={{ color: dataColors.title }}>Task Status</span>, dataIndex: 'task_status', key: 'task_status' },
      { title: <span style={{ color: dataColors.title }}>Cost Center</span>, dataIndex: 'cost_center', key: 'cost_center' },
      { title: <span style={{ color: dataColors.title }}>CS Note</span>, dataIndex: 'cs_note', key: 'cs_note' },
      { title: <span style={{ color: dataColors.title }}>Action</span>, dataIndex: 'action', key: 'action' },
      { title: <span style={{ color: dataColors.title }}>Order Info</span>, dataIndex: 'order_info', key: 'order_info' },
    ];

    return (
      <Table
        columns={subColumns}
        dataSource={record.subItems}
        pagination={false}
        rowKey="key"
        rowClassName={() => 'table-row-center'}
        bordered
        style={{ padding: 10 }}
      />
    );
  };

  const fetchAllFulfill = async (params) => {
    setLoading(true);
    try {
      const response = await getALlOrder(params);
      if (response.status === 200) {
        setDataSource(response.data?.data);
        setTotalCount(response.data?.totalCount);
      } else {
        console.log('error');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (!e.target.value) {
      updateFilter({ search: '' });
      return;
    }
    updateFilter({ search: e.target.value });
  };

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
    fetchAllFulfill(filters);
  }, [filters]);

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
            Manage Group Task Scale
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              //   onClick={handleClickAdd}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Vendor Fulfill
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex gap-3 items-center">
          {dataFilterStatusFulfillment.map((item, index) => (
            <ButtonFilter
              key={index}
              item={item}
              isActive={isActiveFilter?.key}
              // handleFilterForStatus={handleFilterForStatus}
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
                title="Type"
                ListData={['Outline', 'Custom Image', 'Manual Scale', 'Tool']}
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
            className="no-indent-table no-backgroud-title"
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
    </div>
  );
};

export default FulfillmentScale;
