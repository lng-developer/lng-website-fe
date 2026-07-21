import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Flex, Form, Input, Modal, Pagination, Select, Table, Tooltip } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { formatDistanceToNow } from 'date-fns';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { MdOutlineRefresh } from 'react-icons/md';
import { FaShopify } from 'react-icons/fa';
import { TbEdit } from 'react-icons/tb';
import ButtonFilter from '../../components/ButtonFilter';
import DateRangePicker from '../../components/DateRangePicker';
import SelectFilter from '../../components/SelectFilter';
import StatusComponent from '../../components/StatusComponent';
import ItemCustomer from './table/ItemCustomer';
import SubItemSku from './table/SubItemSku';
import { dataColors } from '../../utils/dataColors';
import { defaultFrom, defaultTo, formatDate } from '../../utils/fomatDate';
import { cancelShopifyOrder, getAllShopifyOrders, updateShopifyFulfillment } from '../../apis/shopify';
import dayjs from 'dayjs';

const LAST_UPDATED_KEY = 'orders_shopify_last_updated_at';
const PAGE_SIZE = 10;
const { TextArea } = Input;
const SHOPIFY_TRACKING_URL = 'https://portal.lngmerch.co';

const shopifyStatusFilters = [
  { key: 'all', title: 'All', status: '', count: 0 },
  { key: 'new', title: 'New', status: 'new', count: 0 },
  { key: 'mapped', title: 'Mapped', status: 'mapped', count: 0 },
  { key: 'need_review', title: 'Need Review', status: 'need_review', count: 0 },
  { key: 'ready_for_fulfillment', title: 'Ready FF', status: 'ready_for_fulfillment', count: 0 },
  { key: 'cancelled', title: 'Cancelled', status: 'cancelled', count: 0 },
];

const importStatusOptions = ['preview', 'imported', 'skipped', 'failed'];
const financialStatusOptions = ['paid', 'pending', 'refunded', 'partially_refunded', 'voided'];
const fulfillmentStatusOptions = ['fulfilled', 'partial', 'unfulfilled'];
const cancelReasonOptions = ['CUSTOMER', 'DECLINED', 'FRAUD', 'INVENTORY', 'STAFF', 'OTHER'];
const defaultCancelValues = {
  reason: 'CUSTOMER',
  notifyCustomer: false,
  restock: false,
  refundOriginalPayment: false,
  staffNote: 'Cancelled from LNG portal',
};
const shopifyActionButtonClass =
  'inline-flex h-8 w-[112px] items-center justify-center rounded-md border px-3 text-xs font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#94a3b8] disabled:cursor-not-allowed disabled:opacity-60';

const getDateValue = (value) => {
  if (!value) return '';
  if (value?.$date) return value.$date;
  return value;
};

const normalizeCustomerInfo = (order) => {
  const address = order?.shippingAddress || order?.rawShopifyOrder?.shipping_address || {};
  const customer = order?.customer || order?.rawShopifyOrder?.customer || {};

  return {
    name: address.name || customer.displayName || `${customer.firstName || customer.first_name || ''} ${customer.lastName || customer.last_name || ''}`.trim(),
    email: order?.email || customer.email || '',
    address: address.address1 || '',
    address_2: address.address2 || '',
    city: address.city || '',
    state: address.provinceCode || address.province || '',
    zip_code: address.zip || '',
    country: address.country || '',
    phone_number: address.phone || order?.phone || customer.phone || '',
  };
};

const getOrderId = (order) => order?.shopifyOrderName || order?.name || order?.shopifyOrderId || order?._id;
const getLineItemId = (item, index) => item?.shopifyLineItemId || item?.id || item?.shopifyLineItemGid || String(index);
const getOrderStatusUrl = (order = {}) =>
  order?.orderStatusUrl ||
  order?.order_status_url ||
  order?.rawShopifyOrder?.order_status_url ||
  order?.rawShopifyOrder?.orderStatusUrl ||
  order?.rawShopifyOrder?.status_url ||
  '';
const formatMoney = (money) => {
  const amount = money?.amount || money?.shopAmount || money;
  const currency = money?.currencyCode || money?.shopCurrencyCode || '';
  return amount ? `${amount}${currency ? ` ${currency}` : ''}` : '---';
};

const getLineItemSize = (lineItem = {}) =>
  lineItem.size ||
  lineItem.Size ||
  lineItem.variantSize ||
  lineItem.rawLineItem?.size ||
  lineItem.rawLineItem?.Size ||
  normalizeKeyValueArray(lineItem.customAttributes)?.size ||
  normalizeKeyValueArray(lineItem.customAttributes)?.Size ||
  normalizeKeyValueArray(lineItem.properties)?.size ||
  normalizeKeyValueArray(lineItem.properties)?.Size ||
  '';

const resolveCarrierInfo = (tracking = '') => {
  const normalized = String(tracking || '').trim().toUpperCase();

  if (normalized.startsWith('4PX')) {
    return { carrierCode: '4PX', shipMethod: '4PX-Global Express' };
  }

  if (normalized.startsWith('UK') || normalized.startsWith('UL')) {
    return { carrierCode: 'Yanwen', shipMethod: 'Yanwen Air Economy Mail General' };
  }

  if (normalized.startsWith('YT')) {
    return { carrierCode: 'YunExpress', shipMethod: 'YunExpress Global Direct line (standard)-Tracked' };
  }

  return { carrierCode: 'USPS', shipMethod: 'USPS First Class' };
};

const resolveImageValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return resolveImageValue(value[0]);
  return value.url || value.src || value.imageUrl || value.originalSrc || value.transformedSrc || value.value || '';
};

const resolveImageValues = (value) => {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(resolveImageValues);
  return [value.url, value.src, value.imageUrl, value.originalSrc, value.transformedSrc, value.value].flatMap(resolveImageValues).filter(Boolean);
};

const normalizeKeyValueArray = (value) => {
  if (!Array.isArray(value)) return value;
  return value.reduce((result, entry, index) => {
    if (!entry || typeof entry !== 'object') {
      result[index] = entry;
      return result;
    }

    const key = entry.name || entry.key || entry.label || entry.title || String(index);
    result[key] = entry.value ?? entry.url ?? entry.src ?? entry.imageUrl ?? entry;
    return result;
  }, {});
};

const isImageRelatedKey = (key) => /(image|photo|url|file|snapshot|preview|mockup|artwork|design|personalization|custom)/i.test(String(key));

const collectImageRelatedFields = (value, path = '', results = []) => {
  const normalizedValue = normalizeKeyValueArray(value);

  if (!normalizedValue || typeof normalizedValue !== 'object') return results;

  Object.entries(normalizedValue).forEach(([key, entryValue]) => {
    const nextPath = path ? `${path}.${key}` : key;
    const imageUrl = resolveImageValue(entryValue);

    if (isImageRelatedKey(nextPath) && (imageUrl || entryValue)) {
      results.push({
        key: nextPath,
        value: entryValue,
        imageUrl,
      });
    }

    if (entryValue && typeof entryValue === 'object') {
      collectImageRelatedFields(entryValue, nextPath, results);
    }
  });

  return results;
};

const getCustomFieldValue = (lineItem = {}, fieldName) => {
  const customFileMatch = [
    ...(lineItem.customFiles || []),
    ...(lineItem.rawLineItem?.customFiles || []),
  ].find((file) => file?.key === fieldName);

  if (customFileMatch) return customFileMatch.url ?? customFileMatch.value ?? customFileMatch;

  const sources = [
    lineItem,
    lineItem.rawLineItem,
    getCustomallPayload(lineItem),
    normalizeKeyValueArray(lineItem.customAttributes),
    normalizeKeyValueArray(lineItem.rawLineItem?.customAttributes),
    normalizeKeyValueArray(lineItem.properties),
    normalizeKeyValueArray(lineItem.rawLineItem?.properties),
  ];

  for (const source of sources) {
    if (source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, fieldName)) {
      return source[fieldName];
    }
  }

  return undefined;
};

const getCustomFileUrls = (lineItem = {}, fieldName) =>
  [
    ...(lineItem.customFiles || []),
    ...(lineItem.rawLineItem?.customFiles || []),
  ]
    .filter((file) => file?.key === fieldName)
    .map((file) => file?.url || file?.value)
    .filter(Boolean);

const getCustomallPayload = (lineItem = {}) =>
  lineItem.customall ||
  lineItem.customAll ||
  lineItem.rawLineItem?.customall ||
  lineItem.rawLineItem?.customAll ||
  lineItem.properties?.customall ||
  lineItem.properties?.customAll ||
  {};

const getCustomallImageFields = (lineItem = {}) => {
  const payloads = [
    getCustomallPayload(lineItem),
    lineItem.customAttributes,
    lineItem.rawLineItem?.customAttributes,
    lineItem.properties,
    lineItem.rawLineItem?.properties,
  ];

  return payloads.flatMap((payload) => collectImageRelatedFields(payload, payload === getCustomallPayload(lineItem) ? 'customall' : ''));
};

const getShopifyImageUrls = (lineItem = {}, order = {}) => {
  const rawLineItem = lineItem.rawLineItem || {};
  const customallImageFields = getCustomallImageFields(lineItem);
  const customallPreview = getCustomFieldValue(lineItem, '_customall_preview');
  const candidates = [
    customallPreview,
    ...customallImageFields.map((field) => field.value),
    lineItem.imageUrl,
    lineItem.image,
    lineItem.productImage,
    lineItem.variantImage,
    lineItem.featuredImage,
    lineItem.images,
    rawLineItem.imageUrl,
    rawLineItem.image,
    rawLineItem.productImage,
    rawLineItem.variantImage,
    rawLineItem.featuredImage,
    rawLineItem.images,
    order.imageUrl,
    order.image,
    order.productImage,
    order.featuredImage,
  ];

  return [...new Set(candidates.flatMap(resolveImageValues).filter(Boolean))];
};

const getShopifyImageUrl = (lineItem = {}, order = {}) => {
  return getShopifyImageUrls(lineItem, order)[0] || '';
};

