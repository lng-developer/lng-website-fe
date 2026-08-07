import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  canReopenEtsyQc,
  canRetryEtsySend,
  getEtsyFailureInfo,
  getReopenEtsyQcDisabledReason,
  getRetryEtsySendDisabledReason,
  hasFulfillmentFile,
} from './etsyQcActions.js';

const completeItem = {
  scale_status: 'Complete',
  fulfillment_file: { front: 'https://cdn.example/front.png' },
};

const failedOrder = {
  status: 'New',
  scale_overall_status: 'Failed',
  items: [completeItem],
  vendor_submissions: {
    merchize: {
      sent: false,
      attempt_count: 1,
      last_response: {
        error: 'Request failed with status code 403',
        at: '2026-06-23T02:52:41.596Z',
      },
    },
  },
};

assert.equal(hasFulfillmentFile({ front: 'https://cdn.example/front.png' }), true);
assert.equal(hasFulfillmentFile({ front: '' }), false);
assert.equal(canRetryEtsySend(failedOrder), true);
assert.equal(
  canRetryEtsySend({
    ...failedOrder,
    scale_overall_status: 'Ready',
    vendor_submissions: {},
    items: [{ ...completeItem, cost_center: { vendorProductDisplayName: 'Merchize - ESH' } }],
  }),
  true
);
assert.equal(
  getRetryEtsySendDisabledReason({
    ...failedOrder,
    scale_overall_status: 'Ready',
    vendor_submissions: {},
    items: [completeItem],
  }),
  'Missing vendor/provider'
);
assert.equal(canRetryEtsySend({ ...failedOrder, items: [{ scale_status: 'Complete', fulfillment_file: {} }] }), true);
assert.equal(getRetryEtsySendDisabledReason({ ...failedOrder, status: 'Shipped' }), 'Order already shipped/fulfilled/cancelled');
assert.equal(getRetryEtsySendDisabledReason({ ...failedOrder, items: [{ scale_status: 'Pending' }] }), 'Some items are not Complete');
assert.equal(getRetryEtsySendDisabledReason({ ...failedOrder, vendor_submissions: {}, items: [completeItem] }), 'Missing vendor/provider');
assert.equal(canReopenEtsyQc(failedOrder), true);
assert.equal(canReopenEtsyQc({ ...failedOrder, items: [{ scale_status: 'Complete', fulfillment_file: {} }] }), false);
assert.equal(canReopenEtsyQc({ ...failedOrder, status: 'Shipped' }), false);
assert.equal(getReopenEtsyQcDisabledReason({ ...failedOrder, scale_overall_status: 'Sent' }), 'Status is not Failed/Ready');
assert.equal(getReopenEtsyQcDisabledReason({ ...failedOrder, items: [{ scale_status: 'Complete', fulfillment_file: {} }] }), 'Missing scale file');
assert.deepEqual(getEtsyFailureInfo(failedOrder), {
  provider: 'merchize',
  error: 'Request failed with status code 403',
  attemptCount: 1,
  at: '2026-06-23T02:52:41.596Z',
});

const pageSource = readFileSync(new URL('./EtsyQC.jsx', import.meta.url), 'utf8');
const apiInstanceSource = readFileSync(new URL('../../apis/index.js', import.meta.url), 'utf8');
assert.match(pageSource, /Modal\.confirm\(/);
assert.match(pageSource, /Send to Vendor/);
assert.match(pageSource, /\['Ready', 'Failed'\]\.includes\(item\?\.scale_overall_status\)/);
assert.match(pageSource, /indexItem === 0 && \['Ready', 'Failed'\]\.includes\(item\?\.scale_overall_status\)/);
assert.match(apiInstanceSource, /baseURL:\s*import\.meta\.env\.VITE_API_BASE_URL/);

console.log('etsyQcActions self-check passed');
