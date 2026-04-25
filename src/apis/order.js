import instance from '.';

const getALlOrder = (params) => {
  return instance.get('/order/fe', { params });
};

const updateStatusOrder = (orderId, status) => {
  return instance.put('/order/update-status', {
    orderId,
    status,
  });
};

const getALlShop = (params) => {
  return instance.get('/shop', { params });
};

const importOrderByFile = (payload) => {
  return instance.post('/order/update-from-xlsx', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const updateCustomerInfor = (orderId, customer_infor) => {
  return instance.put('/order/update-customer-info', {
    orderId,
    customer_infor,
  });
};

const markAddressValid = (orderId) => {
  return instance.put(`/order/${orderId}/mark-address-valid`);
};

const manualMapping = (payload) => {
  return instance.put('/order/manual-mapping', payload);
};

const updateBaseCost = (orderId, base_cost) => {
  return instance.put('/order/update-base-cost', {
    orderId,
    base_cost,
  });
};

const resetBaseCost = (payload) => {
  return instance.put('/reset-base-cost', payload);
};

const getAllCountStatus = (params) => {
  return instance.get('/order/statistic', { params });
};

const updateShippingType = (orderId, shipping_type) => {
  return instance.put('/order/update-shipping-type', {
    orderId,
    shipping_type,
  });
};

const getAllCaseByOrder = () => {
  return instance.get('/case');
};

const updateOpenCase = (payload) => {
  return instance.put('/order/open-case', payload);
};

const removeCase = (payload) => {
  return instance.put('/order/remove-case', payload);
};

const updateImage = (payload) => {
  return instance.put('/order/update-base-image', payload);
};

const retestBasecode = (payload) => {
  return instance.post('/order/compute-base-cost', payload);
};

const trackingOrder = (orderId, orderItemId, payload) => {
  return instance.put(`/order/${orderId}/items/${orderItemId}/tracking`, payload);
};

const updateOrderItemQuantity = (orderId, orderItemId, payload) => {
  return instance.patch(`/order/${orderId}/items/${orderItemId}/quantity`, payload);
};

const uploadScale = (orderId, orderItemId, payload) => {
  return instance.post(`/scale/orders/${orderId}/items/${orderItemId}/fulfillment-file`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const scaleFulfill = (orderId, orderItemId, payload) => {
  return instance.post(`/scale/orders/${orderId}/items/${orderItemId}/scale/confirm`, payload);
};

const getAllQC = (params) => {
  return instance.get('/fulfillment/qc', { params });
};

const getAllCountStatusQC = (params) => {
  return instance.get('/fulfillment/qc/statistics', { params });
};

const getAllFulfillScale = (params) => {
  return instance.get('/scale/list', { params });
};

const getAllFulfillScaleForDesign = (params) => {
  return instance.get('/scale/list/design', { params });
};

const getAllCountStatusScale = (params) => {
  return instance.get('/scale/statistics', { params });
};

const getAllCountStatusScaleForDesign = (params) => {
  return instance.get('/scale/statistics/design', { params });
};

const updateOrder = (id, payload) => {
  return instance.put(`/order/${id}`, payload);
};

const replaceOrder = (id, payload) => {
  return instance.post(`/order/${id}/replace`, payload);
};

const assignOrderToCs = (orderId, payload) => {
  return instance.put(`/scale/orders/${orderId}/assign-cs`, payload);
};

const importAsyncOrder = (payload) => {
  return instance.post('/admin/run-now', payload);
};

const ChangeTimeAutoOrder = (payload) => {
  return instance.post('/admin/schedule', payload);
};

export const retryScaleOrder = (orderId) => {
  return instance.post(`/scale/orders/${orderId}/scale/send`);
};

export const syncVendorTracking = (payload) => {
  return instance.post('/ext/vendor-sync/batch', payload);
};

export const resetOrdersBulk = (payload) => {
  return instance.put('/scale/orders/reset/bulk', payload);
};

export {
  getALlOrder,
  updateStatusOrder,
  getALlShop,
  importOrderByFile,
  updateCustomerInfor,
  markAddressValid,
  manualMapping,
  updateBaseCost,
  resetBaseCost,
  getAllCountStatus,
  updateShippingType,
  getAllCaseByOrder,
  updateOpenCase,
  removeCase,
  updateImage,
  retestBasecode,
  trackingOrder,
  updateOrderItemQuantity,
  uploadScale,
  scaleFulfill,
  getAllQC,
  getAllCountStatusQC,
  getAllFulfillScale,
  getAllCountStatusScale,
  getAllFulfillScaleForDesign,
  getAllCountStatusScaleForDesign,
  updateOrder,
  replaceOrder,
  assignOrderToCs,
  importAsyncOrder,
  ChangeTimeAutoOrder,
};