const ShopifyProductImages = ({ imageUrls = [], imageSize = 72, onImageClick }) => {
  if (!imageUrls.length) {
    return <StatusComponent title="No image" color={dataColors.default} />;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {imageUrls.map((imageUrl) => {
        const imageNode = (
          <img
            src={imageUrl}
            alt="Product Image"
            className="rounded border border-[#e2e8f0]"
            style={{ width: imageSize, height: imageSize, objectFit: 'contain' }}
          />
        );

        if (onImageClick) {
          return (
            <button key={imageUrl} className="inline-flex cursor-pointer" onClick={() => onImageClick(imageUrl)}>
              {imageNode}
            </button>
          );
        }

        return (
          <a key={imageUrl} href={imageUrl} target="_blank" className="inline-flex">
            {imageNode}
          </a>
        );
      })}
    </div>
  );
};

const ShopifyProductImage = ({ imageUrl, onPreview }) => (
  <ShopifyProductImages imageUrls={imageUrl ? [imageUrl] : []} onImageClick={onPreview ? () => onPreview(imageUrl) : undefined} />
);

const ShopifySizeField = ({ size }) => {
  if (!size) return null;

  return (
    <div className="mt-2 flex flex-col items-start gap-1">
      <span className="text-xs font-medium" style={{ color: dataColors.title }}>
        Size
      </span>
      <StatusComponent title={size} color={dataColors.pink} />
    </div>
  );
};

const ShopifyQuantityCell = ({ quantity }) => (
  <div className="flex flex-col items-center justify-center gap-1">
    <span className="text-xs font-medium" style={{ color: dataColors.title }}>
      Quantity
    </span>
    <StatusComponent title={Number(quantity) > 0 ? Number(quantity) : 1} color={dataColors.default} isDefault />
  </div>
);

const ShopifyQtyPriceCell = ({ quantity, price }) => (
  <div className="flex flex-col items-center justify-center gap-3">
    <ShopifyQuantityCell quantity={quantity} />
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium" style={{ color: dataColors.title }}>
        Price
      </span>
      <StatusComponent title={formatMoney(price)} color={dataColors.process} />
    </div>
  </div>
);

