import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Empty, Flex, Input, Select, Space, Switch, Table, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { LuExternalLink, LuRefreshCw } from 'react-icons/lu';
import { getAllShop } from '../../apis/shop';
import { fetchEtsyMessages, markEtsyMessageRead } from '../../apis/etsyMessages';
import useSocketIO from '../../hooks/useSocketIO';

const SOCKET_URL = 'https://api.lngmerch.co';
const DEFAULT_LIMIT = 20;

const pickShopId = (shop) => shop?._id || shop?.shopId || '';
const pickShopName = (shop) => shop?.name || shop?.shopName || shop?.storeName || pickShopId(shop) || 'Unnamed shop';
const isEtsyShop = (shop) => {
  const merchant = String(shop?.merchant || shop?.platform || shop?.type || '').toLowerCase();
  return !merchant || merchant === 'etsy';
};

const pickItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.message?.items)) return data.message.items;
  return [];
};

const pickTotal = (data, fallback) => data?.total || data?.totalCount || data?.pagination?.total || data?.message?.total || fallback;

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '-';
};

const upsertMessages = (prev, incoming) => {
  const map = new Map();

  prev.forEach((item) => {
    if (item?.threadId) map.set(item.threadId, item);
  });

  incoming.forEach((item) => {
    if (!item?.threadId) return;
    map.set(item.threadId, {
      ...map.get(item.threadId),
      ...item,
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    const left = new Date(a?.lastMessageAt || a?.updatedAt || 0).getTime();
    const right = new Date(b?.lastMessageAt || b?.updatedAt || 0).getTime();
    return right - left;
  });
};

const TrackingEtsyDetail = () => {
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingShops, setLoadingShops] = useState(false);
  const [markingThreadId, setMarkingThreadId] = useState('');
  const [q, setQ] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: DEFAULT_LIMIT, total: 0 });

  const socketAuth = useMemo(
    () =>
      selectedShopId
        ? {
            shopId: selectedShopId,
            machineId: `fe-dashboard-${selectedShopId}`,
            label: 'FE Etsy Message Dashboard',
            version: 'fe-message-monitor',
          }
        : {},
    [selectedShopId]
  );
  const { socket, connected: socketConnected } = useSocketIO(SOCKET_URL, { auth: socketAuth });

  const unreadCount = useMemo(() => messages.filter((item) => item?.unread).length, [messages]);

  const shopOptions = useMemo(
    () =>
      shops.map((shop) => ({
        value: pickShopId(shop),
        label: pickShopName(shop),
      })),
    [shops]
  );

  const fetchShops = useCallback(async () => {
    try {
      setLoadingShops(true);
      const res = await getAllShop();
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      const etsyShops = list.filter(isEtsyShop).filter((shop) => pickShopId(shop));

      setShops(etsyShops);
      setSelectedShopId((prev) => prev || pickShopId(etsyShops[0]) || '');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Khong the tai danh sach shop');
    } finally {
      setLoadingShops(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (next = {}) => {
      const shopId = next.shopId ?? selectedShopId;
      if (!shopId) return;

      const page = next.page ?? pagination.current;
      const limit = next.limit ?? pagination.pageSize;

      try {
        setLoading(true);
        const res = await fetchEtsyMessages({
          shopId,
          page,
          limit,
          q: q || undefined,
          unread: unreadOnly ? true : undefined,
        });
        const list = pickItems(res?.data);
        setMessages(list);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: limit,
          total: pickTotal(res?.data, list.length),
        }));
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || 'Khong the tai Etsy messages');
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, q, selectedShopId, unreadOnly]
  );

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    if (!selectedShopId) return;
    loadMessages({ page: 1, shopId: selectedShopId });
  }, [loadMessages, selectedShopId, q, unreadOnly]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewMessage = (payload) => {
      const incoming = Array.isArray(payload?.messages)
        ? payload.messages
        : Array.isArray(payload?.items)
          ? payload.items
          : payload?.item
            ? [payload.item]
            : payload?.threadId
              ? [payload]
              : [];

      const sameShopMessages = incoming.filter((item) => String(item?.shopId || selectedShopId) === String(selectedShopId));
      if (!sameShopMessages.length) return;

      setMessages((prev) => upsertMessages(prev, sameShopMessages));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(prev.total, upsertMessages(messages, sameShopMessages).length),
      }));
    };

    socket.on('etsy_message:new', handleNewMessage);
    return () => socket.off('etsy_message:new', handleNewMessage);
  }, [messages, selectedShopId, socket]);

  const handleMarkRead = useCallback(
    async (item) => {
      if (!selectedShopId || !item?.threadId) return;

      try {
        setMarkingThreadId(item.threadId);
        const res = await markEtsyMessageRead({
          shopId: selectedShopId,
          threadId: item.threadId,
          unread: false,
        });
        const updated = res?.data?.item || res?.data?.data || { ...item, unread: false, status: 'read' };
        setMessages((prev) => upsertMessages(prev, [updated]));
        toast.success('Marked as read');
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || 'Mark read failed');
      } finally {
        setMarkingThreadId('');
      }
    },
    [selectedShopId]
  );

  const columns = useMemo(
    () => [
      {
        title: 'Buyer',
        dataIndex: 'buyerName',
        key: 'buyer',
        width: 220,
        render: (_, record) => (
          <div>
            <div className="font-medium text-black">{record?.buyerName || record?.buyerUsername || 'Unknown buyer'}</div>
            <div className="text-xs text-[#64748b]">{record?.buyerUsername || record?.threadId}</div>
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'unread',
        key: 'unread',
        width: 110,
        align: 'center',
        render: (unread, record) => <Tag color={unread ? 'blue' : 'default'}>{unread ? 'Unread' : record?.status || 'Read'}</Tag>,
      },
      {
        title: 'Order',
        dataIndex: 'orderId',
        key: 'orderId',
        width: 140,
        render: (value) => value || '-',
      },
      {
        title: 'Latest Message',
        dataIndex: 'latestMessagePreview',
        key: 'message',
        render: (_, record) => (
          <div className="max-w-[560px]">
            <div className="text-sm text-black whitespace-normal break-words">
              {record?.latestMessagePreview || record?.latestMessageBody || 'No preview'}
            </div>
            <div className="mt-1 text-xs text-[#94a3b8]">Thread: {record?.threadId}</div>
          </div>
        ),
      },
      {
        title: 'Last Message',
        dataIndex: 'lastMessageAt',
        key: 'lastMessageAt',
        width: 170,
        render: (value, record) => formatDateTime(value || record?.updatedAt),
      },
      {
        title: 'Action',
        key: 'action',
        width: 210,
        align: 'center',
        render: (_, record) => (
          <Space>
            {record?.sourceUrl && (
              <Tooltip title="Open Etsy">
                <Button
                  icon={<LuExternalLink />}
                  onClick={() => window.open(record.sourceUrl, '_blank', 'noopener,noreferrer')}
                >
                  Open Etsy
                </Button>
              </Tooltip>
            )}
            {record?.unread && (
              <Button type="primary" loading={markingThreadId === record.threadId} onClick={() => handleMarkRead(record)}>
                Mark Read
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [handleMarkRead, markingThreadId]
  );

  return (
    <div className="px-8 py-4">
      <Flex justify="space-between" align="center" className="mb-4" gap={16}>
        <div>
          <h1 className="text-2xl !mb-1" style={{ color: 'black' }}>
            Etsy Message Monitor
          </h1>
          <p className="m-0 text-sm text-[#64748b]">Customer service monitor for Etsy inbox.</p>
        </div>
        <Space>
          <Badge count={unreadCount} showZero>
            <Tag color={socketConnected ? 'green' : 'red'}>{socketConnected ? 'Realtime connected' : 'Realtime disconnected'}</Tag>
          </Badge>
          <Button icon={<LuRefreshCw />} onClick={() => loadMessages()} loading={loading}>
            Refresh
          </Button>
        </Space>
      </Flex>

      <Flex gap={12} align="center" className="mb-4" wrap="wrap">
        <Select
          className="min-w-[260px]"
          placeholder="Select Etsy shop"
          options={shopOptions}
          value={selectedShopId || undefined}
          onChange={(value) => {
            setSelectedShopId(value);
            setMessages([]);
            setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
          }}
          loading={loadingShops}
          showSearch
          optionFilterProp="label"
        />
        <Input
          className="max-w-[360px]"
          placeholder="Search buyer, order ID, message..."
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Space>
          <Switch checked={unreadOnly} onChange={setUnreadOnly} />
          <span className="text-sm text-[#64748b]">Unread only</span>
        </Space>
      </Flex>

      <Table
        bordered
        rowKey={(record) => record?.threadId || record?._id}
        columns={columns}
        dataSource={messages}
        loading={loading}
        locale={{ emptyText: <Empty description={!selectedShopId ? 'Please select an Etsy shop' : 'No Etsy messages found'} /> }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total) => `Total ${total} items`,
          onChange: (page, pageSize) => loadMessages({ page, limit: pageSize }),
        }}
      />
    </div>
  );
};

export default React.memo(TrackingEtsyDetail);
