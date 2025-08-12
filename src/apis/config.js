import instance from '.';

const getAllConfig = (params) => {
  return instance.get('/product-type', { params });
};

const createProductType = (payload) => {
  return instance.post('/product-type', payload);
};

const deleteProductType = (id) => {
  return instance.delete(`/product-type/${id}`);
};

const deleteProductTypeItem = (id, itemId) => {
  return instance.delete(`/product-type/${id}/items/${itemId}`);
};

const updateProductType = (id, payload) => {
  return instance.post(`/product-type/${id}/items`, payload);
};

const getConfigCost = (params) => {
  return instance.get('/config-cost-center', { params });
};

export { getAllConfig, createProductType, deleteProductType, deleteProductTypeItem, updateProductType, getConfigCost };
