import instance from '.';

const normalizeShopifyParams = (params = {}) => ({
  page: params.page || 1,
  limit: params.perPage || params.limit || 20,
  search: params.search || undefined,
  shopDomain: params.shopDomain || undefined,
  processStatus: params.processStatus || undefined,
  financialStatus: params.financialStatus || undefined,
  fulfillmentStatus: params.fulfillmentStatus || undefined,
  importStatus: params.importStatus || undefined,
  fromDate: params.from || undefined,
  toDate: params.to || undefined,
  sortBy: params.sortBy || 'purchaseDate',
  sortOrder: params.sortOrder || 'desc',
});

const getAllShopifyOrders = (params = {}) => {
  return instance.get('/shopify/orders', { params: normalizeShopifyParams(params) });
};

const updateShopifyFulfillment = (shopifyOrderId, payload) => {
  return instance.post(`/shopify/orders/${shopifyOrderId}/fulfillment`, payload);
};

const cancelShopifyOrder = (shopifyOrderId, payload) => {
  return instance.post(`/shopify/orders/${shopifyOrderId}/cancel`, payload);
};

export { getAllShopifyOrders, updateShopifyFulfillment, cancelShopifyOrder };
