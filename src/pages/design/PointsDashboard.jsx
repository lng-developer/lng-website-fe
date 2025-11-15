import React, { useState, useEffect, useMemo } from 'react';
import { Table, Typography } from 'antd';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import { getAllPointsWithLogs } from '../../apis/point';
import UserDetailModal from './ModalUserDetail';
import { dataColors } from '../../utils/dataColors';
import { HiMiniUserGroup } from 'react-icons/hi2';
import DateRangePicker from '../../components/DateRangePicker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { formatDate } from '../../utils/fomatDate';
import { FcCurrencyExchange } from 'react-icons/fc';
import { FcCalendar } from 'react-icons/fc';

const { Title } = Typography;

const PointsDashboard = () => {
  const { collapsed } = useOutletContext();
  const [meta, setMeta] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [apiRange, setApiRange] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const toUtcISOString = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

  const today = new Date();
  const sevenDaysAgo = subDays(today, 6);
  const [filters, setFilters] = useState({
    page: 1,
    from: toUtcISOString(startOfDay(sevenDaysAgo)),
    to: toUtcISOString(endOfDay(today)),
  });

  const totalBalance = useMemo(() => {
    return users.reduce((sum, user) => sum + (user.balance || 0), 0);
  }, [users]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAllPointsWithLogs(filters);
        if (res.data?.success) {
          setMeta(res.data?.meta);
          setUsers(res.data?.users);
        } else {
          toast.error('Failed to load points data');
        }
      } catch (error) {
        console.error('Failed to fetch points', error);
        toast.error(error.message || 'Failed to fetch points');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handlePageChange = (page, pageSize) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      page: page,
      limit: pageSize,
    }));
  };

  const handleFilterUpdate = (dateValues) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...dateValues,
      page: 1,
    }));
  };

  const showUserDetailModal = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedUser(null);
  };

  // CỘT CHO BẢNG CHÍNH (USERS)
  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Full Name</span>,
      dataIndex: 'full_name',
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Current Balance</span>,
      dataIndex: 'balance',
      key: 'balance',
      align: 'center',
      width: 150,
      sorter: (a, b) => a.balance - b.balance, // Cho phép sắp xếp
      render: (balance) => <span className="font-medium">{balance}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Points (In Range)</span>,
      dataIndex: 'totalPointsInRange',
      key: 'pointsInRange',
      align: 'center',
      width: 150,
      sorter: (a, b) => a.totalPointsInRange - b.totalPointsInRange,
      render: (points) => (
        <span className="font-medium" style={{ color: dataColors.success }}>
          {points > 0 ? `+${points}` : points}
        </span>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Log Count</span>,
      dataIndex: 'logs',
      key: 'logCount',
      align: 'center',
      width: 120,
      render: (logs) => <span className="font-medium">{logs ? logs.length : 0}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      key: 'actions',
      fixed: 'right',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <button
          className="cursor-pointer border rounded"
          style={{ padding: 6, borderColor: dataColors.default }}
          onClick={() => showUserDetailModal(record)}
        >
          <MdOutlineRemoveRedEye size={20} />
        </button>
      ),
    },
  ];

  const formatApiRange = (range) => {
    if (!range || (!range.from && !range.to)) return 'All Time';
    console.log(range);
    const fromDateObj = range.from.slice(0, 10);
    const toDateObj = range.to.slice(0, 10);

    const fromDateStr = formatDate(fromDateObj);
    const toDateStr = formatDate(toDateObj);

    console.log(typeof fromDateStr);
    if (fromDateStr === toDateStr) {
      return toDateStr;
    }

    return `${fromDateStr} – ${toDateStr}`;
  };
  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Points Dashboard
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
              updateFilter={handleFilterUpdate}
            />
          </div>
        </div>
      </div>
      {/* THỐNG KÊ */}
      <div className="w-[60%] pt-20 px-8 flex justify-between items-center">
        <div
          className="w-[32%] p-4 rounded-lg"
          style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
        >
          <div className="flex items-center justify-between h-[50px]">
            <div>
              <div className="font-medium text-[#64748b]">Total Users</div>
              <span className="text-xl font-bold" style={{ color: dataColors.pending }}>
                {meta?.returned || 0}
              </span>
            </div>
            <HiMiniUserGroup size={30} color={dataColors.pending} />
          </div>
        </div>

        <div
          className="w-[32%] p-4 rounded-lg"
          style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
        >
          <div className="flex items-center justify-between h-[50px]">
            <div>
              <div className="font-medium text-[#64748b]">Total Balance</div>
              <span className="text-xl font-bold" style={{ color: dataColors.success }}>
                {totalBalance}
              </span>
            </div>
            <FcCurrencyExchange size={30} />
          </div>
        </div>

        <div
          className="w-[32%] p-4 rounded-lg"
          style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
        >
          <div className="flex items-center justify-between h-[50px]">
            <div>
              <div className="font-medium text-[#64748b]">Date Range</div>
              <span className="font-medium" style={{ color: dataColors.process }}>
                {formatApiRange(filters)}
              </span>
            </div>
            <FcCalendar size={30} />
          </div>
        </div>
      </div>

      <div className="px-8 py-4 h-full mt-8">
        {/* BẢNG USERS */}
        <Table
          className="no-indent-table "
          bordered
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: meta?.totalUsers,
            pageSize: filters.limit,
            current: filters.page,
            onChange: handlePageChange,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />

        <UserDetailModal open={isDetailModalOpen} onCancel={handleCloseDetailModal} userData={selectedUser} />
      </div>
    </div>
  );
};

export default PointsDashboard;
