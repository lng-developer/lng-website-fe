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

const getALlShop = () => {
  return instance.get('/shop');
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

const updateBaseCost = (orderId, base_cost) => {
  return instance.put('/order/update-base-cost', {
    orderId,
    base_cost,
  });
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

export {
  getALlOrder,
  updateStatusOrder,
  getALlShop,
  importOrderByFile,
  updateCustomerInfor,
  updateBaseCost,
  getAllCountStatus,
  updateShippingType,
  getAllCaseByOrder,
  updateOpenCase,
  removeCase,
  updateImage,
  retestBasecode,
  trackingOrder,
};
