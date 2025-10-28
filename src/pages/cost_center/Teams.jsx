import React, { useState, useEffect, useMemo } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { useOutletContext } from 'react-router-dom';
import AddTeamModal from './AddTeamModal';
import { dataColors } from '../../utils/dataColors';
import { MdAdd } from 'react-icons/md';
import {
  getAllTeam,
  removeTeamMembers,
  updateTeam,
  deleteTeam,
  createTeam,
} from '../../apis/config';
import { getAllUsers } from '../../apis/user';
import {
  Tooltip,
  Flex,
  Table,
  Spin,
  Modal,
  Space,
  Form,
  Input,
} from 'antd';
// Xóa import không dùng: DownOutlined, UpOutlined, DeleteOutlined, EditOutlined
import { MdDeleteOutline, MdOutlineEdit } from 'react-icons/md';
import { toast } from 'sonner';
import UpdateTeamModal from './UpdateTeamModal'; 
import { addTeamMembers } from '../../apis/config'; 

const Teams = () => {
  const { collapsed } = useOutletContext();
  const [dataTeams, setDataTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // const [updateForm] = Form.useForm();

  // --- State quản lý các Modal ---
  const [isDeleteMemberModal, setIsDeleteMemberModal] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [isUpdateTeamModal, setIsUpdateTeamModal] = useState(false);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);

  const [isDeleteTeamModal, setIsDeleteTeamModal] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  const [isAddTeamModal, setIsAddTeamModal] = useState(false);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  
  const [expandedKeys, setExpandedKeys] = useState([]);

  const getDataTeams = async () => {
    try {
      const res = await getAllTeam();
      if (res.status === 200) {
        const teamsData = res.data?.data || []; 
        setDataTeams(teamsData);
        console.log("teamsData", teamsData);
        
        const allKeys = teamsData.map(item => item._id?.toString());
        setExpandedKeys(allKeys);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to load team list');
      setDataTeams([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchAllUsers = async () => {
      try {
        const res = await getAllUsers({ all: true, perPage: 1000 }); 
        if (res.status === 200) {
          setAllUsers(res.data || []); 
          console.log("user data fetched:", res.data);
        }
      } catch (error) {
        console.log('Failed to fetch users', error);
      }
    };

 const formattedTeamData = useMemo(() => {
  if (!dataTeams) return [];
  return dataTeams.map((item) => ({
    key: item._id?.toString(),
    id: item._id?.toString(), 
    _id: item._id, 
    
    // SỬA DÒNG NÀY:
    name: item.name || 'No name', // <-- Đổi từ item.full_name sang item.name

    // Các dòng này đã đúng:
    totalMembers: item.members.length || 0,
    members: Array.isArray(item.members) ? item.members : [],
  }));
}, [dataTeams]);

  const areAllExpanded =
    dataTeams.length > 0 && expandedKeys.length === dataTeams.length;

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedKeys([]);
    } else {
      const allKeys = dataTeams.map(item => item._id?.toString());
      setExpandedKeys(allKeys);
    }
  };

  // --- Modal actions ---
  const showAddTeamModal = () => setIsAddTeamModal(true);

  const handleCreateTeam = async (values) => {
    setIsAddingTeam(true);
    try {
      const payload = {
        name: values.name,
        leaderId: "68b93ed3f02eed8dec002ee4",
        userIds: values.members ? values.members.map(m => m.userId) : [],
      };
      console.log('Payload đang gửi lên server:', payload); 
      // -----------------------------

      await createTeam(payload); 
      toast.success('Team created successfully'); 
      getDataTeams(); 
      cancelAllModals(); 
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setIsAddingTeam(false);
    }
  };

  const showUpdateTeamModal = (team) => {
    // 'team' là record từ formattedTeamData, nó có 'members'
    setSelectedTeam(team);
    setIsUpdateTeamModal(true);
  };

  const showDeleteTeamModal = (team) => {
    setSelectedTeam(team);
    setIsDeleteTeamModal(true);
  };

  const handleUpdateTeam = async (modalValues) => {
    setIsUpdatingTeam(true);
    
    // Lấy dữ liệu gốc và dữ liệu mới
    const teamId = selectedTeam._id;
    const originalName = selectedTeam.name;
    const originalMemberIds = new Set(selectedTeam.members.map(m => m._id));
    
    const newName = modalValues.name;
    const newMemberIds = new Set(modalValues.members ? modalValues.members.map(m => m.userId) : []);

    try {
      let tasks = []; // Mảng chứa các API call

      // Task 1: Cập nhật tên (nếu tên thay đổi)
      if (newName !== originalName) {
        tasks.push(updateTeam(teamId, { name: newName, active: selectedTeam.active }));
      }

      // Task 2: Tìm members mới để thêm
      const membersToAdd = [...newMemberIds].filter(id => !originalMemberIds.has(id));
      if (membersToAdd.length > 0) {
        tasks.push(addTeamMembers(teamId, { userIds: membersToAdd }));
      }

      // Task 3: Tìm members cũ để xóa
      const membersToRemove = [...originalMemberIds].filter(id => !newMemberIds.has(id));
      if (membersToRemove.length > 0) {
        tasks.push(removeTeamMembers(teamId, { userIds: membersToRemove }));
      }

      // Chạy tất cả các API call cùng lúc
      if (tasks.length > 0) {
        await Promise.all(tasks);
        toast.success('Team updated successfully');
      } else {
        toast.info('No changes detected.'); // Không có gì thay đổi
      }

      getDataTeams(); // Tải lại dữ liệu
      cancelAllModals();

    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team. One or more operations failed.');
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      setIsDeletingTeam(true);
      await deleteTeam(selectedTeam._id); // SỬA: Dùng _id
      toast.success('Team deleted successfully');
      getDataTeams();
      cancelAllModals();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    } finally {
      setIsDeletingTeam(false);
    }
  };

  const cancelAllModals = () => {
    setIsDeleteMemberModal(false);
    setIsUpdateTeamModal(false);
    setIsDeleteTeamModal(false);
    setIsAddTeamModal(false);
    setSelectedTeam(null);
    setSelectedMember(null);
    // updateForm.resetFields();
  };

  // --- Member actions ---
  const showDeleteMemberModal = (member, team) => {
    setSelectedMember(member);
    setSelectedTeam(team);
    setIsDeleteMemberModal(true);
  };

  const handleDeleteMember = async () => {
    if (!selectedMember || !selectedTeam) return;
    setIsDeletingMember(true);
    try {
      const payload = { userIds: [selectedMember._id] }; // Đảm bảo dùng _id
      await removeTeamMembers(selectedTeam._id, payload); // SỬA: Dùng _id
      toast.success('Member removed successfully');
      getDataTeams();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setIsDeletingMember(false);
      cancelAllModals();
    }
  };

  // --- Columns ---
  const teamColumns = [
    {
      title: (
        <Space>
          <span>Team Name</span>
          <span
            style={{ cursor: 'pointer', color: dataColors.asin }}
            onClick={handleToggleAll}
          >
            {areAllExpanded ? (
              <IoIosArrowUp style={{ fontSize: 15 }} />
            ) : (
              <IoIosArrowDown style={{ fontSize: 15 }} />
            )}
          </span>
        </Space>
      ),
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium">{text?.toString()}</span>,
    },
    {
      title: 'Member',
      dataIndex: 'totalMembers',
      key: 'totalMembers',
      render: (text) => <span className="font-medium">{text?.toString() || 0}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center', 
      render: (text, record) => (
        <Flex gap={10} justify="center">
          <Tooltip placement="top" title="Update">
            <button
              className="cursor-pointer border rounded"
              style={{
                padding: 6,
                borderColor: dataColors.default,
         
              }}
              onClick={() => showUpdateTeamModal(record)}
            >
              <MdOutlineEdit size={20} />
            </button>
          </Tooltip>
          
          <Tooltip placement="top" title="Delete">
            <button
              className="cursor-pointer border rounded"
              style={{
                padding: 6,
                borderColor: dataColors.default,
     
              }}
              onClick={() => showDeleteTeamModal(record)}
            >
              <MdDeleteOutline size={20} />
            </button>
          </Tooltip>
        </Flex>
      )
    },
  ];

  const getMemColumns = (teamRecord) => [
    {
      title: "Member Name",
      dataIndex: 'full_name',
      key: 'memberName',
      render: (text) => <span className="font-medium">{text?.toString() || ''}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role', // SỬA 1: Đổi từ 'role_id' sang 'role'
      key: 'role',
      
      // SỬA 2: Render tên của role
      render: (roleObject) => (
        <span className="font-medium">
          {/* Lấy roleObject.name, nếu không có thì hiển thị 'N/A' */}
          {roleObject?.name || 'N/A'} 
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, memberRecord) => (
        <Flex gap={10} justify="center">
          <Tooltip placement="top" title="Delete Member">
            <button
              className="cursor-pointer border rounded"
              style={{
                padding: 6,
                borderColor: dataColors.default,
              }}
              onClick={() => showDeleteMemberModal(memberRecord, teamRecord)}
            >
              <MdDeleteOutline size={20} />
            </button>
          </Tooltip>
        </Flex>
      ),
    },
  ];

  useEffect(() => {
    getDataTeams();
    fetchAllUsers();
  }, []);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Teams Group
          </h1>
          <div className="flex justify-center items-center">
            <button
              className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={showAddTeamModal}
            >
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Team
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4">
        <div className="flex justify-between items-center">
          <Input
            // onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
          />
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            className="no-indent-table product-type"
            columns={teamColumns}
            dataSource={formattedTeamData}
            pagination={false}
            rowKey="_id" 
            expandable={{
              expandedRowRender: (teamRecord) => (
                <Table
                  className="no-indent-table product-type"
                  columns={getMemColumns(teamRecord)}
                  dataSource={teamRecord.members}
                  pagination={false}
                  rowKey={(record, index) =>
                    record._id ? record._id.toString() : `member-${index}` 
                  }
                  style={{ padding: 10 }}
                />
              ),
              expandedRowKeys: expandedKeys,
              onExpandedRowsChange: (keys) => setExpandedKeys(keys),
              expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                  <IoIosArrowUp style={{ fontSize: 15, cursor: 'pointer' }} onClick={(e) => onExpand(record, e)} />
                ) : (
                  <IoIosArrowDown style={{ fontSize: 15, cursor: 'pointer' }} onClick={(e) => onExpand(record, e)} />
                ),
            }}
          />
        )}
      </div>

      <AddTeamModal
        open={isAddTeamModal}
        onCancel={cancelAllModals}
        onOk={handleCreateTeam}
        loading={isAddingTeam}
        allUsers={allUsers}
      />

      <Modal
        title="Confirm Delete Member"
        open={isDeleteMemberModal}
        onOk={handleDeleteMember}
        onCancel={cancelAllModals}
        confirmLoading={isDeletingMember}
        okText="Agree"
        cancelText="Cancel"
      >
        <p>
          Are you sure you want to remove member{' '}
          <strong>{selectedMember?.full_name}</strong> from team{' '}
          <strong>{selectedTeam?.name}</strong>?
        </p>
      </Modal>

      <UpdateTeamModal
        open={isUpdateTeamModal}
        onCancel={cancelAllModals}
        onOk={handleUpdateTeam}
        loading={isUpdatingTeam}
        allUsers={allUsers}
        teamData={selectedTeam} // Truyền team data vào modal
      />

      <Modal
        title="Confirm Delete Team"
        open={isDeleteTeamModal}
        onOk={handleDeleteTeam}
        onCancel={cancelAllModals}
        confirmLoading={isDeletingTeam}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete team{' '}
          <strong>{selectedTeam?.name}</strong>?
        </p>
        <p style={{ color: 'red' }}>
          This action cannot be undone and will permanently delete the team.
        </p>
      </Modal>
    </div>
  );
};

export default Teams;