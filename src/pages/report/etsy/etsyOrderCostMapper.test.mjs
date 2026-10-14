import assert from 'node:assert/strict';
import {
  getEtsyOrderCostDetails,
  normalizeEtsyOrderCostResponse,
} from './etsyOrderCostMapper.js';

const result = normalizeEtsyOrderCostResponse({
  data: [{
    orderId: '4148263696',
    purchase_date: '2026-08-18T05:36:35.000Z',
    seller: { full_name: 'Nguyen Van A' },
    base_cost: 33.18,
    totals: { orderTotal: 83.51 },
    items: [{ sku: 'J2609-NK-071526-11', quantity: 1, unitPrice: 100.95 }],
  }],
  totalCount: 286,
  summary: {
    orders: 286,
    revenue: 16010.86,
    baseCost: 6604.17,
    fee: 3362.28,
    profit: 6044.41,
  },
});

assert.equal(result.totalCount, 286);
assert.deepEqual(result.summary, {
  orders: 286,
  revenue: 16010.86,
  baseCost: 6604.17,
  fee: 3362.28,
  profit: 6044.41,
});
assert.equal(result.orders[0].revenue, 83.51);
assert.equal(result.orders[0].fee, 17.54);
assert.equal(result.orders[0].profit, 32.79);
assert.equal(result.orders[0].sellerName, 'Nguyen Van A');
assert.equal(result.orders[0].items[0].price, 100.95);

const details = getEtsyOrderCostDetails({ tax: 2, offsiteAds: 3 });
assert.equal(details.some((item) => item.key === 'tax'), false);
assert.equal(details.some((item) => item.key === 'offsiteAds'), false);

console.log('etsyOrderCostMapper self-check passed');
