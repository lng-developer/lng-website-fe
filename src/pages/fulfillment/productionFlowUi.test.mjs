import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

for (const fileName of ['QC.jsx', 'EtsyQC.jsx']) {
  const source = readFileSync(join(here, fileName), 'utf8');

  assert.match(source, /const getProductionIssues = \(order\) => \{/);
  assert.match(source, /const getProductionWarnings = \(order\) => \{/);
  assert.match(source, /blocksProduction === true/);
  assert.match(source, /missing fulfillment file/i);
  assert.match(source, /LNG vendor override/i);
  assert.match(source, /selectedProductionIssues\.length > 0/);
  assert.match(source, /selectedProductionWarnings\.length > 0/);
  assert.match(source, /disabled: selectedOrdersForFulfillment\.length === 0 \|\| selectedProductionIssues\.length > 0/);
  assert.match(source, /Push Production/);
  assert.match(source, /Production Platform/);
  assert.match(source, /Direct/);
  assert.match(source, /const isFailedFilter = /);
  assert.match(source, /fulfillmentPushResult\.orders/);
  assert.match(source, /Failed Reason/);
  assert.match(source, /failure_reason/);
}

console.log('productionFlowUi self-check passed');
