import assert from 'node:assert/strict';
import { getSubItemSellerLabel } from './subItemSellerLabel.js';

assert.equal(getSubItemSellerLabel({ sellerCode: 'J2512' }), 'J2512');
assert.equal(getSubItemSellerLabel({ full_name: 'Nguyễn Minh Đức', sellerCode: 'J2512' }), 'Nguyễn Minh Đức');
assert.equal(getSubItemSellerLabel(), 'No data');

console.log('subItemSellerLabel tests passed');
