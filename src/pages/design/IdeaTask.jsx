import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataFilterIdeaTasks } from '../../utils/dataFilter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultFrom, defaultTo, formatDate, formatDateDetail } from '../../utils/fomatDate';
import DateRangePicker from '../../components/DateRangePicker';
import ButtonFilter from '../../components/ButtonFilter';
import { MdAdd } from 'react-icons/md';
import { debounce } from 'lodash';
import { Input, Select, Typography, Pagination, Image, Flex, Table, Popover } from 'antd';
import { dataColors } from '../../utils/dataColors';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import StatusComponent from '../../components/StatusComponent';
import { getAllIdeaTask, getIdeaTaskStatictisc } from '../../apis/psdTask';
import ModalAddIdeaTask from './ModalAddIdeaTask';
import ItemActionIdeaTask from './ItemActionIdea';
import { TbHistory } from 'react-icons/tb';
import { FaLongArrowAltRight } from 'react-icons/fa';

const { TextArea } = Input;
const PAGE_SIZE = 10;

const IdeaTask = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();
  const [isActiveFilter, setIsActivefilter] = useState(dataFilterIdeaTasks[0]);
  const [tabFilter, setTabFilter] = useState(dataFilterIdeaTasks);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    from: defaultFrom,
    to: defaultTo,
    status: '',
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
    if (status === 'All') {
      updateFilter({ status: '' });
      return;
    }
    updateFilter({ status: status });
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

  const contentHistory = (data = []) => {
    return data?.map((item) => (
      <div className="mb-2">
        <div className="flex gap-4 items-center">
          <FaLongArrowAltRight color={dataColors.success} />
          <span className="font-medium">{item?.action}</span>
        </div>
        <div>{formatDateDetail(item.at)}</div>
      </div>
    ));
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
            (
            {formatDistanceToNow(data, { addSuffix: true })
              .replace(/^about /, '')
              .replace(/^less than /, '')}
            )
          </span>
        </Flex>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Product Image</span>,
      dataIndex: 'image',
      key: 'image',
      align: 'center',
      render: (data) => (
        <div className="flex justify-center">
          <div
            className="w-[100px] h-[100px] rounded-lg overflow-hidden"
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <Image width={100} height={100} src={data} className="rounded-lg" />
          </div>
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Status Task</span>,
      dataIndex: 'status',
      key: 'Status',
      align: 'center',
      render: (data) => (
        <div className="flex items-center justify-center gap-1">
          <StatusComponent title={data?.stt} color={handleColorStatus(data?.stt)} />
          <Popover placement="bottomLeft" arrow={false} title={'History'} content={contentHistory(data?.history)}>
            <TbHistory size={16} className="cursor-pointer" />
          </Popover>
        </div>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Link product</span>,
      dataIndex: 'referenceLink',
      key: 'referenceLink',
      align: 'center',
      render: (data) => (
        <Link
          to={data}
          target="_blank"
          style={{ borderColor: dataColors.pending, backgroundColor: `${dataColors.pending}10`, maxWidth: 220 }}
          className={`inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground`}
        >
          <span
            style={{
              color: dataColors.pending,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
            }}
            className="whitespace-nowrap"
          >
            {data}
          </span>
        </Link>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Assigned</span>,
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      align: 'center',
      render: (data) => <StatusComponent title={data?.full_name || 'Pending assign'} color={dataColors.process} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Seller</span>,
      dataIndex: 'createdBy',
      key: 'createdBy',
      align: 'center',
      render: (data) => <StatusComponent title={data?.full_name} color={dataColors.process} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Description</span>,
      dataIndex: 'description',
      key: 'description',
      align: 'center',
      render: (data) => <TextArea value={data} spellCheck={false} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Product type</span>,
      dataIndex: 'productType',
      key: 'productType',
      align: 'center',
      render: (data) => <StatusComponent title={data} color={dataColors.asin} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      render: (data) => (
        <ItemActionIdeaTask
          statusTask={data?.status}
          idTask={data?._id}
          data={data}
          asin={data?.asin}
          fetchAllListing={fetchAllTask}
          filters={filters}
          fetchCountStatus={fetchCountStatus}
          user={user}
        />
      ),
    },
  ];

  const fetchAllTask = async (params) => {
    setLoading(true);
    try {
      const response = await getAllIdeaTask(params);
      if (response.status === 200) {
        const result = response.data?.data?.map((item) => {
          return {
            ...item,
            status: {
              stt: item?.status,
              history: item?.history,
            },
            actions: {
              ...item,
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
      const formatFilter = {
        page: filters?.page,
        perPage: filters?.perPage,
        from: filters?.from,
        to: filters?.to,
      };
      const response = await getIdeaTaskStatictisc(formatFilter);
      if (response.status === 200) {
        const resultTabFilter = dataFilterIdeaTasks.map(({ key, title, status }) => ({
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
            Idea Tasks
          </h1>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setShowCreateModal(true)}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Create Task
              </span>
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
      <ModalAddIdeaTask
        setShowCreateModal={setShowCreateModal}
        showCreateModal={showCreateModal}
        fetchAllTask={fetchAllTask}
        filters={filters}
      />
    </div>
  );
};

export default IdeaTask;
