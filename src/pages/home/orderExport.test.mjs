import assert from 'node:assert/strict';
import { ORDER_EXPORT_COLUMNS, buildOrderExportRows } from './orderExport.js';

const rows = buildOrderExportRows([
  {
    orderId: 'AMZ-1001',
    status: 'Fulfilled',
    purchase_date: '2026-09-04T08:30:00.000Z',
    shopName: 'Amazon Shop',
    seller: 'seller@example.com',
    customer_infor: {
      name: 'John Customer',
      address: '456 Market',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98101',
      country: 'US',
    },
    shipping_type: 'Second Day',
    base_cost: 9.75,
    items: [
      {
        orderItemId: 'OI-1',
        sku: 'AMZ-SKU-1',
        mapped_sku: 'AMZ-MAP-1',
        listing: 'ASIN-1',
        quantity: 3,
        cost_center: {
          vendorProductDisplayName: 'Premium Hoodie',
          sizeValue: 'XL',
          colorValue: 'Navy',
        },
        tracking_info: {
          carrier: 'UPS',
          trackingNumber: '1Z999',
          note: 'Ready',
        },
      },
    ],
  },
]);

assert.equal(rows.length, 1);
assert.deepEqual(rows[0], {
  orderId: 'AMZ-1001',
  orderDate: 'Sep 4, 2026',
  status: 'Fulfilled',
  shop: 'Amazon Shop',
  seller: 'seller@example.com',
  customer: 'John Customer',
  address: '456 Market, Seattle, WA, 98101, US',
  shippingType: 'Second Day',
  sku: 'AMZ-SKU-1',
  mappedSku: 'AMZ-MAP-1',
  listing: 'ASIN-1',
  orderItemId: 'OI-1',
  quantity: 3,
  costCenter: 'Premium Hoodie / Size: XL / Color: Navy',
  tracking: 'UPS 1Z999 / Ready',
  baseCost: 9.75,
});

assert.deepEqual(
  ORDER_EXPORT_COLUMNS.slice(0, 2).map(({ header, key }) => ({ header, key })),
  [
    { header: 'Order ID', key: 'orderId' },
    { header: 'Order Date', key: 'orderDate' },
  ]
);

console.log('orderExport tests passed');
