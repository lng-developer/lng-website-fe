import instance from '.';

const getALlOrder = () => {
  return instance.get('/order/fe');
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
export { getALlOrder, updateStatusOrder, getALlShop, importOrderByFile };
