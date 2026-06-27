import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, DatePicker, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { LuRefreshCw } from 'react-icons/lu';
import { getOrderLifecycleEvents, getOrderLifecycleSummary } from '../../apis/orderLifecycle';

const { RangePicker } = DatePicker;

const stageOptions = ['IMPORT', 'AUTO_COST', 'RESET', 'SCALE', 'QC', 'VENDOR_PUSH', 'TRACKING_PULL'].map((value) => ({ value, label: value }));
const statusOptions = ['started', 'success', 'failed', 'warning', 'info'].map((value) => ({ value, label: value }));
const platformOptions = ['etsy', 'amazon', 'shopify'].map((value) => ({ value, label: value.toUpperCase() }));

const statusColor = {
  success: 'green',
  failed: 'red',
  warning: 'orange',
  started: 'blue',
  info: 'default',
};

const initialSummary = {
  totals: { total: 0, failed: 0, warning: 0, success: 0 },
  byStage: [],
  byEventType: [],
  recentFailures: [],
};

export default function OrderLifecycleMonitoring() {
  const [summary, setSummary] = useState(initialSummary);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    platform: undefined,
    stage: undefined,
    status: undefined,
    orderId: '',
    dateRange: null,
  });

  const queryParams = useMemo(() => {
    const params = {
      platform: filters.platform,
      stage: filters.stage,
      status: filters.status,
      orderId: filters.orderId?.trim() || undefined,
    };
    if (filters.dateRange?.length === 2) {
      params.from = filters.dateRange[0].startOf('day').toISOString();
      params.to = filters.dateRange[1].endOf('day').toISOString();
    }
    return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));
  }, [filters]);

  const fetchData = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const [summaryRes, eventsRes] = await Promise.all([
        getOrderLifecycleSummary(queryParams),
        getOrderLifecycleEvents({ ...queryParams, page, limit }),
      ]);
      setSummary(summaryRes.data || initialSummary);
      setEvents(eventsRes.data?.data || []);
      setPagination(eventsRes.data?.pagination || { page, limit, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, queryParams]);

  useEffect(() => {
    fetchData(1, pagination.limit);
  }, [fetchData, pagination.limit]);

  const columns = [
    {
      title: 'Time',
      dataIndex: 'occurredAt',
      width: 180,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '',
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      width: 110,
      render: (value) => <Tag>{String(value || '').toUpperCase()}</Tag>,
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      width: 150,
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      width: 130,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: 'Event',
      dataIndex: 'eventType',
      width: 190,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (value) => <Tag color={statusColor[value] || 'default'}>{value}</Tag>,
    },
    {
      title: 'Actor',
      width: 140,
      render: (_, row) => row.actorName || row.actorType || 'system',
    },
    {
      title: 'Message / Reason',
      render: (_, row) => row.reason || row.message || '',
    },
  ];

  const cards = [
    { label: 'Total events', value: summary.totals?.total || 0 },
    { label: 'Failed', value: summary.totals?.failed || 0, danger: true },
    { label: 'Warnings', value: summary.totals?.warning || 0 },
    { label: 'Success', value: summary.totals?.success || 0 },
  ];

  return (
    <div className="p-6 space-y-4">
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <div>
          <Typography.Title level={3} className="!mb-0">Order Lifecycle</Typography.Title>
          <Typography.Text type="secondary">Monitor import, auto cost, reset, and future order workflow events.</Typography.Text>
        </div>
        <Button icon={<LuRefreshCw />} onClick={() => fetchData(pagination.page, pagination.limit)} loading={loading}>
          Refresh
        </Button>
      </Flex>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} size="small">
            <Typography.Text type="secondary">{card.label}</Typography.Text>
            <div className={card.danger ? 'text-2xl font-semibold text-red-600' : 'text-2xl font-semibold'}>
              {card.value}
            </div>
          </Card>
        ))}
      </div>

      <Card size="small">
        <Flex gap={8} wrap="wrap">
          <Input.Search
            allowClear
            placeholder="Search order ID"
            style={{ width: 220 }}
            onSearch={(value) => setFilters((prev) => ({ ...prev, orderId: value }))}
          />
          <Select
            allowClear
            placeholder="Platform"
            options={platformOptions}
            style={{ width: 140 }}
            value={filters.platform}
            onChange={(value) => setFilters((prev) => ({ ...prev, platform: value }))}
          />
          <Select
            allowClear
            placeholder="Stage"
            options={stageOptions}
            style={{ width: 160 }}
            value={filters.stage}
            onChange={(value) => setFilters((prev) => ({ ...prev, stage: value }))}
          />
          <Select
            allowClear
            placeholder="Status"
            options={statusOptions}
            style={{ width: 140 }}
            value={filters.status}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
          />
          <RangePicker
            value={filters.dateRange}
            onChange={(value) => setFilters((prev) => ({ ...prev, dateRange: value }))}
          />
        </Flex>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <Card size="small">
          <Table
            rowKey={(row) => row._id || `${row.orderId}-${row.eventType}-${row.occurredAt}`}
            loading={loading}
            columns={columns}
            dataSource={events}
            scroll={{ x: 1120 }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: Math.min(pagination.total, pagination.limit * 50),
              showSizeChanger: true,
              pageSizeOptions: [20, 50, 100, 200],
              onChange: (page, pageSize) => fetchData(page, pageSize),
            }}
          />
        </Card>

        <Card size="small" title="Recent Failures">
          <Space direction="vertical" className="w-full" size={8}>
            {(summary.recentFailures || []).map((failure) => (
              <div key={`${failure.orderId}-${failure.eventType}-${failure.occurredAt}`} className="rounded border border-red-100 p-2">
                <Flex justify="space-between" gap={8}>
                  <Typography.Text strong>{failure.orderId}</Typography.Text>
                  <Tag color="red">{failure.stage}</Tag>
                </Flex>
                <Typography.Text className="block text-xs" type="secondary">{failure.eventType}</Typography.Text>
                <Typography.Text className="block text-xs">{failure.reason || 'Unknown failure'}</Typography.Text>
              </div>
            ))}
            {(!summary.recentFailures || summary.recentFailures.length === 0) && (
              <Typography.Text type="secondary">No recent failures</Typography.Text>
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
}
