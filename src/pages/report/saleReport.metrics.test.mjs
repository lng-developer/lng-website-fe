import assert from 'node:assert/strict';
import * as metrics from './saleReport.chartAdapters.js';

const result = metrics.buildMetricTotals?.({
  Alice: {
    items: [1, 2],
    revenue: [100, 50],
    baseCost: [30, 20],
    ads: [10, 0],
    fee: [15, 7.5],
    itemPromotionDiscount: [-5, 0],
    profit1: [40, 22.5],
    profit2: [30, 12.5],
    totals: { revenue: 9999 },
  },
  Bob: {
    items: [1, 0],
    revenue: [25, 0],
    baseCost: [8, 0],
    ads: [2, 0],
    fee: [3.75, 0],
    itemPromotionDiscount: [0, -1],
    profit1: [11.25, -1],
    profit2: [1.25, -1],
  },
}, 2);

assert.deepEqual(result, {
  items: 4,
  revenue: 175,
  baseCost: 58,
  ads: 12,
  fee: 26.25,
  discount: -6,
  profit: 72.75,
});

console.log('sale report metric totals self-check passed');
