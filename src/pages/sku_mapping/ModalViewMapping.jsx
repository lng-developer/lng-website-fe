import React, { useMemo } from 'react';
import { Modal, Table, Button, Tooltip, Space, Typography } from 'antd';
import { CopyOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { dataColors } from '../../utils/dataColors';

const { Title } = Typography;

const ModalViewMapping = ({ open, onCancel, record }) => {

  const { mapData, mapType } = useMemo(() => {
    if (record?.exactMap && Object.keys(record.exactMap || {}).length > 0) {
      return { mapData: record.exactMap, mapType: 'Exact Map' };
    }
    if (record?.productMap && Object.keys(record.productMap || {}).length > 0) {
      return { mapData: record.productMap, mapType: 'Product Map' };
    }
    if (record?.employeeMap && Object.keys(record.employeeMap || {}).length > 0) {
      return { mapData: record.employeeMap, mapType: 'Employee Map' };
    }
    return { mapData: {}, mapType: 'N/A' };
  }, [record]);

  const columns = [
    {
      title:<span style={{ color: dataColors.title }}>From</span>,
      dataIndex: 'from',
      key: 'from',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '',
      key: 'arrow',
      width: 50,
      align: 'center',
      render: () => <ArrowRightOutlined style={{ color: '#1677ff' }} />,
    },
    {
      title:<span style={{ color: dataColors.title }}>To</span>,
      dataIndex: 'to',
      key: 'to',
      render: (text) => <span className="font-medium">{text}</span>,
    },
  ];

  const dataSource = Object.entries(mapData).map(([from, to], index) => ({
    key: index,
    from,
    to,
  }));

  return (
    <Modal
      title={`View Mapping: ${record?.name || ''}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
      className='p-6'
    >
      <div className='w-full h-[700px]'>
        <Title level={5}>Type: {mapType}</Title>
        <Table 
          columns={columns} 
          dataSource={dataSource} 
          pagination={{ pageSize: 10, size: 'large', showTotal: (total) =>
          `Total ${total} items`,}} 
          bordered 
          size="small" 
          // className=''
        />
      </div>
    </Modal>
  );
};

export default ModalViewMapping;