import assert from 'node:assert/strict';
import { buildProfitArrays } from './saleReport.chartAdapters.js';

const result = buildProfitArrays(
  {
    revenue: [100],
    baseCost: [20],
    fee: [15],
    refund: [5],
    itemPromotionDiscount: [-3],
    ads: [7],
    opCost: [10],
  },
  1
);

assert.deepEqual(result.profit1, [57]);
assert.deepEqual(result.profit2, [40]);
assert.deepEqual(result.roi, [571.43]);

console.log('saleReport.chartAdapters self-check passed');
