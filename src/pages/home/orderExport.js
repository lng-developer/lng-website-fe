import { format } from 'date-fns';

const ORDER_EXPORT_COLUMNS = [
  { header: 'Order ID', key: 'orderId', width: 18 },
  { header: 'Order Date', key: 'orderDate', width: 16 },
  { header: 'Status', key: 'status', width: 14 },
  { header: 'Shop', key: 'shop', width: 22 },
  { header: 'Seller', key: 'seller', width: 24 },
  { header: 'Customer', key: 'customer', width: 26 },
  { header: 'Address', key: 'address', width: 55 },
  { header: 'Shipping Type', key: 'shippingType', width: 18 },
  { header: 'SKU', key: 'sku', width: 28 },
  { header: 'Mapped SKU', key: 'mappedSku', width: 28 },
  { header: 'Listing', key: 'listing', width: 18 },
  { header: 'Order Item ID', key: 'orderItemId', width: 22 },
  { header: 'Quantity', key: 'quantity', width: 10 },
  { header: 'Cost Center', key: 'costCenter', width: 45 },
  { header: 'Tracking', key: 'tracking', width: 45 },
  { header: 'Base Cost', key: 'baseCost', width: 12 },
];

const compactJoin = (values, separator = ', ') =>
  values
    .map((value) => (value === null || value === undefined ? '' : String(value).trim()))
    .filter(Boolean)
    .join(separator);

const getAddress = (customer = {}) =>
  compactJoin([customer?.address, customer?.address_2, customer?.city, customer?.state, customer?.zip_code, customer?.country]);

const getSellerName = (seller) => {
  if (!seller) return '';
  if (typeof seller === 'string') return seller;
  return seller?.full_name || seller?.name || seller?.email || '';
};

const getCostCenter = (costCenter = {}) => {
  if (!costCenter || typeof costCenter !== 'object') return '';

  return compactJoin(
    [
      costCenter?.vendorProductDisplayName || costCenter?.display_name || costCenter?.name,
      costCenter?.sizeValue ? `Size: ${costCenter.sizeValue}` : '',
      costCenter?.colorValue ? `Color: ${costCenter.colorValue}` : '',
      costCenter?.sku ? `SKU: ${costCenter.sku}` : '',
    ],
    ' / '
  );
};

const getTracking = (trackingInfo = {}) => {
  if (!trackingInfo || typeof trackingInfo !== 'object') return '';

  const carrierAndNumber = compactJoin(
    [
      trackingInfo?.carrier || trackingInfo?.shippingCarrier || trackingInfo?.carrierName,
      trackingInfo?.trackingNumber || trackingInfo?.tracking_number || trackingInfo?.tracking,
    ],
    ' '
  );

  return compactJoin([carrierAndNumber, trackingInfo?.note], ' / ');
};

const buildOrderExportRows = (orders = []) =>
  (Array.isArray(orders) ? orders : []).flatMap((order) => {
    const customer = order?.customer_infor || {};
    const items = Array.isArray(order?.items) ? order.items : [];

    return items.map((item) => ({
      orderId: order?.orderId || '',
      orderDate: order?.purchase_date ? format(new Date(order.purchase_date), 'MMM d, yyyy') : '',
      status: order?.status || '',
      shop: order?.shopName || '',
      seller: getSellerName(order?.seller),
      customer: customer?.name || '',
      address: getAddress(customer),
      shippingType: order?.shipping_type || order?.shippingType || '',
      sku: item?.sku || '',
      mappedSku: item?.mapped_sku || '',
      listing: item?.listing || item?.listingId || '',
      orderItemId: item?.orderItemId || '',
      quantity: item?.quantity ?? '',
      costCenter: getCostCenter(item?.cost_center),
      tracking: getTracking(item?.tracking_info),
      baseCost: order?.base_cost ?? '',
    }));
  });

export { ORDER_EXPORT_COLUMNS, buildOrderExportRows };
