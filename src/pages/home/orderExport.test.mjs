import assert from 'node:assert/strict';
import * as orderExport from './orderExport.js';

const { ORDER_EXPORT_COLUMNS, BUYER_CUSTOMIZATION_DETAIL_COLUMNS, buildOrderExportRows, buildBuyerCustomizationDetailRows, getBuyerFieldOrderMergeRanges } = orderExport;

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
        version3Data: [
          { label: 'Choose Size', value: 'XL' },
          { label: 'Choose Metarial', value: 'Wood' },
          { label: 'Choose Color', value: 'Navy' },
          { label: 'Text Color', value: 'White' },
          { label: 'Select Product Type & Color', value: 'T-Shirt / Black' },
          { label: 'Custom Name', value: 'Alex' },
        ],
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
  buyerCustomization: 'Choose Size: XL\nChoose Metarial: Wood\nChoose Color: Navy\nText Color: White\nSelect Product Type & Color: T-Shirt / Black\nCustom Name: Alex',
});

assert.deepEqual(
  ORDER_EXPORT_COLUMNS.slice(0, 2).map(({ header, key }) => ({ header, key })),
  [
    { header: 'Order ID', key: 'orderId' },
    { header: 'Order Date', key: 'orderDate' },
  ]
);

assert.deepEqual(
  ORDER_EXPORT_COLUMNS.slice(-1).map(({ header, key }) => ({ header, key })),
  [{ header: 'Buyer Customization', key: 'buyerCustomization' }]
);

assert.equal(typeof buildBuyerCustomizationDetailRows, 'function');
assert.deepEqual(BUYER_CUSTOMIZATION_DETAIL_COLUMNS.map(({ header, key }) => ({ header, key })), [
  { header: 'Order ID', key: 'orderId' },
  { header: 'Order Date', key: 'orderDate' },
  { header: 'SKU', key: 'sku' },
  { header: 'Order Item ID', key: 'orderItemId' },
  { header: 'Field', key: 'field' },
  { header: 'Value', key: 'value' },
]);
assert.deepEqual(buildBuyerCustomizationDetailRows([
  {
    orderId: 'AMZ-1001',
    purchase_date: '2026-09-04T08:30:00.000Z',
    items: [{
      orderItemId: 'OI-1',
      sku: 'AMZ-SKU-1',
      version3Data: [
        { label: 'Choose Size', value: 'XL' },
        { label: 'Choose Metarial', value: 'Wood' },
      ],
    }],
  },
]), [
  { orderId: 'AMZ-1001', orderDate: 'Sep 4, 2026', sku: 'AMZ-SKU-1', orderItemId: 'OI-1', field: 'Choose Size', value: 'XL' },
  { orderId: 'AMZ-1001', orderDate: 'Sep 4, 2026', sku: 'AMZ-SKU-1', orderItemId: 'OI-1', field: 'Choose Metarial', value: 'Wood' },
]);

assert.equal(typeof getBuyerFieldOrderMergeRanges, 'function');
assert.deepEqual(getBuyerFieldOrderMergeRanges([
  { orderId: 'AMZ-1001' },
  { orderId: 'AMZ-1001' },
  { orderId: 'AMZ-1002' },
  { orderId: 'AMZ-1002' },
  { orderId: 'AMZ-1002' },
]), [
  { startRow: 2, endRow: 3 },
  { startRow: 4, endRow: 6 },
]);

assert.deepEqual(getBuyerFieldOrderMergeRanges([
  { orderId: '' },
  { orderId: '' },
  { orderId: 'AMZ-1003' },
  { orderId: 'AMZ-1003' },
]), [
  { startRow: 4, endRow: 5 },
]);

console.log('orderExport tests passed');
