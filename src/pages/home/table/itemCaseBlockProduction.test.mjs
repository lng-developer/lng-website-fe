import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const itemCase = readFileSync(join(here, 'ItemCase.jsx'), 'utf8');
const orderApi = readFileSync(join(here, '../../../apis/order.js'), 'utf8');

assert.match(orderApi, /const updateCaseById = \(id, payload\) => \{/);
assert.match(orderApi, /instance\.put\(`\/case\/\$\{id\}`/);
assert.match(orderApi, /const createCase = \(payload\) => \{/);
assert.match(orderApi, /instance\.post\('\/case', payload\)/);
assert.match(itemCase, /createCase/);
assert.match(itemCase, /updateCaseById/);
assert.match(itemCase, /Create new case/);
assert.match(itemCase, /New case name/);
assert.match(itemCase, /Block production/);
assert.match(itemCase, /blocksProduction/);
assert.match(itemCase, /<Switch/);

console.log('itemCaseBlockProduction self-check passed');
