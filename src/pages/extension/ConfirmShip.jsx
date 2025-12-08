import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  RightOutlined,
  UploadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Flex, Table, Button, Tag, Upload, Spin, Modal, Tooltip, Input, Tabs, Empty } from 'antd';
import { FcPortraitMode } from 'react-icons/fc';
import { getAllClient, getLogs } from '../../apis/socketio';
import RealtimeLogViewer from '../../components/RealtimeLogViewer';
import { toast } from 'sonner';

const MOCK_BATCHES = [
  {
    id: 'batch_003',
    uploadTime: '2025-11-07T14:30:00.000Z',
    items: [
      { key: '1', orderId: '114-3333333-NEWEST', trackingOrder: 'TBA_NEW_01', isReal: true },
      { key: '2', orderId: '114-4444444-NEWEST', trackingOrder: 'FAKE_NEW_01', isReal: false },
    ],
  },
  {
    id: 'batch_002',
    uploadTime: '2025-11-07T10:00:00.000Z',
    items: [
      { key: '1', orderId: '114-1111111-MID', trackingOrder: 'TBA_MID_01', isReal: true },
      { key: '2', orderId: '114-2222222-MID', trackingOrder: 'FAKE_MID_01', isReal: false },
      { key: '3', orderId: '114-3333333-MID', trackingOrder: 'FAKE_MID_02', isReal: false },
    ],
  },
  {
    id: 'batch_001',
    uploadTime: '2025-11-06T16:45:00.000Z',
    items: [{ key: '1', orderId: '114-0000001-OLD', trackingOrder: 'TBA_OLD_01', isReal: true }],
  },
];

