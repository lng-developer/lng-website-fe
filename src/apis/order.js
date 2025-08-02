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
export {
  getALlOrder,
  updateStatusOrder,
  getALlShop,
  importOrderByFile,
  updateCustomerInfor,
  updateBaseCost,
  getAllCountStatus,
  updateShippingType,
};
