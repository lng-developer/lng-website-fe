import instance from '.';

const getAllEtsyOrders = (params = {}) => {
  const query = {
    page: params.page || undefined,
    limit: params.perPage || undefined,
    from: params.from || undefined,
    to: params.to || undefined,
    search: params.search || undefined,
    shopName: params.shopName || undefined,
    teamId: params.teamId || undefined,
    shippingType: params.shippingType || undefined,
    status: params.status || undefined,
    sumbittedoetsy: params.sumbittedoetsy === true || params.sumbittedoetsy === false ? params.sumbittedoetsy : undefined,
    submittedToEtsy: params.sumbittedoetsy === true || params.sumbittedoetsy === false ? params.sumbittedoetsy : undefined,
    hasTracking: params.hasTracking === true || params.hasTracking === false ? params.hasTracking : undefined,
    trackingInfo: params.hasTracking === true || params.hasTracking === false ? params.hasTracking : undefined,
    isNoCostCenter: params.isNoCostCenter || undefined,
    invalidAddress: params.invalidAddress || undefined,
    openCase: params.openCase || undefined,
    noPsd: params.noPsd || undefined,
  };

  console.log('[EtsyAPI] getAllEtsyOrders query:', query);
  return instance.get('/etsy', { params: query });
};

const importEtsyOrders = (formData) => {
  return instance.post('/etsy/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const getEtsyStatistic = (params) => {
  return instance.get('/etsy/statistic', { params });
};

const computeEtsyBaseCost = (body) => {
  return instance.post('/etsy/compute-base-cost', body);
};

const manualMappingEtsy = (payload) => {
  return instance.put('/etsy/manual-mapping', payload);
};

const uploadEtsyTracking = (body) => {
  return instance.post('/ext/etsy/upload-tracking', body);
};

const uploadEtsyTrackingBatch = (body) => {
  return instance.post('/ext/etsy/upload-tracking-batch', body);
};

const updateEtsyItemTracking = (orderId, transactionId, payload) => {
  return instance.put(`/etsy/${orderId}/items/${transactionId}/tracking`, payload);
};

const updateEtsyOrderTracking = (orderId, payload) => {
  return instance.put(`/etsy/${encodeURIComponent(orderId)}/tracking`, payload);
};

const updateEtsySubmittedStatus = (payload) => {
  return instance.patch('/etsy/sumbittedoetsy', payload);
};

const getAllEtsyScale = (params) => {
  return instance.get('/etsy/scale/list', { params });
};

const getAllEtsyScaleStatistics = (params) => {
  return instance.get('/etsy/scale/statistics', { params });
};

const getAllEtsyQC = (params) => {
  return instance.get('/etsy/qc/list', { params });
};

const getAllEtsyQCStatistics = (params) => {
  return instance.get('/etsy/qc/statistics', { params });
};

const pushSelectedEtsyOrdersToFulfillmentPlatform = (payload) => {
  return instance.post('/etsy/qc/push-platform-orders', payload);
};

const uploadEtsyScale = (orderId, transactionId, payload, options = {}) => {
  return instance.post(`/etsy/${orderId}/items/${transactionId}/fulfillment-file`, payload, {
    params: {
      shopId: options?.shopId || undefined,
    },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const confirmEtsyScaleForItem = (orderId, transactionId, payload, options = {}) => {
  return instance.post(`/etsy/${orderId}/items/${transactionId}/scale/confirm`, payload, {
    params: {
      shopId: options?.shopId || undefined,
    },
  });
};

const assignEtsyOrderToCs = (orderId, payload) => {
  return instance.put(`/etsy/${encodeURIComponent(orderId)}/assign-cs`, payload);
};

const unassignEtsyOrderFromCs = (orderId, payload = {}) => {
  return instance.put(`/etsy/${encodeURIComponent(orderId)}/unassign-cs`, payload);
};

const updateEtsyCSNote = (orderId, transactionId, payload) => {
  return instance.put(`/etsy/${orderId}/items/${transactionId}/cs-note`, payload);
};

const updateEtsyQCNote = (orderId, transactionId, payload) => {
  return instance.put(`/etsy/${orderId}/items/${transactionId}/qc-note`, payload);
};

export {
  getAllEtsyOrders,
  importEtsyOrders,
  getEtsyStatistic,
  computeEtsyBaseCost,
  manualMappingEtsy,
  uploadEtsyTracking,
  uploadEtsyTrackingBatch,
  updateEtsyItemTracking,
  updateEtsyOrderTracking,
  updateEtsySubmittedStatus,
  getAllEtsyScale,
  getAllEtsyScaleStatistics,
  getAllEtsyQC,
  getAllEtsyQCStatistics,
  pushSelectedEtsyOrdersToFulfillmentPlatform,
  uploadEtsyScale,
  confirmEtsyScaleForItem,
  assignEtsyOrderToCs,
  unassignEtsyOrderFromCs,
  updateEtsyCSNote,
  updateEtsyQCNote,
};
