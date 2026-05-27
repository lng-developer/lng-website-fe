import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
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
    limit: 50,
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
  const tableWrapRef = useRef(null);
  const [tableBodyHeight, setTableBodyHeight] = useState(400);

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
      const response = await getALlShop();
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
        <div className="lm-cell-time">
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
      width: 200,
      render: (machineId, record) => {
        // Tìm shop tương ứng từ danh sách shops
        const shop = shops.find(s => s._id === record.shopId);
        return (
          <div>
            <div className="lm-cell-machine">{machineId}</div>
            <div className="lm-cell-shop">{shop?.name || record.shopName || 'Unknown Shop'}</div>
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
          <div className="lm-cell-message">{message}</div>
          {record.taskInfo?.taskId && (
            <div className="lm-cell-task-link"
              onClick={() => handleViewTask(record.taskInfo.taskId)}>
              Task: {record.taskInfo.taskId}
            </div>
          )}
          {record.taskInfo?.batchId && (
            <div className="lm-cell-batch">
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
        if (!record.performance) return <span className="lm-cell-perf">—</span>;
        return (
          <div className="lm-cell-perf">
            {record.performance.duration && (
              <div>{record.performance.duration} ms</div>
            )}
            {record.performance.memoryUsage && (
              <div>{record.performance.memoryUsage} MB</div>
            )}
            {record.performance.cpuUsage && (
              <div>{record.performance.cpuUsage}% CPU</div>
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

  useLayoutEffect(() => {
    const update = () => {
      if (!tableWrapRef.current) return;
      const rect = tableWrapRef.current.getBoundingClientRect();
      // Trừ header của table (~30px) + pagination (~48px) + padding
      const reserved = 30 + 48 + 16;
      setTableBodyHeight(Math.max(220, Math.floor(window.innerHeight - rect.top - reserved)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [selectedMachine, stats, activeExtensions.length]);

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

  const statAccentClass = ['lm-stat-total', 'lm-stat-error', 'lm-stat-success', 'lm-stat-tasks'];

  return (
    <div className="log-manager">
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 transition-all duration-300`}>
        <div className="lm-header sticky top-0 flex items-center justify-between">
          <h1 className="lm-title">
            <BarChartOutlined />
            Extension Log Manager
          </h1>
          <div className="flex items-center gap-2">
            <Button
              className="lm-btn-primary"
              type="primary"
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchLogs}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              className="lm-btn-ghost"
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleCleanup}
            >
              Cleanup
            </Button>
          </div>
        </div>
      </div>

      <div className="lm-content mt-[48px]">
        {/* Stats Cards */}
        {/* {selectedMachine !== 'all' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {statsCards.map((stat, index) => (
              <Card key={index} className={`lm-stat ${statAccentClass[index] || ''}`} size="small">
                <Statistic
                  title={stat.title}
                  value={stat.value}
                />
              </Card>
            ))}
          </div>
        )} */}

        {/* Quick Filters */}
        <Card className="lm-card" size="small">
          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              size="small"
              className={`lm-chip ${filters.level === 'error' ? 'lm-chip-active' : ''}`}
              onClick={() => handleFilterChange('level', filters.level === 'error' ? '' : 'error')}
            >
              <span className="lm-chip-dot lm-chip-dot-danger" />
              Errors Only
            </Button>
            <Button
              size="small"
              className={`lm-chip ${filters.logType === 'task_failed' ? 'lm-chip-active' : ''}`}
              onClick={() => handleFilterChange('logType', filters.logType === 'task_failed' ? '' : 'task_failed')}
            >
              <span className="lm-chip-dot lm-chip-dot-danger" />
              Failed Tasks
            </Button>
            <Button
              size="small"
              className={`lm-chip ${filters.logType === 'upload_completed' ? 'lm-chip-active' : ''}`}
              onClick={() => handleFilterChange('logType', filters.logType === 'upload_completed' ? '' : 'upload_completed')}
            >
              <span className="lm-chip-dot lm-chip-dot-success" />
              Upload Success
            </Button>
            <Button
              size="small"
              className={`lm-chip ${filters.hours === 1 ? 'lm-chip-active' : ''}`}
              onClick={() => handleFilterChange('hours', filters.hours === 1 ? 24 : 1)}
            >
              <span className="lm-chip-dot lm-chip-dot-info" />
              Last Hour
            </Button>
          </div>

          <div className="lm-filters-grid grid grid-cols-2 md:grid-cols-5 gap-2">
            <Select
              placeholder="Chọn Shop"
              value={selectedMachine}
              onChange={handleMachineChange}
              style={{ width: '100%' }}
            >
              <Option value="all">Tất cả Shops</Option>
              {shops.map(shop => {
                // Kiểm tra xem shop này có active extension không
                const activeExt = activeExtensions.find(ext => ext.shopId === shop._id);
                return (
                  <Option key={shop._id} value={shop._id}>
                    <span className={`lm-ext-status ${activeExt ? '' : 'lm-ext-status-off'}`} />
                    {shop.name}
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
              <Option value={500}>500 logs</Option>
              <Option value={1000}>1000 logs</Option>
              <Option value={2000}>2000 logs</Option>
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

          </div>
        </Card>

        {/* Active Extensions Overview */}
        {selectedMachine === 'all' && activeExtensions.length > 0 && (
          <Card title={`Active Extensions (${activeExtensions.length})`} className="lm-card" size="small">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {activeExtensions.map(ext => {
                // Tìm shop tương ứng từ danh sách shops
                const shop = shops.find(s => s._id === ext.shopId || s._id === ext._id);
                return (
                  <div key={ext._id} className="lm-ext-card"
                    onClick={() => handleMachineChange(ext.shopId || ext._id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="lm-ext-title">
                          <span className="lm-ext-status" />
                          {ext._id}
                        </div>
                        <div className="lm-ext-sub">
                          {shop?.name || ext.shopName || 'Unknown Shop'}
                        </div>
                        <div className="lm-ext-count">
                          {ext.logCount} logs
                        </div>
                      </div>
                      <div className="lm-ext-time">
                        {formatTimestamp(ext.lastActivity)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Main Table */}
        <div ref={tableWrapRef}>
        <Card className="lm-card lm-table-card">
          <Table
            columns={columns}
            dataSource={logs}
            loading={loading}
            rowKey="_id"
            size="small"
            pagination={{
              pageSize: filters.limit,
              showSizeChanger: true,
              pageSizeOptions: [ '500','1000', '2000'],
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} logs (Limit: ${filters.limit})`,
              onShowSizeChange: (current, size) => {
                handleFilterChange('limit', size);
              }
            }}
            scroll={{ x: 1200, y: 600 }}
          />
        </Card>
        </div>

        {/* Detail Modal */}
        <Modal
          className="log-manager-modal"
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
                      <div className="lm-detail-label">Machine ID</div>
                      <div className="lm-detail-value">{selectedLog.machineId}</div>
                    </div>
                    <div>
                      <div className="lm-detail-label">Shop</div>
                      <div className="lm-detail-value">{(() => {
                        const shop = shops.find(s => s._id === selectedLog.shopId);
                        return shop?.name || selectedLog.shopName || 'Unknown Shop';
                      })()}</div>
                    </div>
                    <div>
                      <div className="lm-detail-label">Timestamp</div>
                      <div className="lm-detail-value">{formatTimestamp(selectedLog.timestamp)}</div>
                    </div>
                    <div>
                      <div className="lm-detail-label">Level</div>
                      <div>
                        <Tag color={LOG_LEVELS[selectedLog.level]?.color}>
                          {selectedLog.level?.toUpperCase()}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      <div className="lm-detail-label">Type</div>
                      <div>
                        <Tag color={getLogTypeColor(selectedLog.logType)}>
                          {selectedLog.logType}
                        </Tag>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="lm-detail-label">Message</div>
                    <div className="lm-message-box">
                      {selectedLog.message}
                    </div>
                  </div>
                </div>
              </TabPane>

              {selectedLog.taskInfo && (
                <TabPane tab="Task Info" key="2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="lm-detail-label">Task ID</div><div className="lm-detail-value">{selectedLog.taskInfo.taskId}</div></div>
                    <div><div className="lm-detail-label">Task Type</div><div className="lm-detail-value">{selectedLog.taskInfo.taskType}</div></div>
                    <div><div className="lm-detail-label">Batch ID</div><div className="lm-detail-value">{selectedLog.taskInfo.batchId}</div></div>
                    <div><div className="lm-detail-label">Orders Count</div><div className="lm-detail-value">{selectedLog.taskInfo.ordersCount}</div></div>
                    <div><div className="lm-detail-label">Filename</div><div className="lm-detail-value">{selectedLog.taskInfo.filename}</div></div>
                  </div>
                </TabPane>
              )}

              {selectedLog.uploadInfo && (
                <TabPane tab="Upload Info" key="3">
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="lm-detail-label">Filename</div><div className="lm-detail-value">{selectedLog.uploadInfo.filename}</div></div>
                    {selectedLog.uploadInfo.fileSize && (
                      <div><div className="lm-detail-label">File Size</div><div className="lm-detail-value">{selectedLog.uploadInfo.fileSize} bytes</div></div>
                    )}
                    {selectedLog.uploadInfo.ordersUploaded !== undefined && (
                      <div><div className="lm-detail-label">Orders Uploaded</div><div className="lm-detail-value">{selectedLog.uploadInfo.ordersUploaded}</div></div>
                    )}
                    {selectedLog.uploadInfo.carrier && (
                      <div><div className="lm-detail-label">Carrier</div><div className="lm-detail-value">{selectedLog.uploadInfo.carrier}</div></div>
                    )}
                    {selectedLog.uploadInfo.shipMethod && (
                      <div><div className="lm-detail-label">Ship Method</div><div className="lm-detail-value">{selectedLog.uploadInfo.shipMethod}</div></div>
                    )}
                    {selectedLog.uploadInfo.progress !== undefined && (
                      <div className="col-span-2">
                        <div className="lm-detail-label">Progress</div>
                        <Progress percent={selectedLog.uploadInfo.progress} strokeColor="#0a0a0a" />
                      </div>
                    )}
                  </div>
                </TabPane>
              )}

              {selectedLog.performance && (
                <TabPane tab="Performance" key="4">
                  <div className="grid grid-cols-3 gap-4">
                    {selectedLog.performance.duration && (
                      <div><div className="lm-detail-label">Duration</div><div className="lm-detail-value">{selectedLog.performance.duration} ms</div></div>
                    )}
                    {selectedLog.performance.memoryUsage && (
                      <div><div className="lm-detail-label">Memory</div><div className="lm-detail-value">{selectedLog.performance.memoryUsage} MB</div></div>
                    )}
                    {selectedLog.performance.cpuUsage && (
                      <div><div className="lm-detail-label">CPU</div><div className="lm-detail-value">{selectedLog.performance.cpuUsage}%</div></div>
                    )}
                  </div>
                </TabPane>
              )}

              {selectedLog.errorInfo && (
                <TabPane tab="Error Info" key="5">
                  <div className="space-y-3">
                    <div><div className="lm-detail-label">Error Code</div><div className="lm-detail-value">{selectedLog.errorInfo.errorCode}</div></div>
                    <div><div className="lm-detail-label">Error Message</div><div className="lm-detail-value">{selectedLog.errorInfo.errorMessage}</div></div>
                    {selectedLog.errorInfo.stackTrace && (
                      <div>
                        <div className="lm-detail-label">Stack Trace</div>
                        <pre className="lm-code-box">{selectedLog.errorInfo.stackTrace}</pre>
                      </div>
                    )}
                    {selectedLog.errorInfo.context && (
                      <div>
                        <div className="lm-detail-label">Context</div>
                        <pre className="lm-code-box lm-code-box-light">{JSON.stringify(selectedLog.errorInfo.context, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </TabPane>
              )}

              {selectedLog.rawData && (
                <TabPane tab="Raw Data" key="6">
                  <div className="lm-detail-label">Raw Data</div>
                  <pre className="lm-code-box">{JSON.stringify(selectedLog.rawData, null, 2)}</pre>
                </TabPane>
              )}

              {selectedLog.metadata && (
                <TabPane tab="Metadata" key="7">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {selectedLog.metadata.extensionVersion && (
                      <div><div className="lm-detail-label">Extension Version</div><div className="lm-detail-value">{selectedLog.metadata.extensionVersion}</div></div>
                    )}
                    {selectedLog.metadata.browserInfo && (
                      <div><div className="lm-detail-label">Browser Info</div><div className="lm-detail-value">{selectedLog.metadata.browserInfo}</div></div>
                    )}
                    {selectedLog.metadata.userAgent && (
                      <div className="col-span-2"><div className="lm-detail-label">User Agent</div><div className="lm-detail-value">{selectedLog.metadata.userAgent}</div></div>
                    )}
                    {selectedLog.metadata.sessionId && (
                      <div><div className="lm-detail-label">Session ID</div><div className="lm-detail-value">{selectedLog.metadata.sessionId}</div></div>
                    )}
                  </div>
                  <div className="lm-detail-label">Full Metadata</div>
                  <pre className="lm-code-box lm-code-box-light">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </TabPane>
              )}
            </Tabs>
          )}
        </Modal>

        {/* Task Drawer */}
        <Drawer
          className="log-manager-drawer"
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
                <div className="lm-tl-time">{formatTimestamp(log.timestamp)}</div>
                <div className="lm-tl-type">{log.logType}</div>
                <div className="lm-tl-msg">{log.message}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Drawer>
      </div>
    </div>
  );
};

export default LogManager;