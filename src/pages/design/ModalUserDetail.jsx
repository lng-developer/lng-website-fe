import React from 'react';
import { Modal, Descriptions, Tag, Table, Typography } from 'antd';
import { format } from 'date-fns';
import { dataColors } from '../../utils/dataColors';

const { Title } = Typography;

const UserDetailModal = ({ open, onCancel, userData }) => {
  const logColumns = [
    {
      title: <span  style={{ color: dataColors.title }}>Date</span>,
      dataIndex: 'created_at',
      key: 'date',
      render: (date) => ( date ? <span className='font-medium'>{format(new Date(date), 'MMM d, yyyy')}</span> : <span className='font-bold'>N/A</span>
      ),
    },
    {
      title: <span style={{ color: dataColors.title }}>Task ID</span>,
      dataIndex: 'task_id',
      key: 'taskID',
      render: (text) => <span className='font-medium'>{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Type</span>,
      dataIndex: 'type',
      key: 'type',
      render: (text) => <span className='font-medium'>{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Balance After</span>,
      dataIndex: 'balance_after',
      key: 'balance_after',
      align: 'center',
      render: (text) => <span className='font-medium'>{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Points</span>,
      dataIndex: 'points',
      key: 'points',
      align: 'center',
      render: (points) => <span style={{ 
            
            color: points > 0 ? 'green' : 'red' 
          }}>
          {points > 0 ? `+${points}` : points}
        </span>,
    },
  ];

  return (
    <Modal
      title={<Title level={4}>{userData?.full_name}</Title>}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
      bodyStyle={{ height: '60vh', overflowY: 'auto' }}
    >
      {userData ? (
        <>
          
          {userData.logs && userData.logs.length > 0 ? (
            <Table
              className="no-indent-table product-type mt-4"
              columns={logColumns}
              dataSource={userData.logs}
              rowKey="_id"
              pagination={{
                pageSize: 8,
                size: 'small',
                hideOnSinglePage: false
              }}
            />
          ) : (
            <Table
              className="no-indent-table product-type "
              bordered
              showHeader={true}
              columns={logColumns}
              dataSource={null}
              rowKey="_id"
              
            />
          )}
        </>
      ) : (
        <p>No user data available.</p>
      )}
    </Modal>
  );
};

export default UserDetailModal;
