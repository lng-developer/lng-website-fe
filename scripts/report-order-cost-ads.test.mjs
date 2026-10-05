import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/report/ReportOrderCost.jsx', import.meta.url), 'utf8');

assert.match(source, /key: 'ads', label: 'Ads', value: num\(s\.ads\)/);
assert.doesNotMatch(source, /key: 'tax', label: 'Tax', value: num\(s\.tax\)/);

console.log('Orders Cost shows Ads instead of the Tax KPI');
