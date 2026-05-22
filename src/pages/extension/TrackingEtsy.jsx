import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, DatePicker, Image, Input, Modal, Pagination, Select, Table, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { FaEtsy } from 'react-icons/fa';
import { LuRefreshCw, LuUpload } from 'react-icons/lu';
import { toast } from 'sonner';
import { getAllEtsyOrders, uploadEtsyTracking, uploadEtsyTrackingBatch } from '../../apis/etsy';
import { getAllShop } from '../../apis/shop';
import { defaultFrom, defaultTo } from '../../utils/fomatDate';

const { RangePicker } = DatePicker;
const PAGE_SIZE = 10;

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

const pickTrackingNumber = (trackingInfo) =>
  trackingInfo?.trackingNumber ||
  trackingInfo?.tracking_number ||
  trackingInfo?.tracking ||
  trackingInfo?.code ||
  '';

const formatTracking = (trackingInfo) => {
  if (!trackingInfo || Object.keys(trackingInfo).length === 0) return '-';

  const trackingNumber = pickTrackingNumber(trackingInfo);
  const carrier = trackingInfo.carrier || trackingInfo.carrierName || trackingInfo.shipping_carrier;

  if (trackingNumber || carrier) return [carrier, trackingNumber].filter(Boolean).join(' - ');
  return JSON.stringify(trackingInfo);
};

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
    perPage: PAGE_SIZE,
    from: defaultFrom,
    to: defaultTo,
    search: '',
    shopName: '',
    sumbittedoetsy: '',
    hasTracking: '',
  });

  const rows = useMemo(() => {
    const flattened = flattenOrders(orders);
    return flattened.filter((row) => {
      const submittedMatch =
        filters.sumbittedoetsy === true || filters.sumbittedoetsy === false
          ? row.sumbittedoetsy === filters.sumbittedoetsy
          : true;
      const trackingMatch =
        filters.hasTracking === true || filters.hasTracking === false ? Boolean(row.trackingNumber) === filters.hasTracking : true;

      return submittedMatch && trackingMatch;
    });
  }, [orders, filters.sumbittedoetsy, filters.hasTracking]);
  const selectedOrder = selectedRows[0];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllEtsyOrders(filters);
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
        toast.success(res?.data?.message || 'Da gui task upload tracking');
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
      render: (value) => <span className="font-semibold text-neutral-950">{value}</span>,
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
          <Tag color="default">No tracking</Tag>
        ) : (
          <Tooltip title={text}>
            <span className="block max-w-[220px] truncate font-medium text-neutral-900">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Submitted Etsy',
      dataIndex: 'sumbittedoetsy',
      key: 'sumbittedoetsy',
      width: 140,
      render: (value) => <Tag color={value ? 'green' : 'default'}>{value ? 'Submitted' : 'Not Submitted'}</Tag>,
    },
    {
      title: 'Listing ID',
      dataIndex: 'listingId',
      key: 'listingId',
      width: 140,
      render: (value) => <span className="font-mono text-xs text-neutral-700">{value}</span>,
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
            className="rounded border border-neutral-200 object-cover"
            preview={{ mask: 'View' }}
          />
        ) : (
          <div className="w-[46px] h-[46px] rounded border border-neutral-200 bg-neutral-50" />
        ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value) => <span className="text-neutral-700">{formatDateTime(value)}</span>,
    },
  ];

  return (
    <div className="h-screen overflow-hidden bg-white text-neutral-950">
      <div
        className={`fixed top-0 ${
          collapsed ? 'left-64' : 'left-13.5'
        } right-0 z-50 bg-white border-b border-neutral-200 transition-all duration-300`}
      >
        <div className="h-12 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center">
              <FaEtsy size={16} />
            </div>
            <div>
              <h1 className="m-0 text-[15px] font-bold text-neutral-950 leading-tight">Tracking Etsy</h1>
              <p className="m-0 text-[11px] text-neutral-500 leading-tight">Upload tracking qua extension</p>
            </div>
          </div>

          <Button
            icon={<LuRefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            disabled={loading}
            onClick={fetchOrders}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="h-full pt-15 px-4 pb-4 flex flex-col overflow-hidden">
        <div className="mb-2 w-full max-w-full shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white px-3 py-2">
          <div className="flex w-full max-w-full flex-wrap items-center gap-2">
            <Select
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
              onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, shopName: value || '' }))}
            />
            <Input.Search
              allowClear
              placeholder="Search order..."
              className="min-w-[170px] flex-1"
              onSearch={(value) => setFilters((prev) => ({ ...prev, page: 1, search: value.trim() }))}
            />
            <RangePicker
              className="min-w-[230px] flex-1"
              value={[dayjs(filters.from), dayjs(filters.to)]}
              format="YYYY-MM-DD"
              onChange={(dates) => {
                setFilters((prev) => ({
                  ...prev,
                  page: 1,
                  from: dates?.[0] ? dates[0].startOf('day').toISOString() : defaultFrom,
                  to: dates?.[1] ? dates[1].endOf('day').toISOString() : defaultTo,
                }));
              }}
            />
            <Select
              allowClear
              placeholder="Submitted Etsy"
              className="min-w-[150px] flex-1"
              value={filters.sumbittedoetsy === '' ? undefined : filters.sumbittedoetsy}
              options={[
                { value: true, label: 'Submitted' },
                { value: false, label: 'Not Submitted' },
              ]}
              onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, sumbittedoetsy: value ?? '' }))}
            />
            <Select
              allowClear
              placeholder="Tracking Info"
              className="min-w-[150px] flex-1"
              value={filters.hasTracking === '' ? undefined : filters.hasTracking}
              options={[
                { value: true, label: 'Has Tracking' },
                { value: false, label: 'No Tracking' },
              ]}
              onChange={(value) => setFilters((prev) => ({ ...prev, page: 1, hasTracking: value ?? '' }))}
            />

            <Button
              type="primary"
              icon={<LuUpload size={16} />}
              disabled={selectedRows.length === 0}
              onClick={openUploadModal}
              className="ml-auto shrink-0 !bg-neutral-950 hover:!bg-neutral-800"
            >
              Upload Tracking{selectedRows.length ? ` (${selectedRows.length})` : ''}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 rounded-lg border border-neutral-200 bg-white overflow-hidden flex flex-col">
          <Table
            columns={columns}
            dataSource={rows}
            loading={loading}
            className="min-h-0"
            scroll={{ x: 1100, y: 'calc(100vh - 235px)' }}
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
          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-neutral-200 px-4 py-2">
            <div className="text-xs text-neutral-500">
              Selected: <span className="font-semibold text-neutral-900">{selectedRows.length}</span>
            </div>
            <Pagination
              current={filters.page}
              pageSize={filters.perPage}
              total={total}
              showSizeChanger
              pageSizeOptions={[10, 20, 50, 100]}
              showTotal={(value) => `Total ${value} orders`}
              onChange={(page, pageSize) => setFilters((prev) => ({ ...prev, page, perPage: pageSize }))}
            />
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
        okButtonProps={{ className: '!bg-neutral-950 hover:!bg-neutral-800' }}
      >
        <div className="space-y-4 pt-2">
          {selectedRows.length === 1 ? (
            <div>
              <div className="mb-1 text-xs font-semibold text-neutral-600">Order ID</div>
              <Input value={selectedOrder?.orderId || ''} disabled />
            </div>
          ) : (
            <div className="rounded border border-neutral-200 p-3 text-sm text-neutral-700">
              {selectedRows.length} orders selected. Payload se gui theo batch items.
            </div>
          )}
          <div>
            <div className="mb-1 text-xs font-semibold text-neutral-600">Shop / Machine ID</div>
            <Input value={selectedRows[0]?.shopId || ''} disabled />
          </div>
          {selectedRows.length === 1 && (
            <div>
              <div className="mb-1 text-xs font-semibold text-neutral-600">Tracking Number</div>
              <Input
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
