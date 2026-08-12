import assert from 'node:assert/strict';
import { buildEtsyOrderExportRows } from './orderEtsyExport.js';

const rows = buildEtsyOrderExportRows([
  {
    orderId: 'ETSY-1001',
    status: 'New',
    shopName: 'Shop A',
    seller: { full_name: 'Seller One' },
    customer_infor: {
      name: 'Jane Customer',
      address: '123 Main',
      address_2: 'Apt 4',
      city: 'Austin',
      state: 'TX',
      zip_code: '78701',
      country: 'US',
    },
    shipping_type: 'Ground',
    remain: '2 days',
    base_cost: 12.5,
    items: [
      {
        transactionId: 'TX-1',
        sku: 'SKU-1',
        mapped_sku: 'MAP-1',
        listingId: 'LIST-1',
        quantity: 2,
        cost_center: {
          vendorProductDisplayName: 'Canvas Tee',
          sizeValue: 'L',
          colorValue: 'Black',
        },
        tracking_info: {
          trackingNumber: 'TRACK-1',
          carrier: 'USPS',
          note: 'Packed',
        },
      },
      {
        orderItemId: 'ITEM-2',
        sku: 'SKU-2',
        quantity: 1,
      },
    ],
  },
]);

assert.equal(rows.length, 2);
assert.deepEqual(rows[0], {
  orderId: 'ETSY-1001',
  status: 'New',
  shop: 'Shop A',
  seller: 'Seller One',
  customer: 'Jane Customer',
  address: '123 Main, Apt 4, Austin, TX, 78701, US',
  shippingType: 'Ground',
  remain: '2 days',
  sku: 'SKU-1',
  mappedSku: 'MAP-1',
  listingId: 'LIST-1',
  transactionId: 'TX-1',
  quantity: 2,
  costCenter: 'Canvas Tee / Size: L / Color: Black',
  tracking: 'USPS TRACK-1 / Packed',
  baseCost: 12.5,
});
assert.equal(rows[1].transactionId, 'ITEM-2');
assert.equal(rows[1].costCenter, '');
assert.equal(rows[1].tracking, '');

console.log('orderEtsyExport tests passed');
