import instance from '.';

export const checkOrdersStatus = (params) => {
  return instance.get('/shipping-batch/check-orders-status', { params });
};

export const createShippingBatchFromOrders = (payload) => {
  return instance.post('/shipping-batch/create-from-orders', payload);
};

export const approveTrackingReview = (batchId, payload) => {
  return instance.post(`/shipping-batch/${batchId}/review`, payload);
};

export const sendShippingBatchUpload = (payload) => {
  return instance.post('/shipping-batch/manual-upload-task', payload);
};

export const getShippingBatches = (params) => {
  return instance.get('/shipping-batch', { params });
};

export const downloadAmazonFeedReport = (batchId) => {
  return instance.get(`/shipping-batch/${batchId}/amazon-feed-report`, { responseType: 'blob' });
};
