// file: src/pages/User/User.jsx (File Account.jsx cũ)
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MdDeleteOutline, MdOutlineRemoveRedEye, MdAdd } from 'react-icons/md';
import { Table, Card, Input, Space, Typography, Spin, Row, Col, Button, Tag, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { toast } from 'sonner';

import { getAllUsers, createUser, updateUser, getAllRoles } from '../../apis/user';
import { getAllAccount, createAccount, resetTempPassword } from '../../apis/account';

import { dataColors } from '../../utils/dataColors';

import ModalCreateUpdateUser from './ModalCreateUpdateUser';
import ModalManageAccount from './ModalManageAccount';

const User = () => {
  const { collapsed } = useOutletContext();
  const [allUsers, setAllUsers] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [isResetting, setIsResetting] = useState(false);
  const [resetResponse, setResetResponse] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, accountRes, roleRes] = await Promise.all([getAllUsers({ all: true }), getAllAccount(), getAllRoles()]);

      setAllUsers(userRes.data || []);
      setAllAccounts(accountRes.data || []);
      setAllRoles(roleRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mergedData = useMemo(() => {
    const accountMap = new Map(allAccounts.map((acc) => [acc.user_id?._id, acc]));

    return allUsers.map((user) => ({
      ...user,
      account: accountMap.get(user._id) || null,
    }));
  }, [allUsers, allAccounts]);

  const filteredData = useMemo(() => {
    return mergedData.filter((item) => {
      const fullName = item.full_name || '';
      const email = item.email || '';
      const employeeId = item.employee_id || '';

      const query = searchText.toLowerCase();
      return fullName.toLowerCase().includes(query) || email.toLowerCase().includes(query) || employeeId.toLowerCase().includes(query);
    });
  }, [mergedData, searchText]);

  const handleOpenModal = (modalType, record = null) => {
    setSelectedRecord(record);
    if (modalType === 'user') setIsUserModalOpen(true);
    if (modalType === 'account') setIsAccountModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsUserModalOpen(false);
    setIsAccountModalOpen(false);
    setSelectedRecord(null);
    setIsResetting(false);
    setResetResponse(null);
  };

  // Hàm submit cho Add/Update USER
  const handleUserFormSubmit = async (payload) => {
    setFormLoading(true);
    try {
      if (selectedRecord?._id) {
        // Update User
        await updateUser(selectedRecord._id, payload);
        toast.success('User updated successfully');
      } else {
        // Create User
        await createUser(payload);
        toast.success('User created successfully');
      }
      fetchData();
      handleCloseModals();
    } catch (error) {
      console.error('Failed to submit user form:', error);
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAccountFormSubmit = async (payload) => {
    // Chỉ xử lý "Create"
    if (selectedRecord?.account) return;

    setFormLoading(true);
    try {
      await createAccount(payload);
      toast.success('Account created successfully');
      fetchData();
      handleCloseModals();
    } catch (error) {
      console.error('Failed to submit account form:', error);
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedRecord?.account) return;

    setIsResetting(true);
    setResetResponse(null);
    try {
      const res = await resetTempPassword(selectedRecord.account._id);
      setResetResponse(res.data);
      toast.success(res.data.message || 'Password reset successfully');
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Full Name</span>,
      dataIndex: 'full_name',
      key: 'full_name',
      width: 200,
      fixed: 'left',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Email</span>,
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text) => <span className="font-medium"> {text || 'N/A'}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Employee ID</span>,
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120,
      render: (text) => <span className="font-medium">{text || 'N/A'}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Role</span>,
      dataIndex: 'role_id',
      key: 'role',
      width: 150,
      render: (role_id) => <span className="font-medium"> {role_id?.name || 'N/A'}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Account Status</span>,
      dataIndex: 'account',
      key: 'account',
      align: 'center',
      width: 150,
      render: (account) => (account ? <Tag color="success">Linked</Tag> : <Tag>No Account</Tag>),
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      key: 'actions',
      align: 'center',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Manage Account">
            <Button icon={<UserSwitchOutlined />} onClick={() => handleOpenModal('account', record)} />
          </Tooltip>
          <Tooltip title="Update User">
            <Button icon={<EditOutlined />} onClick={() => handleOpenModal('user', record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Users Management
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => handleOpenModal('user', null)}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add New User
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Page */}
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex justify-between items-center ">
          <Input
            placeholder="Search by Name, Email, Employee ID..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
          />
        </div>
        <Spin spinning={loading}>
          <Table
            className="no-indent-table mt-4"
            columns={columns}
            dataSource={filteredData}
            bordered={true}
            rowKey="_id"
            pagination={{ pageSize: 10, size: 'large', showTotal: (total) => `Total ${total} items` }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </div>

      <ModalCreateUpdateUser
        open={isUserModalOpen}
        onCancel={handleCloseModals}
        onOk={handleUserFormSubmit}
        loading={formLoading}
        initialData={selectedRecord}
        allRoles={allRoles}
      />

      <ModalManageAccount
        open={isAccountModalOpen}
        onCancel={handleCloseModals}
        onOk={handleAccountFormSubmit}
        onReset={handleResetPassword}
        loading={formLoading || isResetting}
        userData={selectedRecord}
        accountData={selectedRecord?.account}
        apiResponse={resetResponse}
      />
    </div>
  );
};

export default User;
