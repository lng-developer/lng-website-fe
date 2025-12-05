import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  RightOutlined,
  UploadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Flex, Table, Tabs, Button, Tag, Upload, Empty, Spin } from 'antd';
import { FcLinux, FcPortraitMode } from 'react-icons/fc';
import { getAllClient } from '../../apis/socketio';
import { toast } from 'sonner';

const MOCK_BATCHES = [
  {
    id: 'batch_003',
    uploadTime: '2025-11-07T14:30:00.000Z', // Mới nhất
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
    uploadTime: '2025-11-06T16:45:00.000Z', // Cũ nhất
    items: [{ key: '1', orderId: '114-0000001-OLD', trackingOrder: 'TBA_OLD_01', isReal: true }],
  },
];

const ConfirmShip = () => {
  const { collapsed } = useOutletContext();

  // State cột trái
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState({});

  // State cột phải
  const [batches, setBatches] = useState([]); // Danh sách các đợt upload
  const [selectedBatchId, setSelectedBatchId] = useState(null); // Đợt đang chọn
  const [isLoadingData, setIsLoadingData] = useState(false);

  // --- Fetch Clients ---
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

  useEffect(() => {
    fetchAllClients();
  }, []);

  // --- Logic Load Batches khi chọn Client ---
  useEffect(() => {
    if (selectedClient?.clientId) {
      setIsLoadingData(true);
      // Giả lập gọi API lấy danh sách batch của client
      setTimeout(() => {
        setBatches(MOCK_BATCHES);
        // Mặc định chọn batch đầu tiên (mới nhất)
        if (MOCK_BATCHES.length > 0) {
          setSelectedBatchId(MOCK_BATCHES[0].id);
        }
        setIsLoadingData(false);
      }, 500);
    } else {
      setBatches([]);
      setSelectedBatchId(null);
    }
  }, [selectedClient]);

  // Lấy dữ liệu của batch đang chọn
  const currentBatchData = useMemo(() => {
    if (!selectedBatchId) return [];
    const batch = batches.find((b) => b.id === selectedBatchId);
    return batch ? batch.items : [];
  }, [batches, selectedBatchId]);

  // Helper format ngày giờ
  const formatDateToUI = (timeString) => {
    if (!timeString) return '';
    const d = new Date(timeString);
    return `${d.toLocaleTimeString('vi-VN')} - ${d.toLocaleDateString('vi-VN')}`;
  };

  // --- Handlers ---

  // 1. Upload Handler (Chỉ gọi API, không xử lý file frontend)
  const handleUploadFile = async (options) => {
    const { onSuccess, onError, file } = options;

    // Giả lập gọi API Upload
    try {
      // const formData = new FormData();
      // formData.append('file', file);
      // await apiUpload(formData); <-- Gọi API thật ở đây

      setTimeout(() => {
        onSuccess('Ok');
        toast.success('Upload file successfully!');
        // Sau khi upload thành công thì nên refresh lại data
        handleRefreshData();
      }, 1000);
    } catch (err) {
      onError({ err });
      toast.error('Upload failed.');
    }
  };

  // 2. Refresh/Update Handler
  const handleRefreshData = () => {
    setIsLoadingData(true);
    // Giả lập reload data
    setTimeout(() => {
      // Ở đây bạn sẽ gọi lại API lấy danh sách batch mới nhất
      setBatches([...MOCK_BATCHES]); // Set lại state để trigger render
      setIsLoadingData(false);
      toast.success('Data refreshed!');
    }, 800);
  };

  // Cấu hình cột bảng
  const columns = [
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

  // Tab items
  const tabItems = [
    {
      key: '1',
      label: <span className="font-medium">Real Trackings ({currentBatchData.filter((i) => i.isReal).length})</span>,
      children: <Table dataSource={currentBatchData.filter((item) => item.isReal)} columns={columns} pagination={false} rowKey="key" />,
    },
    {
      key: '2',
      label: <span className="font-medium">Fake Trackings ({currentBatchData.filter((i) => !i.isReal).length})</span>,
      children: <Table dataSource={currentBatchData.filter((item) => !item.isReal)} columns={columns} pagination={false} rowKey="key" />,
    },
  ];

  return (
    <div>
      {/* Header */}
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
          <div className="lg:col-span-1 h-full overflow-y-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-full">
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
                          {/* Format date cột trái giữ nguyên như file cũ của bạn */}[
                          {new Date(Number(client.connectedAt || Date.now())).toLocaleTimeString('vi-VN')}{' '}
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
          </div>

          {/* --- CỘT PHẢI --- */}
          <div className="lg:col-span-2 h-full overflow-y-auto">
            {selectedClient?.clientId ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-full">
                {/* 1. Header Client Name */}
                <div className="flex items-center justify-between mb-4 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full bg-green-500`}></div>
                    <span className="text-xl font-semibold text-slate-800">
                      {selectedClient.label} <span className="text-slate-500 text-sm">({selectedClient.shopName})</span>
                    </span>
                  </div>

                  {/* Buttons Action */}
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

                {/* 2. Upload Batches List (Horizontal Scroll) */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase">Upload Batches</h3>
                  {batches.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {batches.map((batch) => (
                        <div
                          key={batch.id}
                          onClick={() => setSelectedBatchId(batch.id)}
                          className={`
                                        cursor-pointer px-4 py-3 rounded-lg border flex flex-col min-w-[160px] transition-all
                                        ${
                                          selectedBatchId === batch.id
                                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-blue-300'
                                        }
                                    `}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <ClockCircleOutlined className={selectedBatchId === batch.id ? 'text-blue-500' : 'text-slate-400'} />
                            <span className={`font-semibold text-sm ${selectedBatchId === batch.id ? 'text-blue-700' : 'text-slate-700'}`}>
                              {formatDateToUI(batch.uploadTime)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">ID: {batch.id}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty description="No upload batches found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>

                {/* 3. Main Data Tabs */}
                {isLoadingData ? (
                  <div className="flex justify-center items-center h-40">
                    <Spin size="large" />
                  </div>
                ) : (
                  <Tabs defaultActiveKey="1" items={tabItems} />
                )}
              </div>
            ) : (
              // Empty State
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center h-full flex flex-col justify-center items-center">
                <FcPortraitMode size={150} className="text-4xl text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Select a client</h3>
                <p className="text-slate-600">Please select client on the left to confirm shipping</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmShip;
