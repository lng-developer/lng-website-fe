import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./etsyListing.js', import.meta.url), 'utf8');

assert.match(source, /const uploadEtsyListingDesignFile = \(listingId, payload, options = \{\}\) =>/);
assert.match(source, /return instance\.post\(buildEtsyListingDesignFileUrl\(listingId\), payload,/);
assert.match(source, /const downloadEtsyListingDesignFile = \(listingId\) =>/);
assert.match(source, /return instance\.get\(buildEtsyListingDesignFileUrl\(listingId, 'download'\)\)/);
assert.match(source, /const deleteEtsyListingDesignFile = \(listingId\) =>/);
assert.match(source, /return instance\.delete\(buildEtsyListingDesignFileUrl\(listingId\)\)/);
assert.match(source, /\/etsy-listings\/design-file/);
assert.match(source, /buildEtsyListingDesignFileUrl\(listingId, 'download'\)/);
assert.match(source, /listingId/);

console.log('etsyListing api self-check passed');
