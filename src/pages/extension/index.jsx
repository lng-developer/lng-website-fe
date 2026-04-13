import { useState, useEffect } from 'react';
import { RightOutlined, ThunderboltOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { TbDatabaseImport } from 'react-icons/tb';
import { DatePicker, Flex, Spin, Switch } from 'antd';
import { getAllClient, getLogs, pullAll, requestExtension } from '../../apis/socketio';
import RealtimeLogViewer from '../../components/RealtimeLogViewer';
import { toast } from 'sonner';
import { FcLinux } from 'react-icons/fc';
import { FcCurrencyExchange } from 'react-icons/fc';
import { FcAlarmClock } from 'react-icons/fc';

const ExtensionManager = () => {
  const { collapsed } = useOutletContext();
  const [selectedClient, setSelectedClient] = useState({});
  const [dateInput, setDateInput] = useState('');
  const [clients, setClients] = useState([]);
  const [isLoadingImportOrder, setIsLoadingImportOrder] = useState(false);
  const [isLoadingImportAds, setIsLoadingImportAds] = useState(false);
  const [logs, setLogs] = useState([]);

  // Helper functions for status display
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'maybe-online':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'maybe-online':
        return 'Maybe Online';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'maybe-online':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImportOrder = async (client) => {
    setIsLoadingImportOrder(true);
    try {
      console.log("Checklog :",client)
      const response = await requestExtension({
        shopId: client?.shopId,
        machineId: client?.machineId,
        type: 'IMPORT_ORDERS',
        action: 'click',
        label: client?.label,
        payload: {},
      });

      if (response.status === 200) {
        toast.success('Request import order to extension success!');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingImportOrder(false);
      fetchLogs(selectedClient?.machineId);
    }
  };

  const handleImportAdsSpend = async (client) => {
    setIsLoadingImportAds(true);
    try {
      const response = await requestExtension({
        shopId: client?.shopId,
        machineId: client?.machineId,
        type: 'IMPORT_ADS_SPEND',
        action: 'click',
        label: client?.label,
        payload: {
          date: dateInput,
        },
      });

      if (response.status === 200) {
        toast.success('Request import order to extension success!');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingImportAds(false);
      fetchLogs(selectedClient?.machineId);
    }
  };

  const handleImportAllOrder = async () => {
    try {
      const response = await pullAll({
        type: 'PULL_ALL',
        action: 'click',
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

  const formatDateToUI = (time) => {
    const ts = Number(time || Date.now());
    const d = new Date(ts);
    const timeText = d.toLocaleTimeString('vi-VN');
    const dateText = d.toLocaleDateString('vi-VN');

    return `[${timeText} ${dateText}]`;
  };

  const fetchAllClients = async () => {
    try {
      const response = await getAllClient();
      if (response.status === 200) {
        console.log("CHECK :",response)
        // Đảm bảo data luôn là array - access clients property from response
        const clientsData = Array.isArray(response.data?.clients) ? response.data.clients : [];
        setClients(clientsData);
      }
    } catch (error) {
      console.log(error);
      // Set empty array khi có lỗi
      setClients([]);
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

  useEffect(() => {
    if (!selectedClient?.machineId) return;
    const fetchData = () => {
      fetchLogs(selectedClient.machineId);
    };
    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [selectedClient]);

  // Auto refresh clients list every 15 seconds to track status changes
  useEffect(() => {
    const fetchClientsData = () => {
      fetchAllClients();
    };
    
    const interval = setInterval(fetchClientsData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Manage Clients
          </h1>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="mb-4">
          <p className="text-slate-600 font-medium text-md">Manage data import for clients</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md font-semibold text-slate-800">List clients online</h2>
                
                {/* Status Summary */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-600 font-medium">{Array.isArray(clients) ? clients.filter(c => c.status === 'online').length : 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-yellow-600 font-medium">{Array.isArray(clients) ? clients.filter(c => c.status === 'maybe-online').length : 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-600 font-medium">{Array.isArray(clients) ? clients.filter(c => c.status === 'offline').length : 0}</span>
                  </div>
                </div>
              </div>
              
              <Flex vertical gap={4}>
                {Array.isArray(clients) && clients.length > 0 &&
                  clients?.map((client) => (
                    <button
                      key={client.clientId}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full p-4 rounded-lg transition-all cursor-pointer text-md ${
                        selectedClient.clientId === client.clientId
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-slate-50 border-2 border-transparent hover:border-slate-300'
                      }`}
                      style={{ fontSize: 14 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)} animate-pulse`}></div>
                          <span className="font-medium text-slate-700">{`${client.label} (${client.shopName})`}</span>
                        </div>
                        <RightOutlined
                          className={`text-slate-400 transition-transform ${selectedClient.clientId === client.clientId ? 'rotate-90' : ''}`}
                        />
                      </div>
                      
                      {/* Status Row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full font-medium ${getStatusBadgeStyle(client.status)}`}>
                            {getStatusText(client.status)}
                          </span>
                          {client.statusSummary && (
                            <span className="text-slate-500">
                              {client.status === 'online' 
                                ? `Online: ${Math.floor(client.statusSummary.onlineForSec / 60)}m`
                                : `Idle: ${Math.floor(client.statusSummary.idleForSec / 60)}m`
                              }
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400">
                          {formatDateToUI(client.connectedAt)}
                        </div>
                      </div>
                    </button>
                  ))}
              </Flex>
            </div>

            {/* Import All Orders Button */}
            <button
              onClick={handleImportAllOrder}
              className="w-full text-md mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              style={{ marginTop: 10, color: 'white', fontSize: 15 }}
            >
              <ThunderboltOutlined className="text-md" />
              Import Orders (All Clients)
            </button>
          </div>

          {/* Actions Panel */}
          <div className="lg:col-span-2">
            {Object.keys(selectedClient).length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(selectedClient.status)} animate-pulse`}></div>
                  <span className="text-md font-semibold text-slate-800">
                    {selectedClient.label} ({selectedClient.shopName})
                  </span>
                </div>

                <div className="flex justify-between gap-3 mb-3">
                  {/* Import Order */}
                  <div className="w-full border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <CloudDownloadOutlined style={{ fontSize: 30, color: '#1890ff', marginTop: 5 }} />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-800 mb-2" style={{ fontSize: 15 }}>
                            Import Order
                          </span>
                          <p className="text-sm text-slate-600 mb-3">Import order data from Amazon system</p>

                          <button
                            onClick={() => handleImportOrder(selectedClient)}
                            className="w-[100px] h-[30px] flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md font-medium transition-colors cursor-pointer"
                            style={{ fontSize: 14, color: 'white' }}
                          >
                            {isLoadingImportOrder ? (
                              <Spin size="small" />
                            ) : (
                              <>
                                <TbDatabaseImport />
                                <span>Import</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Import Ads Spend */}
                  <div className="w-full border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <FcCurrencyExchange size={30} style={{ fontSize: 30, marginTop: 5 }} />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-800 mb-2" style={{ fontSize: 15 }}>
                            Import Ads Spend
                          </span>
                          <p className="text-sm text-slate-600 mb-3">Enter advertising costs by day</p>
                          <div className="flex gap-4">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <DatePicker onChange={(date, dateString) => setDateInput(dateString)} />
                              </div>
                            </div>
                            <button
                              onClick={() => handleImportAdsSpend(selectedClient)}
                              className="w-[100px] h-[30px] flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md font-medium transition-colors cursor-pointer"
                              style={{ fontSize: 14, color: 'white' }}
                            >
                              {isLoadingImportAds ? (
                                <Spin size="small" />
                              ) : (
                                <>
                                  <TbDatabaseImport />
                                  <span>Import</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Auto Import Order */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FcAlarmClock style={{ fontSize: 30, color: '#1890ff' }} />
                      <div>
                        <span className="font-semibold text-slate-800 mb-1" style={{ fontSize: 15 }}>
                          Auto Import Order
                        </span>
                        <div className="text-sm text-slate-600">Running at 0:00, 4:00, 8:00, 12:00, 16:00, 20:00</div>
                      </div>
                    </div>
                    <Switch checked disabled />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Activity Logs</h3>
                  <div>
                    <RealtimeLogViewer logs={logs} />
                  </div>
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
    </div>
  );
};

export default ExtensionManager;
