import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Table, Switch, Button, Modal, Form, Input, Select, InputNumber, Checkbox, Badge, Tooltip, message } from 'antd';
import { EditOutlined, SettingOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { getConfigAutos, updateConfigAuto } from '../../apis/configAuto';

const { Option } = Select;
const { TextArea } = Input;

const ConfigAuto = () => {
  const { collapsed } = useOutletContext();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [form] = Form.useForm();

  // Preset thời gian
  const timePresets = [
    { label: "Mỗi 5 phút", value: "*/5 * * * *" },
    { label: "Mỗi 15 phút", value: "*/15 * * * *" },
    { label: "Mỗi 30 phút", value: "*/30 * * * *" },
    { label: "Mỗi giờ", value: "0 * * * *" },
    { label: "Mỗi 2 giờ", value: "0 */2 * * *" },
    { label: "8AM, 2PM, 8PM", value: "0 8,14,20 * * *" },
    { label: "Hàng ngày 2AM", value: "0 2 * * *" },
    { label: "Custom", value: "custom" }
  ];

  // Utility functions
  const cronToText = useCallback((cronPattern) => {
    const patterns = {
      '*/5 * * * *': 'Mỗi 5 phút',
      '*/15 * * * *': 'Mỗi 15 phút', 
      '*/30 * * * *': 'Mỗi 30 phút',
      '0 * * * *': 'Mỗi giờ',
      '0 */2 * * *': 'Mỗi 2 giờ',
      '0 8,14,20 * * *': '3 lần/ngày (8AM, 2PM, 8PM)',
      '0 2 * * *': 'Hàng ngày lúc 2AM',
      '0 8 * * *': 'Hàng ngày lúc 8AM'
    };
    
    return patterns[cronPattern] || cronPattern;
  }, []);

  const formatRelativeTime = useCallback((dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours}h trước`;
    return `${diffDays}d trước`;
  }, []);

  const formatStatus = useCallback((status, lastRunStatus) => {
    if (!status) return { text: '🔴 TẮT', color: 'error' };
    
    if (lastRunStatus === 'success') return { text: '🟢 BẬT', color: 'success' };
    if (lastRunStatus === 'error') return { text: '🟡 BẬT (Lỗi)', color: 'warning' };
    if (lastRunStatus === 'running') return { text: '🔵 BẬT (Đang chạy)', color: 'processing' };
    
    return { text: '🟢 BẬT', color: 'success' };
  }, []);

  // API calls
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getConfigAutos({ type: 'vendorSyncBatch' });
      if (response.status === 200) {
        setConfigs(response.data.data || []);
      } else {
        toast.error('Không thể tải danh sách config');
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      toast.error('Lỗi hệ thống khi tải config');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = useCallback(async (id, newStatus) => {
    try {
      const response = await updateConfigAuto(id, { status: newStatus });
      if (response.status === 200) {
        // Update local state
        setConfigs(prev => prev.map(config => 
          config.id === id ? { ...config, status: newStatus } : config
        ));
        toast.success(`Config ${newStatus ? 'đã bật' : 'đã tắt'}`);
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Failed to toggle config:', error);
      toast.error('Lỗi hệ thống khi cập nhật');
    }
  }, []);

  const handleEdit = useCallback((config) => {
    setSelectedConfig(config);
    form.setFieldsValue({
      status: config.status,
      autoTime: timePresets.find(p => p.value === config.autoTime) ? config.autoTime : 'custom',
      customCron: timePresets.find(p => p.value === config.autoTime) ? '' : config.autoTime,
      description: config.description,
      maxOrders: config.config?.maxOrders || 100,
      dryRun: config.config?.dryRun || false
    });
    setEditModalOpen(true);
  }, [form, timePresets]);

  const handleSave = useCallback(async (values) => {
    try {
      const cronPattern = values.autoTime === 'custom' ? values.customCron : values.autoTime;
      
      const updateData = {
        status: values.status,
        autoTime: cronPattern,
        description: values.description,
        config: {
          maxOrders: values.maxOrders,
          dryRun: values.dryRun
        }
      };

      const response = await updateConfigAuto(selectedConfig.id, updateData);
      if (response.status === 200) {
        toast.success('Cập nhật config thành công');
        setEditModalOpen(false);
        fetchConfigs(); // Refresh data
      } else {
        toast.error('Không thể cập nhật config');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Lỗi hệ thống khi lưu config');
    }
  }, [selectedConfig, fetchConfigs]);

  // Table columns
  const columns = [
    {
      title: 'Config ID',
      dataIndex: 'id',
      key: 'id',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => (
        <Badge color="blue" text={text} />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const statusInfo = formatStatus(status, record.stats?.lastRunStatus);
        return (
          <div className="flex items-center gap-2">
            <Badge status={statusInfo.color} text={statusInfo.text} />
            <Switch
              size="small"
              checked={status}
              onChange={(checked) => handleToggle(record.id, checked)}
            />
          </div>
        );
      },
    },
    {
      title: 'Lịch chạy',
      dataIndex: 'autoTime',
      key: 'autoTime',
      render: (cronPattern) => (
        <div>
          <div className="font-mono text-sm">{cronPattern}</div>
          <div className="text-xs text-gray-500">{cronToText(cronPattern)}</div>
        </div>
      ),
    },
    {
      title: 'Thống kê',
      key: 'stats',
      render: (_, record) => (
        <div>
          <div className="text-sm">Runs: {record.stats?.totalRuns || 0}</div>
          {record.stats?.lastRunAt && (
            <div className="text-xs text-gray-500">
              {record.stats.lastRunStatus === 'success' ? '✅' : '❌'} 
              {' '}{formatRelativeTime(record.stats.lastRunAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Cấu hình',
      key: 'config',
      render: (_, record) => (
        <div className="text-xs">
          <div>Max: {record.config?.maxOrders || 100}</div>
          {record.config?.dryRun && <div className="text-orange-500">Test Mode</div>}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  // Effects
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0 flex items-center gap-2" style={{ color: 'black' }}>
            <SettingOutlined />
            Auto Config Management
          </h1>
          <div className="flex items-center gap-2">
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={fetchConfigs}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4 h-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{configs.length}</div>
            <div className="text-sm text-gray-500">Tổng configs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {configs.filter(c => c.status).length}
            </div>
            <div className="text-sm text-gray-500">Đang bật</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {configs.reduce((sum, c) => sum + (c.stats?.totalRuns || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Tổng runs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">
              {configs.filter(c => c.stats?.lastRunStatus === 'success').length}
            </div>
            <div className="text-sm text-gray-500">Success gần nhất</div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <Table
            columns={columns}
            dataSource={configs}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Tổng ${total} configs`,
            }}
          />
        </div>

        {/* Edit Modal */}
        <Modal
          title="Chỉnh sửa Auto Config"
          open={editModalOpen}
          onCancel={() => setEditModalOpen(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              name="status"
              label="Trạng thái"
              valuePropName="checked"
            >
              <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
            </Form.Item>

            <Form.Item
              name="autoTime"
              label="Lịch chạy"
              rules={[{ required: true, message: 'Vui lòng chọn lịch chạy' }]}
            >
              <Select placeholder="Chọn lịch chạy">
                {timePresets.map(preset => (
                  <Option key={preset.value} value={preset.value}>
                    {preset.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.autoTime !== currentValues.autoTime
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('autoTime') === 'custom' ? (
                  <Form.Item
                    name="customCron"
                    label="Custom Cron Pattern"
                    rules={[{ required: true, message: 'Vui lòng nhập cron pattern' }]}
                  >
                    <Input placeholder="*/30 * * * *" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
            >
              <TextArea rows={2} placeholder="Mô tả config này..." />
            </Form.Item>

            <Form.Item
              name="maxOrders"
              label="Số orders tối đa mỗi lần chạy"
              rules={[{ required: true, message: 'Vui lòng nhập số orders' }]}
            >
              <InputNumber min={1} max={1000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="dryRun"
              label="Chế độ test"
              valuePropName="checked"
            >
              <Checkbox>Chạy thử (không thực hiện thật)</Checkbox>
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <div className="flex gap-2">
                <Button onClick={() => setEditModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                  Lưu
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ConfigAuto;