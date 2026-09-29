import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./EtsyOrderCost.jsx', import.meta.url), 'utf8');

assert.match(source, /const tableContainerRef = useRef\(null\);/);
assert.match(source, /const TABLE_BOTTOM_SAFE_AREA = 64;/);
assert.match(source, /window\.innerHeight - tableTop - TABLE_BOTTOM_SAFE_AREA/);
assert.doesNotMatch(source, /window\.innerHeight - tableTop - 16/);
assert.doesNotMatch(source, /const headerHeight = 240;/);

console.log('EtsyOrderCost layout self-check passed');
