import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./etsy.js', import.meta.url), 'utf8');

assert.match(source, /includeCostSummary:\s*params\.includeCostSummary === true \? true : undefined/);

console.log('etsy api self-check passed');
