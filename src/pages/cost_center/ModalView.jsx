import { Flex, Input, Modal, Pagination, Table } from 'antd';
import { dataColors } from '../../utils/dataColors';
import StatusComponent from '../../components/StatusComponent';

const ModalView = ({ isOpenModal, setIsOpenModal, dataSource = [], setDataView, dataView = [] }) => {
  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>STT</span>,
      dataIndex: 'stt',
      align: 'center',
      width: 60,
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Size</span>,
      dataIndex: 'vendor_size',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>LNG Color</span>,
      dataIndex: 'vendor_color',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Size</span>,
      dataIndex: 'standard_size',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Standard Color</span>,
      dataIndex: 'standard_color',
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      width: 80,
      align: 'center',
      render: () => <StatusComponent title="Active" color={dataColors.success} />,
    },
  ];

  const handleSearch = (value) => {
    if (!value) {
      setDataView(dataSource);
      return;
    }
    const qn = value.trim().toLowerCase();

    const filtered = dataSource?.filter((item) =>
      Object.values(item)?.some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(qn)
      )
    );
    setDataView(filtered);
  };

  return (
    <Modal title="List Variant LngGroup" open={isOpenModal} width={1000} height={200} onCancel={() => setIsOpenModal(false)} footer={null}>
      <Flex vertical={true} gap={10} style={{ paddingBottom: 10 }}>
        <Flex>
          <div>
            <span className="font-medium">Body Suit Embroidered</span>
            <span className="font-medium" style={{ color: dataColors.title }}>
              {' '}
              (Total: {dataView?.length || 0} variants)
            </span>
          </div>
        </Flex>
        <Flex vertical={true} gap={2} style={{ width: 300 }}>
          <div>
            <Input
              placeholder="Filter..."
              onChange={(e) => handleSearch(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
          </div>
        </Flex>
        <Table
          dataSource={dataView}
          columns={columns}
          style={{ height: 650, width: 'auto' }}
          bordered
          pagination={true}
          scroll={{ y: 500 }}
        />
      </Flex>
    </Modal>
  );
};

export default ModalView;
