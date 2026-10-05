import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/report/ReportOrderCost.jsx', import.meta.url), 'utf8');

assert.match(source, /key: 'ads', label: 'Ads', value: num\(s\.ads\)/);
assert.doesNotMatch(source, /key: 'tax', label: 'Tax', value: num\(s\.tax\)/);
assert.doesNotMatch(source, />Tax<\/span>,\s*dataIndex: 'tax'/);
assert.doesNotMatch(source, />S-Tax<\/span>,\s*dataIndex: 'shipping_tax'/);

console.log('Orders Cost shows Ads instead of the Tax KPI');
