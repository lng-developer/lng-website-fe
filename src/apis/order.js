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

const importOrderByFile = (shopId, file) => {
  return instance.post('/order/update-from-xlsx', {
    shopId,
    file,
  });
};
export { getALlOrder, updateStatusOrder, getALlShop, importOrderByFile };
