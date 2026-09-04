import assert from 'node:assert/strict';
import * as orderExport from './orderExport.js';

assert.equal(typeof orderExport.fetchAllOrderPages, 'function');

const { fetchAllOrderPages } = orderExport;

const makeOrders = (start, count) => Array.from({ length: count }, (_, index) => ({ orderId: `ORDER-${start + index}` }));
const pages = [makeOrders(1, 200), makeOrders(201, 200), makeOrders(401, 21)];
const calls = [];

const orders = await fetchAllOrderPages(async ({ page, perPage, status }) => {
  calls.push({ page, perPage, status });
  return {
    status: 200,
    data: {
      data: pages[page - 1] || [],
      totalCount: 421,
    },
  };
}, { status: 'Shipped' });

assert.equal(orders.length, 421);
assert.equal(orders[0].orderId, 'ORDER-1');
assert.equal(orders.at(-1).orderId, 'ORDER-421');
assert.deepEqual(calls, [
  { page: 1, perPage: 200, status: 'Shipped' },
  { page: 2, perPage: 200, status: 'Shipped' },
  { page: 3, perPage: 200, status: 'Shipped' },
]);

console.log('orderExportPagination tests passed');
