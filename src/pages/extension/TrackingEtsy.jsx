import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, DatePicker, Image, Input, Modal, Select, Table, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { FaEtsy } from 'react-icons/fa';
import { LuRefreshCw, LuUpload } from 'react-icons/lu';
import { toast } from 'sonner';
import { getAllEtsyOrders, updateEtsySubmittedStatus, uploadEtsyTracking, uploadEtsyTrackingBatch } from '../../apis/etsy';
import { getAllShop } from '../../apis/shop';
import { defaultFrom, defaultTo } from '../../utils/fomatDate';

const { RangePicker } = DatePicker;
const DEFAULT_LIMIT = 100;
const LIMIT_OPTIONS = [20, 100, 500, 1000];
const ALL_FILTER = 'all';
const PAGE_TOKENS = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceSubtle: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#64748b',
  primary: '#0958d7',
  primaryHover: '#0747a6',
  successText: '#166534',
  successBg: '#dcfce7',
  successBorder: '#86efac',
  warningText: '#92400e',
  warningBg: '#fef3c7',
  warningBorder: '#fcd34d',
};

const StatusBadge = ({ tone = 'neutral', children }) => {
  const tones = {
    success: {
      color: PAGE_TOKENS.successText,
      backgroundColor: PAGE_TOKENS.successBg,
      borderColor: PAGE_TOKENS.successBorder,
    },
    warning: {
      color: PAGE_TOKENS.warningText,
      backgroundColor: PAGE_TOKENS.warningBg,
      borderColor: PAGE_TOKENS.warningBorder,
    },
    neutral: {
      color: PAGE_TOKENS.muted,
      backgroundColor: PAGE_TOKENS.surfaceSubtle,
      borderColor: PAGE_TOKENS.border,
    },
  };

  return (
    <span
      className="inline-flex h-6 items-center rounded-full border px-2 text-xs font-semibold"
      style={tones[tone] || tones.neutral}
    >
      {children}
    </span>
  );
};

const pickOrders = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const pickTotal = (data, fallback) =>
  data?.totalCount || data?.total || data?.count || data?.pagination?.total || fallback;

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '-';
};

const pickTrackingNumber = (trackingInfo) => {
  const value =
    trackingInfo?.trackingNumber ||
    trackingInfo?.tracking_number ||
    trackingInfo?.tracking ||
    trackingInfo?.trackingNo ||
    trackingInfo?.tracking_no ||
    trackingInfo?.trackingId ||
    trackingInfo?.tracking_id ||
    trackingInfo?.trackingCode ||
    trackingInfo?.tracking_code ||
    trackingInfo?.number ||
    trackingInfo?.code ||
    '';

  return typeof value === 'string' ? value.trim() : value || '';
};

const hasTrackingInfo = (trackingInfo) => {
  if (!trackingInfo || typeof trackingInfo !== 'object') return false;
  return Boolean(pickTrackingNumber(trackingInfo));
};

const orderHasTracking = (order) => {
  const orderTracking = hasTrackingInfo(order?.tracking_info);
  const itemTracking = Array.isArray(order?.items) && order.items.some((item) => hasTrackingInfo(item?.tracking_info));
  return orderTracking || itemTracking;
};

const formatTracking = (trackingInfo) => {
  if (!trackingInfo || Object.keys(trackingInfo).length === 0) return '-';

  const trackingNumber = pickTrackingNumber(trackingInfo);
  return trackingNumber || '-';
};

const filterOrders = (orders = [], filters = {}) =>
  orders.filter((order) => {
    const submittedMatch =
      filters.submittedStatus === 'submitted'
        ? order?.sumbittedoetsy === true
        : filters.submittedStatus === 'not_submitted'
          ? order?.sumbittedoetsy !== true
          : true;

    const trackingMatch =
      filters.trackingStatus === 'has_tracking'
        ? orderHasTracking(order)
        : filters.trackingStatus === 'no_tracking'
          ? !orderHasTracking(order)
          : true;

    return submittedMatch && trackingMatch;
  });

const flattenOrders = (orders = []) =>
  orders.flatMap((order) => {
    const items = Array.isArray(order?.items) && order.items.length > 0 ? order.items : [{}];

    return items.map((item, index) => ({
      key: `${order?.orderId || order?._id || 'order'}-${item?.orderItemId || item?.listingId || index}`,
      orderId: order?.orderId || '-',
      shopId: order?.shopId || '',
      shopName: order?.shopName || '-',
      trackingInfo: item?.tracking_info || order?.tracking_info || {},
      trackingNumber: pickTrackingNumber(item?.tracking_info || order?.tracking_info || {}),
      hasTracking: hasTrackingInfo(item?.tracking_info || order?.tracking_info || {}),
      sumbittedoetsy: order?.sumbittedoetsy === true,
      listingId: item?.listingId || '-',
      baseImageUrl: item?.baseImageUrl || '',
      createdAt: order?.createdAt,
    }));
  });

