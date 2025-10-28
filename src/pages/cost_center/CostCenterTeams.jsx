import React, { useState, useEffect, useMemo } from 'react';
import { MdAdd } from 'react-icons/md';
import { getAllTeam } from '../../apis/config';
import { Space, Table, Tag, Dropdown, Spin } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

const CostCenterTeams = () => {
  const [dataTeams, setDataTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowTeam, setRowTeam] = useState([]);
  const [rowMem, setRowMem] = useState([]);
  const [openMembers, setOpenMembers] = useState(true);

  const getDataTeams = async () => {
    try {
      const res = await getAllTeam({ all: true, page: 1, perPage: 100 });
      if (res.status === 200) {
        console.log(res.data?.data);
        setDataTeams(res.data?.data);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setDataTeams([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getDataTeams();
  }, []);
  const formattedTeamData = useMemo(() => {
    if (!dataTeams) return [];
    return dataTeams.map((item) => ({
      key: item.id,
      name: item.name,
      totalMembers: item.totalMembers,
      members: item.members || [],
      action: 'delete, create',
    }));
  }, [dataTeams]);
  const defaultExpandedKeys = useMemo(() => {
    if (!dataTeams) return [];
    return dataTeams.map((item) => item.id);
  }, [dataTeams]);
  const teamColumns = [
    {
      title: "Team's Name",
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Member',
      dataIndex: 'totalMembers',
      key: 'total member',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (text) => <a>{text}</a>,
    },
  ];
  const memColumns = [
    {
      title: "Member's Name",
      dataIndex: 'full_name',
      key: 'member name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role_id',
      key: 'role',
      render: (text) => <span>{text}</span>,
    },
  ];

  return (
    <div>
      <div className={`fixed top-0 left-64 right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Teams Group
          </h1>
          <div className="flex justify-center items-center">
            <button className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer">
              <MdAdd size={20} color="black" />
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Add Config
              </span>
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={teamColumns}
          dataSource={formattedTeamData}
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                className="no-indent-table product-type"
                columns={memColumns}
                dataSource={record.members}
                pagination={false}
                rowKey="id"
                style={{ padding: 10 }}
              />
            ),
            defaultExpandedRowKeys: defaultExpandedKeys,

            // 2. Cung cấp hàm render icon
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? <UpOutlined onClick={(e) => onExpand(record, e)} /> : <DownOutlined onClick={(e) => onExpand(record, e)} />,
          }}
        />
      )}
    </div>
  );
};

export default CostCenterTeams;
