import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Table, 
  Select, 
  Input, 
  DatePicker, 
  Button, 
  Card, 
  Statistic, 
  Badge, 
  Tag, 
  Tooltip, 
  Modal,
  Tabs,
  Timeline,
  Progress,
  Space,
  Drawer
} from 'antd';
import { 
  ReloadOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { 
  getExtensionLogs, 
  getExtensionStats, 
  getAllExtensionLogs, 
  getLogsByTask, 
  getLogsByBatch,
  cleanupLogs 
} from '../../apis/extensionLogs';
import { getALlShop } from '../../apis/order';
import './LogManager.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const LogManager = () => {
  const { collapsed } = useOutletContext();
  
  // States
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeExtensions, setActiveExtensions] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [filters, setFilters] = useState({
    limit: 100,
    hours: 24,
    logType: '',
    level: '',
    taskType: '',
    batchId: ''
  });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskLogs, setTaskLogs] = useState([]);

  // Constants
  const LOG_TYPES = {
    'task_received': 'Extension nhận task từ server',
    'task_processing': 'Đang xử lý task', 
    'task_completed': 'Hoàn thành task',
    'task_failed': 'Task thất bại',
    'upload_started': 'Bắt đầu upload',
    'upload_progress': 'Tiến trình upload',
    'upload_completed': 'Upload thành công',
    'upload_failed': 'Upload thất bại',
    'connection_status': 'Trạng thái kết nối',
    'error': 'Lỗi general',
    'info': 'Thông tin general',
    'debug': 'Debug info'
  };

  const LOG_LEVELS = {
    'debug': { color: 'default', icon: <InfoCircleOutlined /> },
    'info': { color: 'blue', icon: <InfoCircleOutlined /> },
    'warn': { color: 'orange', icon: <ExclamationCircleOutlined /> },
    'error': { color: 'red', icon: <ExclamationCircleOutlined /> }
  };

  // Utility functions
  const formatTimestamp = useCallback((timestamp) => {
    return dayjs(timestamp).format('DD/MM/YYYY HH:mm:ss');
  }, []);

  const getLogTypeColor = useCallback((logType) => {
    const colorMap = {
      'task_completed': 'green',
      'upload_completed': 'green',
      'task_failed': 'red',
      'upload_failed': 'red',
      'task_processing': 'blue',
      'upload_progress': 'blue',
      'task_received': 'cyan',
      'upload_started': 'cyan',
      'connection_status': 'purple',
      'error': 'red',
      'info': 'blue',
      'debug': 'default'
    };
    return colorMap[logType] || 'default';
  }, []);

  // API calls
  const fetchShops = useCallback(async () => {
    try {
      const response = await getALlShop({ merchant: 'amazon' });
      if (response.status === 200) {
        setShops(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (selectedMachine === 'all') {
        response = await getAllExtensionLogs(filters);
        if (response.data?.success) {
          setLogs(response.data.message.logs || []);
          setActiveExtensions(response.data.message.activeExtensions || []);
        }
      } else {
        // Kiểm tra xem selectedMachine là shopId hay machineId
        const isShopId = shops.some(shop => shop._id === selectedMachine);
        
        if (isShopId) {
          // Nếu là shopId, gọi API với filter shopId
          const shopFilters = { ...filters, shopId: selectedMachine };
          response = await getAllExtensionLogs(shopFilters);
        } else {
          // Nếu là machineId, gọi API theo machineId
          response = await getExtensionLogs(selectedMachine, filters);
        }
        
        if (response.data?.success) {
          setLogs(response.data.message.logs || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Không thể tải logs');
    } finally {
      setLoading(false);
    }
  }, [selectedMachine, filters, shops]);

  const fetchStats = useCallback(async () => {
    if (selectedMachine === 'all') return;
    
    try {
      // Kiểm tra xem selectedMachine là shopId hay machineId
      const isShopId = shops.some(shop => shop._id === selectedMachine);
      let response;
      
      if (isShopId) {
        // Nếu là shopId, gọi API stats với filter shopId
        const statsFilters = { hours: filters.hours, shopId: selectedMachine };
        response = await getAllExtensionLogs(statsFilters);
        // Tạo stats từ logs data (vì không có API stats riêng cho shopId)
        if (response.data?.success) {
          const logs = response.data.message.logs || [];
          const mockStats = {
            summary: {
              totalLogs: logs.length,
              errorCount: logs.filter(log => log.level === 'error').length,
              taskSuccessRate: `${Math.round((logs.filter(log => log.logType.includes('completed')).length / Math.max(logs.length, 1)) * 100)}%`,
              tasksCompleted: logs.filter(log => log.logType.includes('completed')).length
            }
          };
          setStats(mockStats);
        }
      } else {
        // Nếu là machineId, gọi API stats bình thường
        response = await getExtensionStats(selectedMachine, { hours: filters.hours });
        if (response.data?.success) {
          setStats(response.data.message);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [selectedMachine, filters.hours, shops]);

  const fetchTaskLogs = useCallback(async (taskId) => {
    try {
      const response = await getLogsByTask(taskId);
      if (response.data?.success) {
        setTaskLogs(response.data.message.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch task logs:', error);
      toast.error('Không thể tải task logs');
    }
  }, []);

  // Event handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleMachineChange = useCallback((value) => {
    setSelectedMachine(value);
    setStats(null);
  }, []);

  const handleViewDetail = useCallback((log) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  }, []);

  const handleViewTask = useCallback(async (taskId) => {
    setSelectedTaskId(taskId);
    setTaskDrawerOpen(true);
    await fetchTaskLogs(taskId);
  }, [fetchTaskLogs]);

  const handleCleanup = useCallback(async () => {
    Modal.confirm({
      title: 'Xác nhận xóa logs',
      content: 'Bạn có chắc muốn xóa logs cũ hơn 30 ngày?',
      onOk: async () => {
        try {
          const isShopId = shops.some(shop => shop._id === selectedMachine);
          const cleanupData = { 
            days: 30,
            ...(selectedMachine === 'all' ? {} : 
                isShopId ? { shopId: selectedMachine } : { machineId: selectedMachine })
          };
          
          const response = await cleanupLogs(cleanupData);
          if (response.data?.success) {
            toast.success(`Đã xóa ${response.data.message.deletedCount} logs`);
            fetchLogs();
          }
        } catch (error) {
          toast.error('Không thể xóa logs');
        }
      }
    });
  }, [selectedMachine, fetchLogs, shops]);

  // Table columns
  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (timestamp) => (
        <div className="text-xs">
          {formatTimestamp(timestamp)}
        </div>
      ),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Machine/Shop',
      dataIndex: 'machineId',
      key: 'machineId',
      width: 140,
      render: (machineId, record) => {
        // Tìm shop tương ứng từ danh sách shops
        const shop = shops.find(s => s._id === record.shopId);
        return (
          <div>
            <div className="font-medium text-xs">🖥️ {machineId}</div>
            <div className="text-xs text-gray-500">🏪 {shop?.name || record.shopName || 'Unknown Shop'}</div>
          </div>
        );
      }
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => {
        const levelInfo = LOG_LEVELS[level] || LOG_LEVELS.info;
        return (
          <Tag color={levelInfo.color} icon={levelInfo.icon}>
            {level?.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Type',
      dataIndex: 'logType',
      key: 'logType',
      width: 120,
      render: (logType) => (
        <Tag color={getLogTypeColor(logType)}>
          {logType}
        </Tag>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message, record) => (
        <div>
          <div className="text-sm">{message}</div>
          {record.taskInfo?.taskId && (
            <div className="text-xs text-blue-500 cursor-pointer" 
                 onClick={() => handleViewTask(record.taskInfo.taskId)}>
              Task: {record.taskInfo.taskId}
            </div>
          )}
          {record.taskInfo?.batchId && (
            <div className="text-xs text-gray-500">
              Batch: {record.taskInfo.batchId}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 100,
      render: (_, record) => {
        if (!record.performance) return '—';
        return (
          <div className="text-xs">
            {record.performance.duration && (
              <div>⏱️ {record.performance.duration}ms</div>
            )}
            {record.performance.memoryUsage && (
              <div>💾 {record.performance.memoryUsage}MB</div>
            )}
            {record.performance.cpuUsage && (
              <div>🖥️ {record.performance.cpuUsage}%</div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail(record)}
        />
      )
    }
  ];

  // Effects
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (selectedMachine !== 'all') {
      fetchStats();
    }
  }, [fetchStats]);

  // Memoized values
  const statsCards = useMemo(() => {
    if (!stats) return [];
    
    return [
      {
        title: 'Total Logs',
        value: stats.summary?.totalLogs || 0,
        color: '#1890ff'
      },
      {
        title: 'Error Count',
        value: stats.summary?.errorCount || 0,
        color: '#ff4d4f'
      },
      {
        title: 'Success Rate',
        value: stats.summary?.taskSuccessRate || '0%',
        color: '#52c41a'
      },
      {
        title: 'Tasks Completed',
        value: stats.summary?.tasksCompleted || 0,
        color: '#722ed1'
      }
    ];
  }, [stats]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0 flex items-center gap-2" style={{ color: 'black' }}>
            <BarChartOutlined />
            Extension Log Manager
          </h1>
          <div className="flex items-center gap-2">
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={fetchLogs}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<DeleteOutlined />}
              onClick={handleCleanup}
            >
              Cleanup
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4 h-full">
        {/* Stats Cards */}
        {selectedMachine !== 'all' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {statsCards.map((stat, index) => (
              <Card key={index} size="small">
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            ))}
          </div>
        )}

        {/* Quick Filters */}
        <Card className="mb-4" size="small">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              size="small" 
              type={filters.level === 'error' ? 'primary' : 'default'}
              onClick={() => handleFilterChange('level', filters.level === 'error' ? '' : 'error')}
            >
              🔴 Errors Only
            </Button>
            <Button 
              size="small" 
              type={filters.logType === 'task_failed' ? 'primary' : 'default'}
              onClick={() => handleFilterChange('logType', filters.logType === 'task_failed' ? '' : 'task_failed')}
            >
              ❌ Failed Tasks
            </Button>
            <Button 
              size="small" 
              type={filters.logType === 'upload_completed' ? 'primary' : 'default'}
              onClick={() => handleFilterChange('logType', filters.logType === 'upload_completed' ? '' : 'upload_completed')}
            >
              ✅ Upload Success
            </Button>
            <Button 
              size="small" 
              type={filters.hours === 1 ? 'primary' : 'default'}
              onClick={() => handleFilterChange('hours', filters.hours === 1 ? 24 : 1)}
            >
              ⏰ Last Hour
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <Select
              placeholder="Chọn Shop"
              value={selectedMachine}
              onChange={handleMachineChange}
              style={{ width: '100%' }}
            >
              <Option value="all">🌐 Tất cả Shops</Option>
              {shops.map(shop => {
                // Kiểm tra xem shop này có active extension không
                const activeExt = activeExtensions.find(ext => ext.shopId === shop._id);
                return (
                  <Option key={shop._id} value={shop._id}>
                    🏪 {shop.name} {activeExt ? '🟢' : '⚪'}
                  </Option>
                );
              })}
            </Select>

            <Select
              placeholder="Limit"
              value={filters.limit}
              onChange={(value) => handleFilterChange('limit', value)}
              style={{ width: '100%' }}
            >
              <Option value={50}>50 logs</Option>
              <Option value={100}>100 logs</Option>
              <Option value={500}>500 logs</Option>
            </Select>

            <Select
              placeholder="Log Type"
              value={filters.logType}
              onChange={(value) => handleFilterChange('logType', value)}
              allowClear
            >
              {Object.entries(LOG_TYPES).map(([key, label]) => (
                <Option key={key} value={key}>{key}</Option>
              ))}
            </Select>

            <Select
              placeholder="Level"
              value={filters.level}
              onChange={(value) => handleFilterChange('level', value)}
              allowClear
            >
              {Object.keys(LOG_LEVELS).map(level => (
                <Option key={level} value={level}>{level.toUpperCase()}</Option>
              ))}
            </Select>

            <Select
              placeholder="Thời gian"
              value={filters.hours}
              onChange={(value) => handleFilterChange('hours', value)}
            >
              <Option value={1}>1 giờ</Option>
              <Option value={6}>6 giờ</Option>
              <Option value={24}>24 giờ</Option>
              <Option value={72}>3 ngày</Option>
              <Option value={168}>7 ngày</Option>
            </Select>

            <Input
              placeholder="Task ID"
              value={filters.taskType}
              onChange={(e) => handleFilterChange('taskType', e.target.value)}
              prefix={<SearchOutlined />}
            />

            <Input
              placeholder="Batch ID"
              value={filters.batchId}
              onChange={(e) => handleFilterChange('batchId', e.target.value)}
              prefix={<SearchOutlined />}
            />
          </div>
        </Card>

        {/* Active Extensions Overview */}
        {selectedMachine === 'all' && activeExtensions.length > 0 && (
          <Card title={`Active Extensions (${activeExtensions.length})`} className="mb-4" size="small">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeExtensions.map(ext => {
                // Tìm shop tương ứng từ danh sách shops
                const shop = shops.find(s => s._id === ext.shopId || s._id === ext._id);
                return (
                  <div key={ext._id} className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                       onClick={() => handleMachineChange(ext.shopId || ext._id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">
                          🖥️ {ext._id}
                        </div>
                        <div className="text-xs text-gray-500">
                          🏪 {shop?.name || ext.shopName || 'Unknown Shop'}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          📊 {ext.logCount} logs
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        <div>🕒 {formatTimestamp(ext.lastActivity)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Main Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={logs}
            loading={loading}
            rowKey="_id"
            size="small"
            pagination={{
              pageSize: filters.limit,
              showSizeChanger: true,
              pageSizeOptions: ['50', '100', '500'],
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} logs (Limit: ${filters.limit})`,
              onShowSizeChange: (current, size) => {
                handleFilterChange('limit', size);
              }
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* Detail Modal */}
        <Modal
          title="Chi tiết Log"
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={800}
        >
          {selectedLog && (
            <Tabs defaultActiveKey="1">
              <TabPane tab="Thông tin chính" key="1">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Machine ID:</strong> {selectedLog.machineId}
                    </div>
                    <div>
                      <strong>Shop:</strong> {(() => {
                        const shop = shops.find(s => s._id === selectedLog.shopId);
                        return shop?.name || selectedLog.shopName || 'Unknown Shop';
                      })()}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {formatTimestamp(selectedLog.timestamp)}
                    </div>
                    <div>
                      <strong>Level:</strong> 
                      <Tag color={LOG_LEVELS[selectedLog.level]?.color} className="ml-2">
                        {selectedLog.level?.toUpperCase()}
                      </Tag>
                    </div>
                    <div>
                      <strong>Type:</strong>
                      <Tag color={getLogTypeColor(selectedLog.logType)} className="ml-2">
                        {selectedLog.logType}
                      </Tag>
                    </div>
                  </div>
                  <div>
                    <strong>Message:</strong>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      {selectedLog.message}
                    </div>
                  </div>
                </div>
              </TabPane>

              {selectedLog.taskInfo && (
                <TabPane tab="Task Info" key="2">
                  <div className="space-y-2">
                    <div><strong>Task ID:</strong> {selectedLog.taskInfo.taskId}</div>
                    <div><strong>Task Type:</strong> {selectedLog.taskInfo.taskType}</div>
                    <div><strong>Batch ID:</strong> {selectedLog.taskInfo.batchId}</div>
                    <div><strong>Orders Count:</strong> {selectedLog.taskInfo.ordersCount}</div>
                    <div><strong>Filename:</strong> {selectedLog.taskInfo.filename}</div>
                  </div>
                </TabPane>
              )}

              {selectedLog.uploadInfo && (
                <TabPane tab="Upload Info" key="3">
                  <div className="space-y-2">
                    <div><strong>Filename:</strong> {selectedLog.uploadInfo.filename}</div>
                    {selectedLog.uploadInfo.fileSize && (
                      <div><strong>File Size:</strong> {selectedLog.uploadInfo.fileSize} bytes</div>
                    )}
                    {selectedLog.uploadInfo.ordersUploaded !== undefined && (
                      <div><strong>Orders Uploaded:</strong> {selectedLog.uploadInfo.ordersUploaded}</div>
                    )}
                    {selectedLog.uploadInfo.carrier && (
                      <div><strong>Carrier:</strong> {selectedLog.uploadInfo.carrier}</div>
                    )}
                    {selectedLog.uploadInfo.shipMethod && (
                      <div><strong>Ship Method:</strong> {selectedLog.uploadInfo.shipMethod}</div>
                    )}
                    {selectedLog.uploadInfo.progress !== undefined && (
                      <div>
                        <strong>Progress:</strong>
                        <Progress percent={selectedLog.uploadInfo.progress} className="ml-2" />
                      </div>
                    )}
                  </div>
                </TabPane>
              )}

              {selectedLog.performance && (
                <TabPane tab="Performance" key="4">
                  <div className="space-y-2">
                    {selectedLog.performance.duration && (
                      <div><strong>Duration:</strong> {selectedLog.performance.duration}ms</div>
                    )}
                    {selectedLog.performance.memoryUsage && (
                      <div><strong>Memory Usage:</strong> {selectedLog.performance.memoryUsage}MB</div>
                    )}
                    {selectedLog.performance.cpuUsage && (
                      <div><strong>CPU Usage:</strong> {selectedLog.performance.cpuUsage}%</div>
                    )}
                  </div>
                </TabPane>
              )}

              {selectedLog.errorInfo && (
                <TabPane tab="Error Info" key="5">
                  <div className="space-y-2">
                    <div><strong>Error Code:</strong> {selectedLog.errorInfo.errorCode}</div>
                    <div><strong>Error Message:</strong> {selectedLog.errorInfo.errorMessage}</div>
                    {selectedLog.errorInfo.stackTrace && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                          {selectedLog.errorInfo.stackTrace}
                        </pre>
                      </div>
                    )}
                    {selectedLog.errorInfo.context && (
                      <div>
                        <strong>Context:</strong>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs">
                          {JSON.stringify(selectedLog.errorInfo.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </TabPane>
              )}

              {selectedLog.rawData && (
                <TabPane tab="Raw Data" key="6">
                  <div className="space-y-2">
                    <strong>Raw Data:</strong>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(selectedLog.rawData, null, 2)}
                    </pre>
                  </div>
                </TabPane>
              )}

              {selectedLog.metadata && (
                <TabPane tab="Metadata" key="7">
                  <div className="space-y-2">
                    {selectedLog.metadata.extensionVersion && (
                      <div><strong>Extension Version:</strong> {selectedLog.metadata.extensionVersion}</div>
                    )}
                    {selectedLog.metadata.browserInfo && (
                      <div><strong>Browser Info:</strong> {selectedLog.metadata.browserInfo}</div>
                    )}
                    {selectedLog.metadata.userAgent && (
                      <div><strong>User Agent:</strong> {selectedLog.metadata.userAgent}</div>
                    )}
                    {selectedLog.metadata.sessionId && (
                      <div><strong>Session ID:</strong> {selectedLog.metadata.sessionId}</div>
                    )}
                    <div>
                      <strong>Full Metadata:</strong>
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                </TabPane>
              )}
            </Tabs>
          )}
        </Modal>

        {/* Task Drawer */}
        <Drawer
          title={`Task Logs: ${selectedTaskId}`}
          placement="right"
          onClose={() => setTaskDrawerOpen(false)}
          open={taskDrawerOpen}
          width={600}
        >
          <Timeline>
            {taskLogs.map(log => (
              <Timeline.Item
                key={log._id}
                color={getLogTypeColor(log.logType)}
                dot={LOG_LEVELS[log.level]?.icon}
              >
                <div className="text-xs text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </div>
                <div className="font-medium">{log.logType}</div>
                <div className="text-sm">{log.message}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Drawer>
      </div>
    </div>
  );
};

export default LogManager;