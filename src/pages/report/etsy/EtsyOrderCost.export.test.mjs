import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hook = readFileSync(new URL('./hooks/useEtsyOrderCost.js', import.meta.url), 'utf8');
const page = readFileSync(new URL('./EtsyOrderCost.jsx', import.meta.url), 'utf8');

assert.match(hook, /const EXPORT_PAGE_SIZE = 200;/);
assert.match(hook, /const fetchExportOrders = useCallback\(async \(\) =>/);
assert.match(hook, /while \(orders\.length < totalCount\)/);
assert.match(hook, /includeLogs: false/);
assert.match(page, /const exportOrders = await fetchExportOrders\(\);/);
assert.match(page, /exportOrders\.forEach\(\(o, ri\) =>/);
assert.match(page, /'Order ID','Order Date','Shop','Seller','Buyer','Status'/);
assert.match(page, /o\.orderId, o\.orderDateFmt, o\.shopName, o\.sellerName, o\.buyerName, o\.status/);

console.log('EtsyOrderCost export self-check passed');
