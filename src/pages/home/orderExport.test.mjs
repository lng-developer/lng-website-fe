import assert from 'node:assert/strict';
import { buildOrderExportRows } from './orderExport.js';

const rows = buildOrderExportRows([
  {
    orderId: 'AMZ-1001',
    status: 'Fulfilled',
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

console.log('orderExport tests passed');
