import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  RightOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Flex, Table, Button, Tag, Upload, Modal, Tooltip, Input, Tabs, Pagination } from 'antd';
import { MdOutlineRefresh } from 'react-icons/md';
import {
  createFileConfirmShip,
  downloadFileConfirmShip,
  getAllClient,
  getLogs,
  getShippingBatch,
  requestExtension,
  updateTrackingFake,
} from '../../apis/socketio';
import RealtimeLogViewer from '../../components/RealtimeLogViewer';
import { MdAdd } from 'react-icons/md';
import { FcLinux } from 'react-icons/fc';
import { toast } from 'sonner';
import { ConfirmShipModal } from '../../components/ConfirmModal';
import { formatDate } from '../../utils/fomatDate';
import { formatDistanceToNow } from 'date-fns';
import { dataColors } from '../../utils/dataColors';
import { CopyOutlined, CheckCircleFilled } from '@ant-design/icons';
import StatusComponent from '../../components/StatusComponent';

const ConfirmShip = () => {
  const { collapsed } = useOutletContext();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});
  const [logs, setLogs] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.batchId === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const fetchAllClients = async () => {
    try {
      const response = await getAllClient();
      if (response.status === 200) {
        setClients(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchLogs = async (machineId) => {
    try {
      const response = await getLogs({ machineId });
      if (response.status === 200) {
        const result = response.data?.logs.map((raw) => {
          return {
            at: Number(raw.at || raw.time || Date.now()),
            shop: raw.shop,
            machineId: String(raw.machineId || ''),
            label: raw.label,
            type: raw.type || raw.level || 'info',
            message: String(raw.message || ''),
            action: raw.action,
          };
        });
        setLogs(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllClients();
  }, []);

  const fetchBatchs = async () => {
    try {
      const res = await getShippingBatch();
      if (res.status === 200) {
        setBatches(res.data?.batches);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBatchs();
  }, []);

  useEffect(() => {
    if (!selectedClient?.machineId) return;
    const fetchData = () => {
      fetchLogs(selectedClient.machineId);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedClient]);

  const handleViewDetail = (batch) => {
    setSelectedBatchId(batch.batchId);
    setIsDetailModalOpen(true);
  };

  // --- Columns ---
  const batchColumns = [
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="font-medium whitespace-nowrap">{formatDate(value)}</span>

          <span className="text-xs whitespace-nowrap" style={{ color: dataColors.title }}>
            (
            {formatDistanceToNow(value, { addSuffix: true })
              .replace(/^about /, '')
              .replace(/^less than /, '')}
            )
          </span>
        </div>
      ),
    },

    {
      title: 'Batch ID',
      dataIndex: 'batchId',
      key: 'batchId',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Box Batch ID */}
          <div
            className="text-xs font-medium whitespace-nowrap"
            style={{
              padding: '4px 12px',
              borderRadius: 100,
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
            }}
          >
            {text}
          </div>

          {/* Button Copy */}
          <Tooltip title="Copy Batch ID">
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => navigator.clipboard.writeText(text)} />
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Confirm Date',
      dataIndex: 'confirmShipDate',
      key: 'confirmShipDate',
      render: (value, record) => (
        <>
          {value ? (
            <span className="font-medium whitespace-nowrap">{formatDate(value)}</span>
          ) : (
            <>
              {record?.type === 'CONFIRM' ? (
                <span className="font-medium whitespace-nowrap">{formatDate(record?.createdAt)}</span>
              ) : (
                <StatusComponent title="N/A" color={dataColors.default} isDefault />
              )}
            </>
          )}
        </>
      ),
    },
    {
      title: 'Type File',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <StatusComponent title={type} color={type === 'UPDATE_FAKE' ? dataColors.process : dataColors.asin} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color="success"
          style={{
            borderRadius: 999,
            paddingInline: 16,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircleFilled style={{ fontSize: 12 }} />
          <span className="font-semibold">{status}</span>
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Flex gap="small">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="Download File">
            <Button icon={<DownloadOutlined />} onClick={() => downloadShippingFile(record.batchId, record.type, record.confirmShipDate)} />
          </Tooltip>
        </Flex>
      ),
    },
  ];

  const detailColumns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => <span className="font-medium text-slate-700">{text}</span>,
    },
    {
      title: 'Tracking Order',
      dataIndex: 'tracking',
      key: 'trackingOrder',
    },
    {
      title: 'Status Tracking',
      dataIndex: 'isFake',
      key: 'isFake',
      render: (isFake) => (
        <Tag icon={!isFake ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={isFake ? 'error' : 'success'}>
          <span className="font-medium">{!isFake ? 'Real Tracking' : 'Fake Tracking'}</span>
        </Tag>
      ),
    },
  ];

  const detailColumnsFake = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => <span className="font-medium text-slate-700">{text}</span>,
    },
    {
      title: 'Tracking Order',
      dataIndex: 'tracking',
      key: 'trackingOrder',
    },
    {
      title: 'Status Tracking',
      dataIndex: 'isFake',
      key: 'isFake',
      render: () => (
        <Tag icon={<CloseCircleOutlined />} color={'error'}>
          <span className="font-medium">Fake Tracking</span>
        </Tag>
      ),
    },
  ];

  const detailTabItems = useMemo(() => {
    if (!selectedBatch) return [];
    const allItems = selectedBatch.completed || [];
    const fakeItems = selectedBatch.tracking_fakes || [];

    return [
      {
        key: '1',
        label: <span className="font-medium">All Trackings ({selectedBatch?.stats?.totalOrders})</span>,
        children: (
          <Table
            className="no-indent-table "
            bordered
            dataSource={allItems}
            columns={detailColumns}
            rowKey="key"
            tableLayout="auto"
            scroll={{ y: 550 }}
          />
        ),
      },
      {
        key: '2',
        label: <span className="font-medium">Fake Trackings ({selectedBatch?.stats?.totalFake})</span>,
        children: (
          <Table
            className="no-indent-table "
            bordered
            dataSource={fakeItems}
            columns={detailColumnsFake}
            rowKey="key"
            tableLayout="auto"
            scroll={{ y: 550 }}
          />
        ),
      },
    ];
  }, [selectedBatch]);

  const uploadProps = {
    accept: '.txt',
    multiple: false,
    maxCount: 1,
    fileList,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('machineId', selectedClient.clientId);
      formData.append('label', selectedClient.label);
      try {
        const res = await createFileConfirmShip(formData);
        onSuccess?.(res.data);
        toast.success(`${file.name} uploaded success!`);
      } catch (err) {
        console.error(err);
        onError?.(err);
        toast.error(`${file.name} upload failed!`);
      } finally {
        setFileList([]); // clear nếu cần
      }
    },
    onChange(info) {
      setFileList(info.fileList);
    },
  };

  const handleUpdateTracking = async () => {
    try {
      const response = await updateTrackingFake(selectedBatch?.batchId, {
        machineId: selectedBatch.machineId,
        label: selectedBatch.label,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success(response.data?.message || 'Update tracking fake success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Error System!');
    } finally {
      fetchBatchs();
      setIsDetailModalOpen(false);
    }
  };

  const downloadShippingFile = async (batchId, type, confirmShipDate) => {
    let shipDate;
    if (type === 'UPDATE_FAKE') {
      shipDate = confirmShipDate;
    } else {
      shipDate = '';
    }
    try {
      const response = await downloadFileConfirmShip(batchId, shipDate);

      // Tạo Blob từ dữ liệu trả về
      const blob = new Blob([response.data], {
        type: 'text/tab-separated-values;charset=utf-8',
      });

      // Lấy tên file từ header nếu có
      let fileName = 'confirm_ship.txt';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?(.*)"?/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Tạo link ảo và trigger download
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.log(error);
      toast.error('Download file confirm ship error!');
    } finally {
      toast.success('Download file confirm ship success!');
    }
  };

  const handleRequestExtension = async () => {
    try {
      const response = await requestExtension({
        shopId: selectedClient?.shopId,
        machineId: selectedClient?.machineId,
        type: 'IMPORT_FBM_ORDERS',
        action: 'click',
        label: selectedClient?.label,
        payload: {},
      });

      if (response.status === 200) {
        toast.success('Request import order to extension success!');
      }
    } catch (error) {
      console.log(error);
    } finally {
      fetchLogs(selectedClient?.machineId);
    }
  };

  const handleConfirmShip = async () => {
    handleRequestExtension();
    await new Promise((resolve) => setTimeout(resolve, 60000));
  };

  const handleSearch = () => {};

  const handleCloseModal = () => {
    setIsModalOpen(false);
    fetchBatchs();
  };

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            AMZ Confirm Shipping
          </h1>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- CỘT TRÁI --- */}
          <div className="lg:col-span-1 h-full overflow-y-auto flex flex-col gap-4">
            {/* 1. Danh sách Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 overflow-y-auto">
              <h2 className="text-md font-semibold text-slate-800 mb-4">List clients online</h2>
              <Flex vertical gap={4}>
                {clients.length > 0 &&
                  clients?.map((client) => (
                    <button
                      key={client.clientId}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer text-md ${
                        selectedClient.clientId === client.clientId
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-slate-50 border-2 border-transparent hover:border-slate-300'
                      }`}
                      style={{ fontSize: 14 }}
                    >
                      <div className="w-[93%] flex justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-green-500`}></div>
                          <span className="font-medium text-slate-700">{`${client.label} (${client.shopName})`}</span>
                        </div>
                        <div style={{ color: '#8c8c8c' }}>
                          [{new Date(Number(client.connectedAt || Date.now())).toLocaleTimeString('vi-VN')}
                          {new Date(Number(client.connectedAt || Date.now())).toLocaleDateString('vi-VN')}]
                        </div>
                      </div>
                      <RightOutlined
                        className={`text-slate-400 transition-transform ${selectedClient.clientId === client.clientId ? 'rotate-90' : ''}`}
                      />
                    </button>
                  ))}
              </Flex>
            </div>
            {logs.length > 0 && <RealtimeLogViewer logs={logs} isConfirmShip={true} />}
          </div>

          {/* --- CỘT PHẢI --- */}
          <div className="lg:col-span-2 h-full overflow-y-auto">
            {selectedClient?.clientId ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-full">
                {/* Header */}
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full bg-green-500`}></div>
                    <span className="font-medium text-slate-700">{`${selectedClient.label} (${selectedClient.shopName})`}</span>
                  </div>
                  <div className="flex gap-2">
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />}>
                        <span className="font-medium">Upload Tracking</span>
                      </Button>
                    </Upload>
                    <Button icon={<MdAdd />} onClick={() => setIsModalOpen(true)}>
                      <span className="font-medium">Create Confim Ship</span>
                    </Button>
                  </div>
                </div>

                {/* Upload Batches Table */}
                <div className="">
                  <div className="flex gap-2 justify-between mb-4">
                    <div className="flex gap-2">
                      <Input
                        onChange={handleSearch}
                        style={{ width: 250 }}
                        placeholder="Search batchId..."
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-1  text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full flex-1 sm:w-auto sm:max-w-72"
                      />
                      <div>
                        <Tooltip title="Refresh">
                          <button
                            className="h-10 py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                            onClick={() => {
                              fetchBatchs();
                              toast.success('Refresh success!');
                            }}
                          >
                            <MdOutlineRefresh size={20} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div>
                      {/* <Pagination total={batches?.length} showTotal={(total) => `Total ${total} items`} defaultPageSize={9} /> */}
                    </div>
                  </div>
                  <Table
                    className="no-indent-table "
                    bordered
                    dataSource={batches}
                    columns={batchColumns}
                    rowKey="id"
                    pagination={{ defaultPageSize: 8, showTotal: (total) => `Total ${total} items` }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="flex justify-center items-center mx-auto">
                  <FcLinux size={200} className="text-4xl text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Select a client</h3>
                <p className="text-slate-600">Please select client on the left to see features</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL CHI TIẾT BATCH --- */}
      <Modal
        title={`Batch Details: ${selectedBatch?.id || ''}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={800}
        style={{ top: 40 }}
      >
        <div className="flex justify-between items-center mb-2 mt-4">
          <Input style={{ width: 250 }} placeholder="Search order.." />
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleUpdateTracking}
            disabled={selectedBatch?.tracking_fakes?.length > 0 ? false : true}
          >
            Update Fake Trackings
          </Button>
        </div>
        <Tabs defaultActiveKey="1" items={detailTabItems} />
      </Modal>
      <ConfirmShipModal open={isModalOpen} onClose={handleCloseModal} onConfirm={handleConfirmShip} />
    </div>
  );
};

export default ConfirmShip;
