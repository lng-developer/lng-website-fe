const num = (value) => (Number.isFinite(+value) ? +value : 0);
const roundMoney = (value) => +num(value).toFixed(2);
const ETSY_IMAGE_VARIANT_PATTERN = /\/il_(?:fullxfull|\d+x(?:N|\d+))(?=\.)/i;
const DEFAULT_FREE = 21.5;

const formatOrderDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getEtsyPreviewImageUrl = (url = '') => {
  const normalizedUrl = typeof url === 'string' ? url.trim() : '';
  return normalizedUrl.replace(ETSY_IMAGE_VARIANT_PATTERN, '/il_fullxfull');
};

export const normalizeEtsyOrderCostOrder = (order = {}) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const baseCost = roundMoney(order.baseCost ?? order.base_cost);
  const free = roundMoney(order.free ?? DEFAULT_FREE);
  const revenue = roundMoney(order.revenue ?? order.total ?? order.total_price);
  const listingFee = roundMoney(order.listingFee ?? order.listing_fee);
  const transactionFee = roundMoney(order.transactionFee ?? order.transaction_fee);
  const paymentFee = roundMoney(order.paymentFee ?? order.payment_fee);
  const tax = roundMoney(order.tax);
  const offsiteAds = roundMoney(order.offsiteAds ?? order.offsite_ads);
  const discount = roundMoney(order.discount);
  const refund = roundMoney(order.refund);
  const totalCost = baseCost + free + listingFee + transactionFee + paymentFee + tax + offsiteAds + discount + refund;
  const profit = roundMoney(order.profit ?? revenue - totalCost);
  const orderDateRaw = order.orderDate ?? order.purchase_date ?? order.createdAt;

  return {
    orderId: String(order.orderId ?? ''),
    orderDate: orderDateRaw ? new Date(orderDateRaw).toISOString().slice(0, 10) : '',
    orderDateFmt: formatOrderDate(orderDateRaw),
    shopName: order.shopName ?? '',
    buyerName: order.buyerName ?? order.customer_infor?.name ?? '',
    country: order.country ?? order.customer_infor?.country ?? '',
    status: order.status ?? '',
    revenue,
    baseCost,
    free,
    listingFee,
    transactionFee,
    paymentFee,
    tax,
    offsiteAds,
    discount,
    refund,
    profit,
    items: items.map((item) => {
      const quantity = Math.max(1, num(item.quantity));
      const itemBaseCost = roundMoney(item.baseCost ?? item.base_cost ?? baseCost / Math.max(1, items.length) / quantity);

      const imageUrl = item.imageUrl ?? item.baseImageUrl ?? '';

      return {
        listingId: String(item.listingId ?? ''),
        title: item.title ?? '',
        sku: item.sku ?? '',
        quantity,
        price: roundMoney(item.price ?? item.unit_price),
        imageUrl,
        previewImageUrl: getEtsyPreviewImageUrl(imageUrl),
        baseCost: itemBaseCost,
      };
    }),
  };
};

export const normalizeEtsyOrderCostResponse = (payload = {}) => {
  const data = Array.isArray(payload.data) ? payload.data : [];

  return {
    orders: data.map(normalizeEtsyOrderCostOrder),
    totalCount: num(payload.totalCount ?? data.length),
    totalPages: num(payload.totalPages),
    currentPage: num(payload.currentPage),
  };
};

export const computeEtsyOrderStats = (orders = []) => {
  const stats = orders.reduce(
    (acc, order) => {
      acc.orders += 1;
      acc.revenue += num(order.revenue);
      acc.baseCost += num(order.baseCost);
      acc.free += num(order.free);
      acc.listingFee += num(order.listingFee);
      acc.transactionFee += num(order.transactionFee);
      acc.paymentFee += num(order.paymentFee);
      acc.tax += num(order.tax);
      acc.offsiteAds += num(order.offsiteAds);
      acc.discount += num(order.discount);
      acc.refund += num(order.refund);
      acc.profit += num(order.profit);
      return acc;
    },
    {
      orders: 0,
      revenue: 0,
      baseCost: 0,
      free: 0,
      listingFee: 0,
      transactionFee: 0,
      paymentFee: 0,
      tax: 0,
      offsiteAds: 0,
      discount: 0,
      refund: 0,
      profit: 0,
    }
  );

  Object.keys(stats).forEach((key) => {
    if (key !== 'orders') stats[key] = roundMoney(stats[key]);
  });

  return stats;
};

export const getEtsyOrderCostDetails = (order = {}) => [
  { key: 'revenue', label: 'Revenue', value: roundMoney(order.revenue) },
  { key: 'baseCost', label: 'Base Cost', value: roundMoney(order.baseCost) },
  { key: 'free', label: 'Free', value: roundMoney(order.free) },
  { key: 'listingFee', label: 'Listing Fee', value: roundMoney(order.listingFee) },
  { key: 'transactionFee', label: 'Transaction Fee', value: roundMoney(order.transactionFee) },
  { key: 'paymentFee', label: 'Payment Fee', value: roundMoney(order.paymentFee) },
  { key: 'tax', label: 'Tax', value: roundMoney(order.tax) },
  { key: 'offsiteAds', label: 'Offsite Ads', value: roundMoney(order.offsiteAds) },
  { key: 'discount', label: 'Discount', value: roundMoney(order.discount) },
  { key: 'refund', label: 'Refund', value: roundMoney(order.refund) },
  { key: 'profit', label: 'Profit', value: roundMoney(order.profit) },
];
