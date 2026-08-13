import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('./QC.jsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../apis/order.js', import.meta.url), 'utf8');

assert.match(apiSource, /retryScaleOrder = \(orderId, provider\)/);
assert.match(apiSource, /provider \? \{ provider \}/);
assert.match(pageSource, /getProviderError/);
assert.match(pageSource, /last_error\?\.message/);
assert.match(pageSource, /handleRetry\(item\.orderId, 'lng'\)/);
assert.match(pageSource, /Retry LNG/);
assert.match(pageSource, /\['Ready', 'Failed'\]\.includes\(item\?\.scale_overall_status\)/);

console.log('qcVendorRetry self-check passed');
