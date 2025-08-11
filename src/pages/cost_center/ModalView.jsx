import { Flex, Input, Modal, Pagination, Table } from 'antd';
import { useState } from 'react';
import { dataColors } from '../../utils/dataColors';
import StatusComponent from '../../components/StatusComponent';

const ModalView = ({ isOpenModal, setIsOpenModal, dataSource = [] }) => {
  const [valueFilter, setValueFilter] = useState('');

  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>STT</span>,
      dataIndex: 'key',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Size</span>,
      dataIndex: 'godSize',
      width: 200,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Color</span>,
      dataIndex: 'godColor',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Size</span>,
      dataIndex: 'standardSize',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Color</span>,
      dataIndex: 'standardColor',
      width: 150,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      width: 80,
      align: 'center',
      render: () => <StatusComponent title="Active" color={dataColors.success} />,
    },
  ];

  return (
    <Modal title="List Variant LngGroup" open={isOpenModal} width={1000} height={200} onCancel={() => setIsOpenModal(false)} footer={null}>
      <Flex vertical={true} gap={10} style={{ paddingBottom: 10 }}>
        <Flex>
          <div>
            <span className="font-medium">Body Suit Embroidered</span>
            <span className="font-medium" style={{ color: dataColors.title }}>
              {' '}
              (Total: 49 variants)
            </span>
          </div>
        </Flex>
        <Flex vertical={true} gap={2} style={{ width: 300 }}>
          <div>
            <Input
              defaultValue={valueFilter}
              value={valueFilter}
              placeholder="Filter..."
              onChange={(e) => setValueFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
          </div>
        </Flex>
        <Table
          dataSource={dataSource}
          columns={columns}
          style={{ height: 550, width: 'auto' }}
          bordered
          pagination={false}
          scroll={{ y: 500 }}
        />
        <Flex justify="end" style={{ marginTop: 10 }}>
          <Pagination
            total={dataSource.length}
            showTotal={(total) => `Total ${total} items`}
            defaultPageSize={10}
            defaultCurrent={1}
            // onChange={handlePageChange}
            // onShowSizeChange={handlePageChange}
          />
        </Flex>
      </Flex>
    </Modal>
  );
};

export default ModalView;
