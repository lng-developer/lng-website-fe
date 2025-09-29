import { useOutletContext } from 'react-router-dom';
import DateRangePicker from '../../components/DateRangePicker';
import { dataFilterDesignTasks, dataFilterTasks } from '../../utils/dataFilter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { debounce } from 'lodash';
import { dataColors } from '../../utils/dataColors';
import StatusComponent from '../../components/StatusComponent';
import { Flex, Image, Input, Pagination, Table } from 'antd';
import ButtonFilter from '../../components/ButtonFilter';
import { toast } from 'sonner';
import { getAllPsdTask, getTaskStatictisc } from '../../apis/psdTask';
import ItemActionPSD from './ItemActionPSD';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
const PAGE_SIZE = 10;

const PSDTasks = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterTasks[0]);
  const [dataSource, setDataSource] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tabFilter, setTabFilter] = useState(dataFilterTasks);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
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

  const handleFilterForStatus = (status) => {
    if (status === 'all') {
      updateFilter({ status: '' });
      return;
    }
    updateFilter({ status: status });
  };

  const handleColorStatus = (stt) => {
    switch (stt) {
      case 'New':
        return dataColors.success;
      case 'Requested':
        return dataColors.process;
      case 'Assigned':
        return dataColors.process;
      case 'In Progress':
        return dataColors.process;
      case 'Uploaded':
        return dataColors.success;
      case 'QC Rejected':
        return dataColors.cancelled;
      case 'QC Passed':
        return dataColors.success;
      default:
        return dataColors.default;
    }
  };

  const handleColorPriority = (stt) => {
    switch (stt) {
      case 'Low':
        return dataColors.yellow;
      case 'Normal':
        return dataColors.success;
      case 'High':
        return dataColors.process;
      case 'Urgent':
        return dataColors.purple;
      default:
        return dataColors.default;
    }
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

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Created At</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      render: (data) => (
        <Flex vertical={true}>
          <span className="font-medium whitespace-nowrap">{formatDate(data)}</span>
          <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
            ({formatDistanceToNow(data, { addSuffix: true })})
          </span>
        </Flex>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Product Image</span>,
      dataIndex: 'listing',
      key: 'product_image',
      align: 'center',
      render: (data) => (
        <div className="flex justify-center">
          <div
            className="w-[100px] h-[100px] rounded-lg overflow-hidden"
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <Image width={100} height={100} src={data?.product_image} className="rounded-lg" />
          </div>
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Asin</span>,
      dataIndex: 'listing',
      key: 'asin',
      align: 'center',
      render: (data) => <StatusComponent title={data?.asin} color={dataColors.pending} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Status Task</span>,
      dataIndex: 'status',
      key: 'Status',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={handleColorStatus(data)} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Assigned</span>,
      dataIndex: 'designer',
      key: 'designer',
      align: 'center',
      render: (data) => <StatusComponent title={data?.full_name || 'Pending assign'} color={dataColors.purple} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Priority</span>,
      dataIndex: 'priority',
      key: 'priority',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={handleColorPriority(data)} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>PSD Status</span>,
      dataIndex: 'listing',
      key: 'psd',
      align: 'center',
      render: (data) => (
        <StatusComponent
          title={data?.psd?.status || 'Unavailable'}
          color={data?.psd?.status === 'Available' ? dataColors.success : dataColors.cancelled}
        />
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Seller</span>,
      dataIndex: 'seller',
      key: 'seller',
      align: 'center',
      render: (data) => <StatusComponent title={data?.full_name} color={dataColors.process} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Platform</span>,
      dataIndex: 'listing',
      key: 'platform',
      align: 'center',
      render: (data) => <StatusComponent title={data?.platform} color={dataColors.purple} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Asin Type</span>,
      dataIndex: 'listing',
      key: 'asin_type',
      align: 'center',
      render: (data) => <StatusComponent title={data?.asin_type} color={dataColors.asin} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      render: (data) => (
        <ItemActionPSD
          statusTask={data?.statusTask}
          idTask={data?.idTask}
          data={data}
          asin={data?.asin}
          fetchAllListing={fetchAllTask}
          filters={filters}
          isDelete={false}
          fetchCountStatus={fetchCountStatus}
        />
      ),
    },
  ];

  const fetchAllTask = async (params) => {
    setLoading(true);
    try {
      const response = await getAllPsdTask(params);
      if (response.status === 200) {
        const result = response.data?.tasks?.map((item) => {
          return {
            ...item,
            actions: {
              idTask: item._id,
              statusTask: item?.status,
              ...item?.listing,
            },
          };
        });
        setDataSource(result);
        setTotalCount(response.data?.total);
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
      const response = await getTaskStatictisc(filters);
      if (response.status === 200) {
        const resultTabFilter =
          user?.role === 'Designer'
            ? dataFilterDesignTasks.map(({ key, title, status }) => ({
                key,
                title,
                status,
                count: response.data?.[key] ?? 0,
              }))
            : dataFilterTasks.map(({ key, title, status }) => ({
                key,
                title,
                status,
                count: response.data?.[key] ?? 0,
              }));
        setTabFilter(resultTabFilter);
      }
    } catch (error) {
      console.log(error);
    }
  }, [filters]);

  useEffect(() => {
    fetchCountStatus();
    fetchAllTask(filters);
  }, [filters]);
  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            PSD Tasks
          </h1>
          <div className="flex justify-center items-center gap-2">
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
            className="no-indent-table"
            columns={columns}
            dataSource={dataSource}
            rowKey="key"
            bordered={true}
            pagination={false}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default PSDTasks;