const ConfirmShip = () => {
  const { collapsed } = useOutletContext();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});
  const [logs, setLogs] = useState([]);

  const [batches, setBatches] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingData, setEditingData] = useState([]);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || null;
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

  // Logic Load Batches & Logs khi chọn Client
  useEffect(() => {
    if (selectedClient?.clientId) {
      // Load Batches
      setIsLoadingData(true);
      setTimeout(() => {
        setBatches(MOCK_BATCHES);
        setIsLoadingData(false);
      }, 500);

      // 4. KÍCH HOẠT FETCH LOGS & POLLING
      if (selectedClient.machineId) {
        fetchLogs(selectedClient.machineId);
        const interval = setInterval(() => fetchLogs(selectedClient.machineId), 10000);
        return () => clearInterval(interval);
      }
    } else {
      setBatches([]);
      setLogs([]);
    }
  }, [selectedClient]);

  const formatDateToUI = (timeString) => {
    if (!timeString) return '';
    const d = new Date(timeString);
    return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  // --- Handlers ---
  const handleUploadFile = async (options) => {
    const { onSuccess, onError } = options;
    try {
      setTimeout(() => {
        onSuccess('Ok');
        toast.success('Upload file successfully!');
        handleRefreshData();
      }, 1000);
    } catch (err) {
      onError({ err });
      toast.error('Upload failed.');
    }
  };

  const handleRefreshData = () => {
    setIsLoadingData(true);
    setTimeout(() => {
      setBatches([...MOCK_BATCHES]);
      setIsLoadingData(false);
      toast.success('Data refreshed!');
      // Refresh cả logs
      if (selectedClient.machineId) fetchLogs(selectedClient.machineId);
    }, 800);
  };

  const handleViewDetail = (batch) => {
    setSelectedBatchId(batch.id);
    setIsDetailModalOpen(true);
  };

  const handleDownloadBatch = (batchId) => {
    toast.info(`Downloading batch ${batchId}...`);
  };

  const handleOpenUpdateModal = () => {
    if (selectedBatch) {
      const fakeItems = selectedBatch.items.filter((item) => !item.isReal);
      setEditingData(JSON.parse(JSON.stringify(fakeItems)));
      setIsUpdateModalOpen(true);
    }
  };

  const handleInputChange = (key, value) => {
    setEditingData((prev) => prev.map((item) => (item.key === key ? { ...item, trackingOrder: value } : item)));
  };

  const handleSaveTracking = () => {
    const newBatches = batches.map((batch) => {
      if (batch.id === selectedBatchId) {
        const newItems = batch.items.map((item) => {
          if (item.isReal) return item;
          const updatedItem = editingData.find((e) => e.key === item.key);
          return updatedItem || item;
        });
        return { ...batch, items: newItems };
      }
      return batch;
    });

    setBatches(newBatches);
    toast.success('Fake trackings updated successfully!');
    setIsUpdateModalOpen(false);
  };

  // --- Columns ---
  const batchColumns = [
    {
      title: 'Batch ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-medium text-slate-700">{text}</span>,
    },
    {
      title: 'Upload Time',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      render: (text) => <span>{formatDateToUI(text)}</span>,
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_, record) => <span className="font-semibold">{record.items?.length || 0}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Flex gap="small">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="Download">
            <Button icon={<DownloadOutlined />} onClick={() => handleDownloadBatch(record.id)} />
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
      dataIndex: 'trackingOrder',
      key: 'trackingOrder',
    },
    {
      title: 'Status',
      dataIndex: 'isReal',
      key: 'isReal',
      render: (isReal) => (
        <Tag icon={isReal ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={isReal ? 'success' : 'error'}>
          <span className="font-medium">{isReal ? 'Real Tracking' : 'Fake Tracking'}</span>
        </Tag>
      ),
    },
  ];

  const editColumns = [
    { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
    {
      title: 'Tracking Order',
      dataIndex: 'trackingOrder',
      key: 'trackingOrder',
      render: (text, record) => <Input value={text} onChange={(e) => handleInputChange(record.key, e.target.value)} />,
    },
  ];

  const detailTabItems = useMemo(() => {
    if (!selectedBatch) return [];
    const allItems = selectedBatch.items || [];
    const fakeItems = allItems.filter((i) => !i.isReal);

    return [
      {
        key: '1',
        label: <span className="font-medium">All Trackings ({allItems.length})</span>,
        children: <Table dataSource={allItems} columns={detailColumns} pagination={{ pageSize: 5 }} rowKey="key" size="small" />,
      },
      {
        key: '2',
        label: <span className="font-medium">Fake Trackings ({fakeItems.length})</span>,
        children: <Table dataSource={fakeItems} columns={detailColumns} pagination={{ pageSize: 5 }} rowKey="key" size="small" />,
      },
    ];
  }, [selectedBatch]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
          {/* --- CỘT TRÁI --- */}
          <div className="lg:col-span-1 h-full overflow-y-auto flex flex-col gap-4">
            {/* 1. Danh sách Client */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 max-h-[50%] overflow-y-auto">
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
                          [{new Date(Number(client.connectedAt || Date.now())).toLocaleTimeString('vi-VN')}{' '}
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

            {/* 2. Hiển thị Activity Logs (Mới thêm) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-1 overflow-hidden flex flex-col">
              <h2 className="text-md font-semibold text-slate-800 mb-3">Activity Logs</h2>
              <div className="flex-1 overflow-y-auto">
                {/* Component Log từ file index.jsx */}
                <RealtimeLogViewer logs={logs} />
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI --- */}
          <div className="lg:col-span-2 h-full overflow-y-auto">
            {selectedClient?.clientId ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full bg-green-500`}></div>
                    <span className="text-xl font-semibold text-slate-800">
                      {selectedClient.label} <span className="text-slate-500 text-sm">({selectedClient.shopName})</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Upload customRequest={handleUploadFile} showUploadList={false}>
                      <Button icon={<UploadOutlined />}>
                        <span className="font-medium">Upload Tracking</span>
                      </Button>
                    </Upload>
                    <Button icon={<SyncOutlined />} onClick={handleRefreshData}>
                      <span className="font-medium">Refresh Data</span>
                    </Button>
                  </div>
                </div>

                {/* Upload Batches Table */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase">Upload Batches History</h3>
                  {isLoadingData ? (
                    <div className="flex justify-center items-center h-40">
                      <Spin size="large" />
                    </div>
                  ) : (
                    <Table dataSource={batches} columns={batchColumns} rowKey="id" pagination={{ pageSize: 5 }} />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center h-full flex flex-col justify-center items-center">
                <FcPortraitMode size={150} className="text-4xl text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Select a client</h3>
                <p className="text-slate-600">Please select client on the left to confirm shipping</p>
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
      >
        <div className="flex justify-between items-center mb-4">
          <p className="text-slate-500">
            Upload Time: <b>{formatDateToUI(selectedBatch?.uploadTime)}</b>
          </p>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleOpenUpdateModal}
            disabled={!selectedBatch?.items?.some((i) => !i.isReal)}
          >
            Update Fake Trackings
          </Button>
        </div>
        <Tabs defaultActiveKey="1" items={detailTabItems} />
      </Modal>

      {/* --- MODAL UPDATE FAKE TRACKING --- */}
      <Modal
        title="Update Fake Trackings"
        open={isUpdateModalOpen}
        onCancel={() => setIsUpdateModalOpen(false)}
        onOk={handleSaveTracking}
        okText="Save Changes"
        width={700}
      >
        <div className="mb-4 bg-blue-50 p-3 rounded text-blue-700 text-sm">
          You are editing <b>{editingData.length}</b> fake tracking numbers. Real trackings are hidden.
        </div>
        <Table dataSource={editingData} columns={editColumns} pagination={{ pageSize: 5 }} rowKey="key" size="small" />
      </Modal>
    </div>
  );
};

export default ConfirmShip;
