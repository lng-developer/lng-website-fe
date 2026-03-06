/**
 * etsy.mockData.js
 * ─────────────────────────────────────────────────────────────
 * Tập trung toàn bộ dữ liệu cứng (mock) cho các trang Etsy.
 * Khi API sẵn sàng, chỉ cần xóa file này và thay thế fetchMock*
 * bằng API call thực trong các hook tương ứng.
 * ─────────────────────────────────────────────────────────────
 */

const rand = (min, max, dp = 2) => +( Math.random() * (max - min) + min).toFixed(dp);
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Constant pools ──────────────────────────────────────────
const SHOP_NAMES = ['Etsy Shop A', 'Etsy Shop B', 'Etsy Shop C'];

const LISTING_TITLES = [
  'Custom Tumbler – Laser Engraved',
  'Personalized Dog Tag Necklace',
  'Family Portrait Illustration',
  'Monogram Tote Bag',
  'Custom Name Cutting Board',
  'Couple Phone Case',
  'Birthday Ornament – Custom Text',
  'Pet Portrait Canvas Print',
  'Coffee Mug – "World\'s Best Mom"',
  'Custom Baby Onesie',
  'Engraved Wedding Keepsake',
  'Chunky Knit Throw Blanket',
];

const PRODUCT_IMAGES = [
  'https://i.etsystatic.com/isla/c4f36d/76003793/isla_fullxfull.76003793_j1g4k8bh.jpg',
  'https://i.etsystatic.com/isla/3ff7c3/63280219/isla_fullxfull.63280219_3ql84klw.jpg',
  'https://i.etsystatic.com/isla/946cfc/71985534/isla_fullxfull.71985534_87x4j3qe.jpg',
];

const BUYER_NAMES = [
  'Emma Johnson', 'Liam Smith', 'Olivia Brown', 'Noah Davis',
  'Sophia Wilson', 'Mason Taylor', 'Ava Anderson', 'James Thomas',
  'Isabella Martinez', 'Ethan Garcia',
];

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany'];
const STATUSES  = ['completed', 'shipped', 'processing'];

const STATUS_WEIGHTS = { completed: 0.6, shipped: 0.3, processing: 0.1 };

const weightedStatus = () => {
  const r = Math.random();
  if (r < STATUS_WEIGHTS.completed) return 'completed';
  if (r < STATUS_WEIGHTS.completed + STATUS_WEIGHTS.shipped) return 'shipped';
  return 'processing';
};

// ── Date helpers ─────────────────────────────────────────────
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const datesBetween = (from, to) => {
  const dates = [];
  let cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur = addDays(cur, 1);
  }
  return dates;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ── Generate one mock Etsy order ─────────────────────────────
let _orderId = 3000000000;
const nextOrderId = () => String(++_orderId);

export const generateMockEtsyOrder = (date) => {
  const shopName   = pick(SHOP_NAMES);
  const revenue    = rand(40, 300);
  const baseCost   = +(revenue * rand(0.22, 0.40)).toFixed(2);
  const listingFee = rand(0.20, 0.25);
  const txnFee     = +(revenue * 0.065).toFixed(2);
  const payFee     = +(revenue * 0.03).toFixed(2);
  const tax        = +(revenue * rand(0.08, 0.12)).toFixed(2);
  const offsiteAds = Math.random() < 0.3 ? +(revenue * rand(0.12, 0.15)).toFixed(2) : 0;
  const discount   = Math.random() < 0.2 ? rand(2, 15) : 0;
  const refund     = Math.random() < 0.05 ? +(revenue * rand(0.5, 1.0)).toFixed(2) : 0;
  const totalFees  = listingFee + txnFee + payFee + tax + offsiteAds + discount + refund;
  const profit     = +(revenue - baseCost - totalFees).toFixed(2);
  const qty        = randInt(1, 3);
  const title      = pick(LISTING_TITLES);

  return {
    orderId:      nextOrderId(),
    orderDate:    typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 10),
    orderDateFmt: fmtDate(typeof date === 'string' ? new Date(date) : date),
    shopName,
    buyerName:    pick(BUYER_NAMES),
    country:      pick(COUNTRIES),
    status:       weightedStatus(),
    revenue:      +revenue.toFixed(2),
    baseCost,
    listingFee:   +listingFee.toFixed(2),
    transactionFee: txnFee,
    paymentFee:   payFee,
    tax,
    offsiteAds,
    discount:     +discount.toFixed(2),
    refund,
    profit,
    items: [
      {
        listingId:  `LNG-${randInt(100000, 999999)}`,
        title,
        sku:        `ETY-${randInt(1000, 9999)}-${pick(['BLK', 'WHT', 'NVY', 'GRN'])}`,
        quantity:   qty,
        price:      +(revenue / qty).toFixed(2),
        imageUrl:   pick(PRODUCT_IMAGES),
        baseCost:   +(baseCost / qty).toFixed(2),
      },
    ],
  };
};

// ── Generate a batch of orders for a date range ───────────────
export const generateMockEtsyOrders = (from, to, totalOrders = 80) => {
  const dates  = datesBetween(from || '2025-03-01', to || '2025-03-14');
  const orders = [];
  for (let i = 0; i < totalOrders; i++) {
    orders.push(generateMockEtsyOrder(pick(dates)));
  }
  // Sort newest first
  return orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
};

// ── Compute KPI statistics from an orders array ───────────────
export const computeEtsyOrderStats = (orders = []) => {
  const s = orders.reduce(
    (acc, o) => {
      acc.orders        += 1;
      acc.revenue       += o.revenue       || 0;
      acc.baseCost      += o.baseCost      || 0;
      acc.listingFee    += o.listingFee    || 0;
      acc.transactionFee+= o.transactionFee|| 0;
      acc.paymentFee    += o.paymentFee    || 0;
      acc.tax           += o.tax           || 0;
      acc.offsiteAds    += o.offsiteAds    || 0;
      acc.discount      += o.discount      || 0;
      acc.refund        += o.refund        || 0;
      acc.profit        += o.profit        || 0;
      return acc;
    },
    {
      orders: 0, revenue: 0, baseCost: 0,
      listingFee: 0, transactionFee: 0, paymentFee: 0,
      tax: 0, offsiteAds: 0, discount: 0, refund: 0, profit: 0,
    }
  );
  // Round everything to 2dp
  Object.keys(s).forEach((k) => {
    if (k !== 'orders') s[k] = +s[k].toFixed(2);
  });
  return s;
};