const ShopifyActionLink = ({ href, children }) => {
  if (!href) {
    return <StatusComponent title="No link" color={dataColors.default} />;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${shopifyActionButtonClass} !border-[#0f766e] !bg-[#0f766e] !text-white hover:!bg-[#0d9488]`}
    >
      {children}
    </a>
  );
};

const ShopifyPrintFilesPreview = ({ printFiles = [], onShow }) => {
  const imageUrls = resolveImageValues(printFiles).slice(0, 1);
  if (!imageUrls.length) {
    return <StatusComponent title="No print files" color={dataColors.default} />;
  }

  return (
    <button
      className={`${shopifyActionButtonClass} cursor-pointer border-[#64748b] bg-[#64748b] !text-white hover:bg-[#475569]`}
      onClick={() => onShow?.(imageUrls)}
    >
      Print Files
    </button>
  );
};

const ShopifyTrackingAndNote = ({ shopifyOrderId, trackingInfo = {}, status, onUpdated }) => {
  const [form] = Form.useForm();
  const [isUpdating, setIsUpdating] = useState(false);
  const trackingValue = Form.useWatch('tracking', form);
  const trackingNumber = String(trackingValue || '').trim();
  const carrierInfo = resolveCarrierInfo(trackingNumber);

  const handleUpdateTracking = async (values) => {
    const nextTrackingNumber = String(values.tracking || '').trim();

    if (!nextTrackingNumber) {
      toast.error('Tracking number is required');
      return;
    }

    if (!shopifyOrderId) {
      toast.error('Missing Shopify order ID');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await updateShopifyFulfillment(shopifyOrderId, {
        trackingNumber: nextTrackingNumber,
        trackingCompany: resolveCarrierInfo(values.tracking).carrierCode,
        trackingUrl: SHOPIFY_TRACKING_URL,
      });

      if (response.status >= 200 && response.status < 300) {
        toast.success('Update Shopify tracking success!');
        onUpdated?.();
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Update Shopify tracking error!');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ maxWidth: 320 }}>
      <Form
        form={form}
        layout="vertical"
        size="middle"
        onFinish={handleUpdateTracking}
        initialValues={{
          fulfillment: trackingInfo?.fulfillment || trackingInfo?.trackingCompany || '',
          tracking: trackingInfo?.trackingNumber || '',
          status: status || 'Fulfilled',
          note: trackingInfo?.note || trackingInfo?.message || '',
        }}
      >
        <Form.Item name="fulfillment">
          <Input placeholder="Fulfillment" style={{ marginBottom: 10 }} />
        </Form.Item>
        <Form.Item name="tracking">
          <Input placeholder="Tracking" style={{ marginBottom: 10 }} />
        </Form.Item>
        <Form.Item name="status">
          <Select
            options={[
              { value: 'New', label: 'New' },
              { value: 'Fulfilled', label: 'Fulfilled' },
              { value: 'Shipped', label: 'Shipped' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
            placeholder="Status"
            style={{ marginBottom: 10 }}
          />
        </Form.Item>
        <Form.Item name="note">
          <TextArea rows={2} placeholder="Note" maxLength={200} style={{ marginBottom: 10 }} />
        </Form.Item>
        <div className="mb-2 text-xs" style={{ color: dataColors.title }}>
          carrier:{carrierInfo.carrierCode}
        </div>
        <Form.Item>
          <Button block icon={<TbEdit />} htmlType="submit" loading={isUpdating} disabled={!trackingNumber || isUpdating} style={{ width: '33%' }}>
            Update
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

const ShopifyLineItemActions = ({
  printFiles,
  customizedUrl,
  paymentsUrl,
  onShowPrintFiles,
  onViewDetails,
  onCancel,
  cancelDisabled,
}) => (
  <div className="grid grid-cols-1 gap-2 justify-items-center">
    <div className="flex flex-col items-center">
      <ShopifyPrintFilesPreview printFiles={printFiles} onShow={onShowPrintFiles} />
    </div>
    <div className="flex flex-col items-center">
      <ShopifyActionLink href={customizedUrl}>Product Link</ShopifyActionLink>
    </div>
    <Button
      type="primary"
      size="small"
      className="!h-8 !w-[112px] !rounded-md !px-3 !text-xs !font-semibold shadow-sm transition-all duration-150 hover:!-translate-y-0.5 hover:!shadow-md"
      onClick={onViewDetails}
    >
      View Details
    </Button>
    {paymentsUrl ? (
      <a
        href={paymentsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 w-[112px] items-center justify-center rounded-md border !border-[#f59e0b] !bg-[#f59e0b] px-3 text-xs font-semibold !text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:!bg-[#d97706] hover:!text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
      >
        Payments
      </a>
    ) : (
      <Button
        size="small"
        className="!h-8 !w-[112px] !rounded-md !border-[#f59e0b] !bg-[#f59e0b] !px-3 !text-xs !font-semibold !text-white opacity-60 [&>span]:!text-white"
        disabled
      >
        Payments
      </Button>
    )}
    <Button
      danger
      size="small"
      className="!h-8 !w-[112px] !rounded-md !px-3 !text-xs !font-semibold shadow-sm transition-all duration-150 hover:!-translate-y-0.5 hover:!shadow-md"
      disabled={cancelDisabled}
      onClick={onCancel}
    >
      Cancelled
    </Button>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 rounded border border-[#e2e8f0] p-2">
    <span className="text-xs font-medium" style={{ color: dataColors.title }}>
      {label}
    </span>
    <span className="text-sm font-medium break-all">{value || '---'}</span>
  </div>
);

const DetailSection = ({ title, children }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-base font-semibold !mb-0">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{children}</div>
  </div>
);

const OrderShopify = () => {
  const { collapsed } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [tabFilter, setTabFilter] = useState(shopifyStatusFilters);
  const [isActiveFilter, setIsActivefilter] = useState(shopifyStatusFilters[0]);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [isShowRowkeys, setIsShowRowKeys] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tableHeight, setTableHeight] = useState(0);
  const [shopDomain, setShopDomain] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [financialStatus, setFinancialStatus] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [printFilePreviewUrls, setPrintFilePreviewUrls] = useState([]);
  const [productPreviewUrl, setProductPreviewUrl] = useState('');
  const [cancelForm] = Form.useForm();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => {
    const saved = localStorage.getItem(LAST_UPDATED_KEY);
    return saved ? new Date(saved) : null;
  });
  const [filters, setFilters] = useState({
    page: currentPage,
    perPage: PAGE_SIZE,
    from: defaultFrom,
    to: defaultTo,
    search: '',
    shopDomain: '',
    processStatus: '',
    financialStatus: '',
    fulfillmentStatus: '',
    importStatus: '',
    sortBy: 'purchaseDate',
    sortOrder: 'desc',
  });

  const updateLastUpdatedAt = useCallback(() => {
    const now = new Date();
    setLastUpdatedAt(now);
    localStorage.setItem(LAST_UPDATED_KEY, now.toISOString());
  }, []);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdatedAt) return 'Last updated: ---';
    return `Last updated at ${dayjs(lastUpdatedAt).format('HH:mm')}`;
  }, [lastUpdatedAt]);

  const updateFilter = useCallback((newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : prev.page,
    }));
  }, []);

  const fetchAllOrder = useCallback(
    async (params) => {
      setLoading(true);
      try {
        const response = await getAllShopifyOrders(params);
        if (response.status === 200) {
          const data = response.data?.items || [];
          setOrders(Array.isArray(data) ? data : []);
          setTotalCount(response.data?.total ?? 0);
        } else {
          toast.error(response.data?.message || 'Error loading Shopify orders');
        }
      } catch (error) {
        console.error(error);
        toast.error(error?.response?.data?.message || 'Error loading Shopify orders');
      } finally {
        setLoading(false);
        updateLastUpdatedAt();
      }
    },
    [updateLastUpdatedAt]
  );

  const handleCopy = useCallback(async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(String(textToCopy || ''));
      toast.info('Copied to clipboard');
    } catch (error) {
      console.error(error);
      toast.error('Failed to copy!');
    }
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((keyword) => {
        updateFilter({ search: keyword || '', page: 1 });
      }, 300),
    [updateFilter]
  );

  const handleStatusFilter = useCallback(
    (status) => {
      if (!status) {
        return updateFilter({ processStatus: '', page: 1 });
      }
      updateFilter({ processStatus: status, page: 1 });
    },
    [updateFilter]
  );

  const handleExpand = useCallback((expanded, record) => {
    setExpandedRowKeys((prev) => (expanded ? [...prev, record.key] : prev.filter((key) => key !== record.key)));
  }, []);

  const handleShowRowKeys = useCallback(() => {
    setExpandedRowKeys(() => (isShowRowkeys ? [] : orders.map((item) => getOrderId(item))));
    setIsShowRowKeys((prev) => !prev);
  }, [isShowRowkeys, orders]);

  const handleOpenCancelOrder = useCallback(
    (order) => {
      setSelectedCancelOrder(order);
      cancelForm.setFieldsValue(defaultCancelValues);
    },
    [cancelForm]
  );

  const submitCancelOrder = useCallback(
    async (values, extraPayload = {}) => {
      const shopifyOrderId = selectedCancelOrder?.shopifyOrderId;

      if (!shopifyOrderId) {
        toast.error('Missing Shopify order ID');
        return;
      }

      const payload = {
        reason: values.reason || defaultCancelValues.reason,
        notifyCustomer: Boolean(values.notifyCustomer),
        restock: Boolean(values.restock),
        refundOriginalPayment: Boolean(values.refundOriginalPayment),
        staffNote: values.staffNote || defaultCancelValues.staffNote,
        ...extraPayload,
      };

      setIsCanceling(true);
      try {
        const response = await cancelShopifyOrder(shopifyOrderId, payload);

        if (response.status >= 200 && response.status < 300) {
          toast.success(response.data?.alreadyCancelled ? 'Shopify order already cancelled' : 'Cancel Shopify order success!');
          setSelectedCancelOrder(null);
          cancelForm.resetFields();
          fetchAllOrder(filters);
        }
      } catch (error) {
        const message = error?.response?.data?.message || 'Cancel Shopify order error!';
        const isAlreadyShipped = error?.response?.status === 400 && /already shipped/i.test(message);

        if (isAlreadyShipped && !payload.force) {
          Modal.confirm({
            title: 'Force cancel shipped order?',
            content: message,
            okText: 'Force Cancel',
            okButtonProps: { danger: true },
            cancelText: 'Back',
            onOk: () =>
              submitCancelOrder(values, {
                force: true,
                staffNote: values.staffNote || 'Force cancel from LNG portal',
              }),
          });
        } else {
          toast.error(message);
        }
      } finally {
        setIsCanceling(false);
      }
    },
    [cancelForm, fetchAllOrder, filters, selectedCancelOrder?.shopifyOrderId]
  );

  const columns = useMemo(
    () => [
      { title: <span style={{ color: dataColors.title }}>Order ID</span>, dataIndex: 'order', key: 'order', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Shopify ID</span>, dataIndex: 'shopify_id', key: 'shopify_id', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Status</span>, dataIndex: 'status', key: 'status', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Import</span>, dataIndex: 'import_status', key: 'import_status', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Created At</span>, dataIndex: 'created', key: 'created', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Order Date</span>, dataIndex: 'order_date', key: 'order_date', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Customer</span>, dataIndex: 'customer', key: 'customer', align: 'center' },
      { title: <span style={{ color: dataColors.title, marginLeft: !collapsed ? 0 : -5 }}>Total</span>, dataIndex: 'total', key: 'total', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Store</span>, dataIndex: 'store', key: 'store', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Financial</span>, dataIndex: 'financial', key: 'financial', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Fulfillment</span>, dataIndex: 'fulfillment', key: 'fulfillment', align: 'center' },
      { title: <span style={{ color: dataColors.title }}>Sync</span>, dataIndex: 'sync', key: 'sync', align: 'center' },
    ],
    [collapsed]
  );

  const expandedRowRender = useCallback((record) => {
    const subColumns = [
      { title: <span style={{ color: dataColors.title }}>Product Image</span>, dataIndex: 'image', key: 'image', align: 'center', width: 120 },
      { title: <span style={{ color: dataColors.title }}>Product</span>, dataIndex: 'product', key: 'product', width: 320 },
      { title: <span style={{ color: dataColors.title }}>SKU, Variant & Seller</span>, dataIndex: 'sku', key: 'sku', width: 330 },
      { title: <span style={{ color: dataColors.title }}>QTY & Price</span>, dataIndex: 'qty_price', key: 'qty_price', align: 'center', width: 140 },
      { title: <span style={{ color: dataColors.title }}>Actions</span>, dataIndex: 'actions', key: 'actions', align: 'center', width: 150 },
      {
        title: <span style={{ color: dataColors.title }}>Tracking & Note</span>,
        dataIndex: 'tracking_note',
        key: 'tracking_note',
        width: 320,
      },
    ];

    return (
      <Table
        columns={subColumns}
        dataSource={record.subItems}
        pagination={false}
        rowKey="key"
        rowClassName={() => 'table-row-center'}
        style={{ padding: 16 }}
        tableLayout="fixed"
        scroll={{ x: 1530 }}
      />
    );
  }, []);

  const tableData = useMemo(
    () =>
      (orders || []).map((item, index) => {
        const orderId = getOrderId(item);
        const createdAt = getDateValue(item?.createdAt);
        const purchaseDate = getDateValue(item?.purchaseDate || item?.rawShopifyOrder?.created_at);
        const customerInfo = normalizeCustomerInfo(item);

        return {
          key: orderId,
          order: (
            <button className="cursor-pointer" onClick={() => handleCopy(orderId)}>
              <StatusComponent title={orderId} color={dataColors.default} isDefault={true} />
            </button>
          ),
          shopify_id: <StatusComponent title={item?.shopifyOrderId || '---'} color={dataColors.asin} />,
          status: <StatusComponent title={item?.processStatus || 'new'} color={dataColors.success} />,
          import_status: <StatusComponent title={item?.importStatus || '---'} color={dataColors.pink} />,
          created: (
            <Flex vertical>
              <span className="font-medium whitespace-nowrap">{createdAt ? formatDate(createdAt) : '---'}</span>
              <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
                {createdAt ? `(${formatDistanceToNow(new Date(createdAt), { addSuffix: true }).replace(/^about /, '').replace(/^less than /, '')})` : ''}
              </span>
            </Flex>
          ),
          order_date: (
            <Flex vertical>
              <span className="font-medium whitespace-nowrap">{purchaseDate ? formatDate(purchaseDate) : '---'}</span>
              <span className="whitespace-nowrap" style={{ color: dataColors.title }}>
                {purchaseDate ? `(${formatDistanceToNow(new Date(purchaseDate), { addSuffix: true }).replace(/^about /, '').replace(/^less than /, '')})` : ''}
              </span>
            </Flex>
          ),
          customer: <ItemCustomer customerInfor={customerInfo} orderId={orderId} fetchAllOrder={fetchAllOrder} filters={filters} />,
          total: <StatusComponent title={formatMoney(item?.totalPrice || item?.rawShopifyOrder?.total_price)} color={dataColors.process} />,
          store: <StatusComponent title={item?.shopDomain || 'No Data'} color={dataColors.pending} />,
          financial: <StatusComponent title={item?.financialStatus || '---'} color={dataColors.success} />,
          fulfillment: <StatusComponent title={item?.fulfillmentStatus || '---'} color={dataColors.process} />,
          sync: (
            <Flex vertical>
              <span className="font-medium whitespace-nowrap">
                {getDateValue(item?.lastShopifySyncAt || item?.updatedAtShopify) ? formatDate(getDateValue(item?.lastShopifySyncAt || item?.updatedAtShopify)) : '---'}
              </span>
            </Flex>
          ),
          subItems: (item?.items || item?.rawShopifyOrder?.line_items || []).map((lineItem, lineIndex) => {
            const lineItemId = getLineItemId(lineItem, lineIndex);
            const previewImageUrl = resolveImageValue(getCustomFieldValue(lineItem, '_customall_preview')) || getShopifyImageUrl(lineItem, item);
            const printFiles = getCustomFileUrls(lineItem, '_print_files').length
              ? getCustomFileUrls(lineItem, '_print_files')
              : getCustomFieldValue(lineItem, '_print_files');
            const customizedUrl = resolveImageValue(getCustomFieldValue(lineItem, '_customized_url'));
            return {
              key: `${index}-${lineItemId}`,
              image: <ShopifyProductImage imageUrl={previewImageUrl} onPreview={setProductPreviewUrl} />,
              product: (
                <Flex vertical gap={4}>
                  <span className="font-medium">{lineItem?.title || lineItem?.name || 'No product title'}</span>
                  <ShopifySizeField size={getLineItemSize(lineItem) || lineItem?.variantTitle || lineItem?.variant_title} />
                  <span className="text-xs" style={{ color: dataColors.title }}>
                    Line Item: {lineItem?.shopifyLineItemId || lineItem?.id || '---'}
                  </span>
                </Flex>
              ),
              sku: <SubItemSku sku={lineItem?.sku} sellerName={lineItem?.vendor || item?.shopDomain || 'Shopify'} />,
              actions: (
                <ShopifyLineItemActions
                  printFiles={printFiles}
                  customizedUrl={customizedUrl}
                  paymentsUrl={getOrderStatusUrl(item)}
                  onShowPrintFiles={setPrintFilePreviewUrls}
                  onViewDetails={() => setSelectedOrderDetail(item)}
                  cancelDisabled={['cancelled', 'shipped'].includes(String(item?.processStatus || '').toLowerCase())}
                  onCancel={() => handleOpenCancelOrder(item)}
                />
              ),
              tracking_note: (
                <ShopifyTrackingAndNote
                  shopifyOrderId={item?.shopifyOrderId}
                  trackingInfo={item?.trackingInfo}
                  status={item?.processStatus}
                  onUpdated={() => fetchAllOrder(filters)}
                />
              ),
              qty_price: <ShopifyQtyPriceCell quantity={lineItem?.quantity} price={lineItem?.originalUnitPrice || lineItem?.price} />,
            };
          }),
        };
      }),
    [fetchAllOrder, filters, handleCopy, handleOpenCancelOrder, orders]
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(filters.page);
  }, [filters.page]);

  useEffect(() => {
    fetchAllOrder(filters);
  }, [fetchAllOrder, filters]);

  useEffect(() => {
    if (isShowRowkeys) {
      setExpandedRowKeys(orders.map((item) => getOrderId(item)));
    }
  }, [orders, isShowRowkeys]);

  useEffect(() => {
    const handleResize = () => {
      const headerHeight = 220;
      setTableHeight(window.innerHeight - headerHeight - 20);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="overflow-hidden">
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0 flex items-center gap-2" style={{ color: 'black' }}>
            <FaShopify size={22} />
            Manage Orders Shopify
            <span className="text-xs ml-3 italic" style={{ color: dataColors.title, fontStyle: 'italic' }}>
              {lastUpdatedText}
            </span>
          </h1>
          <DateRangePicker mode="range" showOutsideDays updateFilter={updateFilter} />
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex gap-3 items-center">
          {tabFilter.map((item) => (
            <ButtonFilter
              key={item.key}
              item={item}
              isActive={isActiveFilter?.key}
              handleFilterForStatus={handleStatusFilter}
              setIsActivefilter={setIsActivefilter}
              count={item.count}
            />
          ))}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="w-[280px] flex-none">
              <Input
                onChange={(event) => debouncedSearch(event.target.value)}
                placeholder="Search Shopify orders..."
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full"
              />
            </div>
            <SelectFilter
              title="Shop"
              ListData={[...new Set((orders || []).map((item) => item?.shopDomain).filter(Boolean))]}
              value={shopDomain}
              onChange={(value) => {
                setShopDomain(value);
                updateFilter({ shopDomain: value, page: 1 });
              }}
            />
            <SelectFilter
              title="Import"
              ListData={importStatusOptions}
              value={importStatus}
              onChange={(value) => {
                setImportStatus(value || '');
                updateFilter({ importStatus: value || '', page: 1 });
              }}
            />
            <SelectFilter
              title="Financial"
              ListData={financialStatusOptions}
              value={financialStatus}
              onChange={(value) => {
                setFinancialStatus(value || '');
                updateFilter({ financialStatus: value || '', page: 1 });
              }}
            />
            <SelectFilter
              title="Fulfillment"
              ListData={fulfillmentStatusOptions}
              value={fulfillmentStatus}
              onChange={(value) => {
                setFulfillmentStatus(value || '');
                updateFilter({ fulfillmentStatus: value || '', page: 1 });
              }}
            />
            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => {
                  fetchAllOrder(filters);
                  toast.success('Refresh success!');
                }}
              >
                <MdOutlineRefresh size={20} />
              </button>
            </Tooltip>
          </div>
          <Pagination
            total={totalCount}
            showTotal={(total) => `Total ${total} items`}
            pageSize={filters.perPage}
            current={currentPage}
            onChange={(page, perPage) => updateFilter({ page, perPage })}
            onShowSizeChange={(page, perPage) => updateFilter({ page, perPage })}
            showSizeChanger
            className="custom-pagination"
          />
        </div>

        <div className="mt-4">
          <Table
            className="no-indent-table no-backgroud-title"
            columns={columns}
            dataSource={tableData}
            expandable={{
              indentSize: 0,
              expandedRowRender,
              expandedRowKeys,
              onExpand: handleExpand,
              expandIcon: ({ expanded, onExpand, record }) => (
                <div className="flex justify-center items-center h-full w-full cursor-pointer" onClick={(event) => onExpand(record, event)}>
                  {expanded ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
              columnTitle: (
                <div className="flex justify-center items-center h-full w-full cursor-pointer" onClick={handleShowRowKeys}>
                  {isShowRowkeys ? <IoIosArrowUp style={{ fontSize: 15 }} /> : <IoIosArrowDown style={{ fontSize: 15 }} />}
                </div>
              ),
            }}
            rowKey="key"
            bordered
            pagination={false}
            loading={loading}
            sticky={{ offsetHeader: 0 }}
            scroll={{ y: tableHeight }}
            tableLayout="auto"
          />
        </div>
      </div>

      <Modal
        title="Shopify Order Details"
        width={920}
        open={Boolean(selectedOrderDetail)}
        onCancel={() => setSelectedOrderDetail(null)}
        footer={null}
      >
        {selectedOrderDetail && (
          <Flex vertical gap={16}>
            <DetailSection title="Order">
              <DetailRow label="Order Name" value={selectedOrderDetail.shopifyOrderName} />
              <DetailRow label="Shopify ID" value={selectedOrderDetail.shopifyOrderId} />
              <DetailRow label="Shop Domain" value={selectedOrderDetail.shopDomain} />
              <DetailRow label="Duplicate Key" value={selectedOrderDetail.duplicateKey} />
              <DetailRow label="Fulfillment Order ID" value={selectedOrderDetail.fulfillmentOrderId} />
              <DetailRow label="Order Status URL" value={selectedOrderDetail.rawShopifyOrder?.order_status_url} />
              <DetailRow label="Updated At Shopify" value={getDateValue(selectedOrderDetail.updatedAtShopify)} />
              <DetailRow label="Last Shopify Sync" value={getDateValue(selectedOrderDetail.lastShopifySyncAt)} />
              <DetailRow label="Last Import" value={getDateValue(selectedOrderDetail.lastImportAt)} />
              <DetailRow label="Import Status" value={selectedOrderDetail.importStatus} />
              <DetailRow label="Process Status" value={selectedOrderDetail.processStatus} />
              <DetailRow label="Confirmation Number" value={selectedOrderDetail.rawShopifyOrder?.confirmation_number} />
            </DetailSection>

            <DetailSection title="Customer & Billing">
              <DetailRow label="Customer" value={selectedOrderDetail.customer?.displayName || selectedOrderDetail.shippingAddress?.name} />
              <DetailRow label="Email" value={selectedOrderDetail.email || selectedOrderDetail.customer?.email} />
              <DetailRow label="Phone" value={selectedOrderDetail.shippingAddress?.phone || selectedOrderDetail.phone} />
              <DetailRow label="Shipping Address" value={`${selectedOrderDetail.shippingAddress?.address1 || ''} ${selectedOrderDetail.shippingAddress?.address2 || ''}`.trim()} />
              <DetailRow label="Shipping City/State/Zip" value={`${selectedOrderDetail.shippingAddress?.city || ''}, ${selectedOrderDetail.shippingAddress?.provinceCode || selectedOrderDetail.shippingAddress?.province || ''} ${selectedOrderDetail.shippingAddress?.zip || ''}`.trim()} />
              <DetailRow label="Billing Address" value={`${selectedOrderDetail.billingAddress?.address1 || ''} ${selectedOrderDetail.billingAddress?.address2 || ''}`.trim()} />
            </DetailSection>

            <DetailSection title="Payment & Shipping">
              <DetailRow label="Total" value={formatMoney(selectedOrderDetail.totalPrice)} />
              <DetailRow label="Financial Status" value={selectedOrderDetail.financialStatus} />
              <DetailRow label="Fulfillment Status" value={selectedOrderDetail.fulfillmentStatus} />
              <DetailRow label="Payment Gateway" value={(selectedOrderDetail.rawShopifyOrder?.payment_gateway_names || []).join(', ')} />
              <DetailRow label="Shipping Method" value={(selectedOrderDetail.rawShopifyOrder?.shipping_lines || []).map((line) => line.title || line.code).filter(Boolean).join(', ')} />
              <DetailRow label="Tracking" value={selectedOrderDetail.trackingInfo?.trackingNumber} />
            </DetailSection>

            <div className="flex flex-col gap-2">
              <h3 className="text-base font-semibold !mb-0">Raw Payload</h3>
              <pre className="max-h-[320px] overflow-auto rounded border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs">
                {JSON.stringify(
                  {
                    rawShopifyOrder: selectedOrderDetail.rawShopifyOrder,
                    billingAddress: selectedOrderDetail.billingAddress,
                    items: selectedOrderDetail.items,
                    trackingInfo: selectedOrderDetail.trackingInfo,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </Flex>
        )}
      </Modal>
      <Modal
        title="Cancel Shopify Order"
        width={520}
        open={Boolean(selectedCancelOrder)}
        onCancel={() => {
          if (isCanceling) return;
          setSelectedCancelOrder(null);
          cancelForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={cancelForm} layout="vertical" initialValues={defaultCancelValues} onFinish={submitCancelOrder}>
          <div className="mb-3 rounded border border-[#fee2e2] bg-[#fef2f2] p-3 text-sm text-[#991b1b]">
            Cancellation on Shopify cannot be reversed.
          </div>
          <DetailRow label="Shopify ID" value={selectedCancelOrder?.shopifyOrderId} />
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Please select cancel reason' }]} className="!mt-3">
            <Select
              options={cancelReasonOptions.map((reason) => ({ value: reason, label: reason }))}
              placeholder="Select reason"
            />
          </Form.Item>
          <Form.Item name="staffNote" label="Staff Note" rules={[{ max: 255, message: 'Staff note max 255 characters' }]}>
            <Input.TextArea rows={3} maxLength={255} placeholder="Cancelled from LNG portal" />
          </Form.Item>
          <div className="grid grid-cols-1 gap-1">
            <Form.Item name="notifyCustomer" valuePropName="checked" className="!mb-1">
              <Checkbox>Notify customer</Checkbox>
            </Form.Item>
            <Form.Item name="restock" valuePropName="checked" className="!mb-1">
              <Checkbox>Restock inventory</Checkbox>
            </Form.Item>
            <Form.Item name="refundOriginalPayment" valuePropName="checked" className="!mb-3">
              <Checkbox>Refund original payment</Checkbox>
            </Form.Item>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setSelectedCancelOrder(null);
                cancelForm.resetFields();
              }}
              disabled={isCanceling}
            >
              Close
            </Button>
            <Button danger type="primary" htmlType="submit" loading={isCanceling}>
              Cancel Order
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        title="File Print"
        width={900}
        open={printFilePreviewUrls.length > 0}
        onCancel={() => setPrintFilePreviewUrls([])}
        footer={null}
      >
        <ShopifyProductImages imageUrls={printFilePreviewUrls} imageSize={720} />
      </Modal>
      <Modal
        title="Product Image"
        width={900}
        open={Boolean(productPreviewUrl)}
        onCancel={() => setProductPreviewUrl('')}
        footer={null}
      >
        <ShopifyProductImages imageUrls={productPreviewUrl ? [productPreviewUrl] : []} imageSize={720} />
      </Modal>
    </div>
  );
};

export default React.memo(OrderShopify);
