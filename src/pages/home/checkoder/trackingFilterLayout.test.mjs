import assert from 'node:assert/strict';
import test from 'node:test';
import { countActiveAdvancedFilters } from './trackingFilterLayout.js';

test('counts vendor, carrier, and a submit-date range as advanced filters', () => {
    assert.equal(countActiveAdvancedFilters({}), 0);
    assert.equal(countActiveAdvancedFilters({ vendor: 'Merchize' }), 1);
    assert.equal(countActiveAdvancedFilters({ carrier: 'USPS', submitFrom: '2026-09-24', submitTo: '2026-09-25' }), 2);
});
