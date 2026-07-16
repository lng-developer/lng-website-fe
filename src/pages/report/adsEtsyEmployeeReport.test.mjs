import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getEmployeeDetailSku,
  getEmployeeReportRows,
  getEmployeeReportTotals,
} from './adsEtsyEmployeeReport.js';

const response = {
  ok: true,
  count: 2,
  items: [
    {
      employeeCode: 'J2601',
      employeeName: 'Nguyen Van A',
      totals: {
        rows: 12,
        spend: 20.5,
        views: 1000,
        clicks: 30,
        orders: 2,
        revenue: 120,
        roas: 5.85,
      },
      details: [
        {
          listingId: '123456789',
          sku: 'J2601-ABC',
          skus: ['J2601-ABC'],
        },
      ],
    },
    {
      employeeCode: 'Unknown',
      employeeName: '',
      totals: {
        rows: 3,
        spend: 4.5,
        views: 200,
        clicks: 10,
        orders: 1,
        revenue: 25,
        roas: 5.56,
      },
      details: [
        {
          listingId: '987654321',
          skus: ['UNKNOWN-1', 'UNKNOWN-2'],
        },
      ],
    },
  ],
};

assert.deepEqual(getEmployeeReportRows(response).map((row) => row.employeeCode), ['J2601', 'Unknown']);
assert.deepEqual(getEmployeeReportTotals(response), {
  rows: 15,
  spend: 25,
  views: 1200,
  clicks: 40,
  orders: 3,
  revenue: 145,
  roas: 5.8,
});
assert.equal(getEmployeeDetailSku(response.items[0].details[0]), 'J2601-ABC');
assert.equal(getEmployeeDetailSku(response.items[1].details[0]), 'UNKNOWN-1, UNKNOWN-2');

const adsEtsyReportSource = readFileSync(new URL('./AdsEtsyReport.jsx', import.meta.url), 'utf8');
const detailColumnsBlock = adsEtsyReportSource.match(/const detailColumns = \[([\s\S]*?)\n\s*\];/)?.[1] || '';
assert.equal(/title:\s*['"]Shop['"]/.test(detailColumnsBlock), false);
assert.equal(/title:\s*['"]Seller Raw['"]/.test(detailColumnsBlock), false);

console.log('adsEtsyEmployeeReport self-check passed');
