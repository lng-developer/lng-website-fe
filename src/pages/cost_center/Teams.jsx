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
} from '../../apis/teams';
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

  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredTeams = dataTeams.filter(team => 
    (team.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  console.log("filterData",filteredTeams)
  return filteredTeams.map((item) => ({
    key: item._id?.toString(),
    id: item._id?.toString(), 
    _id: item._id, 
    leader: item.leader?.full_name,
    leader_id: item.leader?._id,
    name: item.name || 'No name',
    totalMembers: item.members.length || 0,
    members: Array.isArray(item.members) ? item.members : [],
  }));
}, [dataTeams, searchQuery]);

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
    // 'values' từ modal sẽ là: { name: "...", members: [{userId: "leader_id"}, {userId: "member_id"}] }
    
    // 1. Kiểm tra an toàn (dù form đã validate)
    if (!values.members || values.members.length === 0 || !values.members[0].userId) {
      toast.error("Leader is required. Failed to create team.");
      return;
    }

    setIsAddingTeam(true);
    try {
      const payload = {
        name: values.name,
        // 2. Lấy leaderId từ item đầu tiên
        leaderId: values.members[0].userId,
        // 3. Lấy userIds từ TẤT CẢ item (backend của bạn yêu cầu cả leader trong userIds)
        userIds: values.members.map(m => m.userId),
      };

      console.log('Payload đang gửi lên server:', payload); 

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
      let tasks = []; 

      if (newName !== originalName) {
        tasks.push(updateTeam(teamId, { name: newName, active: selectedTeam.active }));
      }

      const membersToAdd = [...newMemberIds].filter(id => !originalMemberIds.has(id));
      if (membersToAdd.length > 0) {
        tasks.push(addTeamMembers(teamId, { userIds: membersToAdd }));
      }

      const membersToRemove = [...originalMemberIds].filter(id => !newMemberIds.has(id));
      if (membersToRemove.length > 0) {
        tasks.push(removeTeamMembers(teamId, { userIds: membersToRemove }));
      }

      if (tasks.length > 0) {
        await Promise.all(tasks);
        toast.success('Team updated successfully');
      } else {
        toast.info('No changes detected.'); 
      }

      getDataTeams(); 
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
      await deleteTeam(selectedTeam._id); 
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
  const handleSearch = (value) => {
  setSearchQuery(value);
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
    
    //Kiểm tra xem thành viên bị xóa có phải là leader không
    const isLeader = selectedMember._id === selectedTeam.leader?._id;

    try {
      const tasks = [];
      const teamId = selectedTeam._id;

      // Luôn xóa thành viên khỏi team
      const removePayload = { userIds: [selectedMember._id] };
      tasks.push(removeTeamMembers(teamId, removePayload));

      //  Nếu là leader, cập nhật team để set leaderId = null
      if (isLeader) {
        const updatePayload = {
          name: selectedTeam.name,
          leaderId: null, // <-- Set leader về null
          active: selectedTeam.active,
        };
        tasks.push(updateTeam(teamId, updatePayload));
      }

      // 4. Chạy tất cả các API call
      await Promise.all(tasks);
      
      toast.success('Member removed successfully');
      if (isLeader) {
        toast.info('Team leader has been set to null.');
      }

      getDataTeams(); // Tải lại dữ liệu

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
    // --- THÊM CỘT MỚI ---
    {
      title: 'Leader',
      dataIndex: 'leader',
      key: 'leader',
      render: (leader) => (
        <span className="font-medium">
         
          {leader || 'null'}
        </span>
      ),
    },
    // --- KẾT THÚC CỘT MỚI ---
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
                color: dataColors.cancelled, // Thêm màu
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
      dataIndex: 'role',
      key: 'role',
      
      render: (roleObject) => (
        <span className="font-medium">
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
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
            allowClear
          />
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-screen">
            <Spin size="large" />
          </div>
        ) : (
          <div className='mt-4'>
            <Table
              className="no-indent-table product-type "
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
                  columnTitle: (
                                <div style={{ cursor: 'pointer'}}
                                onClick={handleToggleAll}
                              >
                                {areAllExpanded ? (
                                  <IoIosArrowUp style={{ fontSize: 15 }} />
                                ) : (
                                  <IoIosArrowDown style={{ fontSize: 15 }} />
                                )}
                              </div>
                                ),
              }}
              
            />
          </div>
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
        teamData={selectedTeam} 
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