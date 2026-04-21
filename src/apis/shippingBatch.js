import instance from '.';

export const checkOrdersStatus = (params) => {
  return instance.get('/shipping-batch/check-orders-status', { params });
};

export const createShippingBatchFromOrders = (payload) => {
  return instance.post('/shipping-batch/create-from-orders', payload);
};