const TrackingEtsy = () => {
  const { collapsed } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ trackingNumber: '' });
  const [filters, setFilters] = useState({
    page: 1,
    perPage: DEFAULT_LIMIT,
    from: defaultFrom,
    to: defaultTo,
    search: '',
    shopName: '',
    submittedStatus: ALL_FILTER,
    trackingStatus: ALL_FILTER,
  });

  const filteredOrders = useMemo(() => filterOrders(orders, filters), [orders, filters.submittedStatus, filters.trackingStatus]);
  const rows = useMemo(() => flattenOrders(filteredOrders), [filteredOrders]);
  const selectedOrder = selectedRows[0];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const requestParams = {
        ...filters,
        sumbittedoetsy:
          filters.submittedStatus === 'submitted' ? true : filters.submittedStatus === 'not_submitted' ? false : undefined,
        hasTracking:
          filters.trackingStatus === 'has_tracking' ? true : filters.trackingStatus === 'no_tracking' ? false : undefined,
      };
      const res = await getAllEtsyOrders(requestParams);
      const list = pickOrders(res?.data);
      setOrders(list);
      setTotal(pickTotal(res?.data, list.length));
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Khong the tai tracking Etsy');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchShops = useCallback(async () => {
    try {
      const res = await getAllShop();
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setShops(list.filter((shop) => !shop?.merchant || shop.merchant === 'Etsy'));
    } catch (error) {
      console.error(error);
      toast.error('Khong the tai danh sach shop');
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const updateFilter = useCallback((changes) => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setFilters((prev) => ({
      ...prev,
      ...changes,
      page: Object.prototype.hasOwnProperty.call(changes, 'page') ? changes.page : 1,
    }));
  }, []);

  useEffect(() => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, [filters.submittedStatus, filters.trackingStatus, filters.search, filters.shopName, filters.from, filters.to]);

  const openUploadModal = () => {
    if (selectedRows.length === 0) {
      toast.error('Vui long chon order trong table');
      return;
    }

    setUploadForm({ trackingNumber: selectedOrder.trackingNumber || '' });
    setIsUploadModalOpen(true);
  };

  const handleUploadTracking = async () => {
    const firstMachineId = selectedRows[0]?.shopId;

    if (!firstMachineId) {
      toast.error('Order da chon chua co shopId');
      return;
    }

    const hasDifferentShop = selectedRows.some((row) => row.shopId !== firstMachineId);
    if (hasDifferentShop) {
      toast.error('Chi upload batch cho cac order cung 1 shop');
      return;
    }

    const items =
      selectedRows.length === 1
        ? [
            {
              orderId: selectedOrder.orderId,
              trackingNumber: selectedOrder.trackingNumber || uploadForm.trackingNumber.trim(),
            },
          ]
        : selectedRows.map((row) => ({
            orderId: row.orderId,
            trackingNumber: row.trackingNumber,
          }));

    const invalidItem = items.find((item) => !item.orderId || item.orderId === '-' || !item.trackingNumber);
    if (invalidItem) {
      toast.error('Tat ca order duoc chon phai co orderId va trackingNumber');
      return;
    }

    try {
      setUploading(true);
      const res =
        items.length === 1
          ? await uploadEtsyTracking({
              machineId: firstMachineId,
              orderId: items[0].orderId,
              trackingNumber: items[0].trackingNumber,
              force: false,
            })
          : await uploadEtsyTrackingBatch({
              machineId: firstMachineId,
              items,
              force: false,
            });

      if (res.status === 200 || res.status === 201) {
        const submittedTargets = Array.from(
          new Map(
            selectedRows.map((row) => [
              `${row.orderId}-${row.shopId}`,
              {
                orderId: row.orderId,
                shopId: row.shopId,
                submittedToEtsy: true,
              },
            ])
          ).values()
        );

        const submittedResults = await Promise.allSettled(submittedTargets.map((payload) => updateEtsySubmittedStatus(payload)));
        const failedSubmittedUpdates = submittedResults.filter((result) => result.status === 'rejected').length;
        const successfulSubmittedUpdates = submittedResults
          .map((result, index) => (result.status === 'fulfilled' ? { payload: submittedTargets[index], data: result.value?.data } : null))
          .filter(Boolean);

        setOrders((prevOrders) =>
          prevOrders.map((order) => {
            const updated = successfulSubmittedUpdates.find(
              ({ payload, data }) =>
                String(payload.orderId) === String(order?.orderId) &&
                String(payload.shopId) === String(order?.shopId) &&
                (data?.ok === true || data?.sumbittedoetsy === true)
            );

            return updated ? { ...order, sumbittedoetsy: updated.data?.sumbittedoetsy ?? true } : order;
          })
        );

        toast.success(res?.data?.message || 'Da gui task upload tracking');
        if (failedSubmittedUpdates > 0) {
          toast.warning(`${failedSubmittedUpdates} order chua cap nhat duoc Submitted Etsy`);
        }
        setIsUploadModalOpen(false);
        setSelectedRowKeys([]);
        setSelectedRows([]);
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error?.response?.data?.reason || 'Upload tracking that bai');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 130,
      fixed: 'left',
      render: (value) => (
        <span className="font-semibold tabular-nums" style={{ color: PAGE_TOKENS.text }}>
          {value}
        </span>
      ),
    },
    {
      title: 'Shop Name',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 180,
    },
    {
      title: 'Tracking Info',
      dataIndex: 'trackingInfo',
      key: 'trackingInfo',
      width: 240,
      render: (value) => {
        const text = formatTracking(value);
        return text === '-' ? (
          <StatusBadge tone="warning">No tracking</StatusBadge>
        ) : (
          <Tooltip title={text}>
            <span className="block max-w-[220px] truncate font-medium tabular-nums" style={{ color: PAGE_TOKENS.text }}>
              {text}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Submitted Etsy',
      dataIndex: 'sumbittedoetsy',
      key: 'sumbittedoetsy',
      width: 140,
      render: (value) => (
        <StatusBadge tone={value ? 'success' : 'neutral'}>{value ? 'Submitted' : 'Not Submitted'}</StatusBadge>
      ),
    },
    {
      title: 'Listing ID',
      dataIndex: 'listingId',
      key: 'listingId',
      width: 140,
      render: (value) => (
        <span className="font-mono text-xs tabular-nums" style={{ color: PAGE_TOKENS.muted }}>
          {value}
        </span>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'baseImageUrl',
      key: 'baseImageUrl',
      width: 92,
      render: (value) =>
        value ? (
          <Image
            src={value}
            width={46}
            height={46}
            className="rounded-md border object-cover"
            style={{ borderColor: PAGE_TOKENS.border }}
            preview={{ mask: 'View' }}
          />
        ) : (
          <div
            className="h-[46px] w-[46px] rounded-md border"
            style={{ backgroundColor: PAGE_TOKENS.surfaceSubtle, borderColor: PAGE_TOKENS.border }}
          />
        ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value) => (
        <span className="tabular-nums" style={{ color: PAGE_TOKENS.muted }}>
          {formatDateTime(value)}
        </span>
      ),
    },
  ];

  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: PAGE_TOKENS.bg, color: PAGE_TOKENS.text }}>
      <div
        className={`fixed top-0 ${
          collapsed ? 'left-64' : 'left-13.5'
        } right-0 z-50 border-b transition-all duration-300`}
        style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
      >
        <div className="flex h-[60px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: PAGE_TOKENS.primary }}
            >
              <FaEtsy size={16} />
            </div>
            <div>
              <h1 className="m-0 text-[16px] font-bold leading-tight" style={{ color: PAGE_TOKENS.text }}>
                Tracking Etsy
              </h1>
              <p className="m-0 text-xs leading-tight" style={{ color: PAGE_TOKENS.muted }}>
                Upload tracking qua extension
              </p>
            </div>
          </div>

          <Button
            aria-label="Refresh Etsy tracking orders"
            icon={<LuRefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            disabled={loading}
            onClick={fetchOrders}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex h-full flex-col overflow-hidden px-6 pb-4 pt-[76px]">
        <div
          className="mb-3 w-full max-w-full shrink-0 overflow-hidden rounded-lg border px-3 py-3 shadow-sm"
          style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
        >
          <div className="flex w-full max-w-full flex-wrap items-center gap-2">
            <Select
              aria-label="Filter by Etsy extension shop"
              allowClear
              showSearch
              placeholder="Select extension / shop"
              className="min-w-[180px] flex-1"
              optionFilterProp="label"
              value={filters.shopName || undefined}
              options={shops.map((shop) => ({
                value: shop?.shopName || shop?.name,
                label: shop?.shopName || shop?.name || 'Shop',
              }))}
              onChange={(value) => updateFilter({ shopName: value || '' })}
            />
            <Input.Search
              aria-label="Search Etsy order"
              allowClear
              placeholder="Search order..."
              className="min-w-[170px] flex-1"
              defaultValue={filters.search}
              onChange={(event) => {
                if (!event.target.value) updateFilter({ search: '' });
              }}
              onSearch={(value) => updateFilter({ search: value.trim() })}
            />
            <RangePicker
              aria-label="Filter Etsy orders by date range"
              className="min-w-[230px] flex-1"
              value={[dayjs(filters.from), dayjs(filters.to)]}
              format="YYYY-MM-DD"
              onChange={(dates) => {
                updateFilter({
                  from: dates?.[0] ? dates[0].startOf('day').toISOString() : defaultFrom,
                  to: dates?.[1] ? dates[1].endOf('day').toISOString() : defaultTo,
                });
              }}
            />
            <Select
              aria-label="Filter by Submitted Etsy status"
              allowClear
              placeholder="Submitted Etsy"
              className="min-w-[150px] flex-1"
              value={filters.submittedStatus === ALL_FILTER ? undefined : filters.submittedStatus}
              options={[
                { value: 'submitted', label: 'Submitted' },
                { value: 'not_submitted', label: 'Not Submitted' },
              ]}
              onChange={(value) => updateFilter({ submittedStatus: value || ALL_FILTER })}
            />
            <Select
              aria-label="Filter by tracking info status"
              allowClear
              placeholder="Tracking Info"
              className="min-w-[150px] flex-1"
              value={filters.trackingStatus === ALL_FILTER ? undefined : filters.trackingStatus}
              options={[
                { value: 'has_tracking', label: 'Has Tracking' },
                { value: 'no_tracking', label: 'No Tracking' },
              ]}
              onChange={(value) => updateFilter({ trackingStatus: value || ALL_FILTER })}
            />
            <Select
              aria-label="Select page limit"
              className="min-w-[110px] flex-1"
              value={filters.perPage}
              options={LIMIT_OPTIONS.map((value) => ({ value, label: `Limit ${value}` }))}
              onChange={(value) => updateFilter({ perPage: value })}
            />

            <Button
              type="primary"
              aria-label="Upload selected tracking to Etsy"
              icon={<LuUpload size={16} />}
              disabled={selectedRows.length === 0}
              onClick={openUploadModal}
              className="ml-auto shrink-0"
              style={{ backgroundColor: PAGE_TOKENS.primary, borderColor: PAGE_TOKENS.primary }}
            >
              Upload Tracking{selectedRows.length ? ` (${selectedRows.length})` : ''}
            </Button>
          </div>
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm"
          style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
        >
          <Table
            columns={columns}
            dataSource={rows}
            loading={loading}
            className="min-h-0"
            scroll={{ x: 1100, y: 'calc(100vh - 252px)' }}
            pagination={false}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (keys, records) => {
                setSelectedRowKeys(keys);
                setSelectedRows(records);
              },
            }}
          />
          <div
            className="flex shrink-0 items-center justify-between gap-3 border-t px-4 py-2"
            style={{ borderColor: PAGE_TOKENS.border, backgroundColor: PAGE_TOKENS.surfaceSubtle }}
          >
            <div className="text-xs" style={{ color: PAGE_TOKENS.muted }}>
              Selected: <span className="font-semibold" style={{ color: PAGE_TOKENS.text }}>{selectedRows.length}</span>
            </div>
            <div className="text-xs" style={{ color: PAGE_TOKENS.muted }}>
              Loaded: <span className="font-semibold" style={{ color: PAGE_TOKENS.text }}>{orders.length}</span>
              <span className="mx-1">/</span>
              Total: <span className="font-semibold" style={{ color: PAGE_TOKENS.text }}>{total}</span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={`Upload Tracking${selectedRows.length > 1 ? ` (${selectedRows.length} orders)` : ''}`}
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        onOk={handleUploadTracking}
        confirmLoading={uploading}
        okText="Upload"
        okButtonProps={{ style: { backgroundColor: PAGE_TOKENS.primary, borderColor: PAGE_TOKENS.primary } }}
      >
        <div className="space-y-4 pt-2">
          {selectedRows.length === 1 ? (
            <div>
              <div className="mb-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.muted }}>Order ID</div>
              <Input value={selectedOrder?.orderId || ''} disabled />
            </div>
          ) : (
            <div
              className="rounded-lg border p-3 text-sm"
              style={{ backgroundColor: PAGE_TOKENS.surfaceSubtle, borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.muted }}
            >
              {selectedRows.length} orders selected. Payload se gui theo batch items.
            </div>
          )}
          <div>
            <div className="mb-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.muted }}>Shop / Machine ID</div>
            <Input value={selectedRows[0]?.shopId || ''} disabled />
          </div>
          {selectedRows.length === 1 && (
            <div>
              <div className="mb-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.muted }}>Tracking Number</div>
              <Input
                aria-label="Tracking number"
                value={selectedOrder?.trackingNumber || uploadForm.trackingNumber}
                disabled={!!selectedOrder?.trackingNumber}
                placeholder="123456"
                onChange={(event) => setUploadForm({ trackingNumber: event.target.value })}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TrackingEtsy;
