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

const getConfigCostById = (id) => {
  return instance.get(`/config-cost-center/${id}`);
};

const createConfigCost = (payload) => {
  return instance.post('/config-cost-center', payload);
};

const updateConfigCost = (id, payload) => {
  return instance.patch(`/config-cost-center/${id}`, payload);
};

const getAllMapping = (params) => {
  return instance.get('/mapping', { params });
};

const createMapping = (payload) => {
  return instance.post('/mapping', payload);
};

const updateMapping = (id, payload) => {
  return instance.patch(`/mapping/${id}`, payload);
};

const deleteMapping = (id) => {
  return instance.delete(`/mapping/${id}`);
};

export {
  getAllConfig,
  createProductType,
  deleteProductType,
  deleteProductTypeItem,
  updateProductType,
  getConfigCost,
  createConfigCost,
  getConfigCostById,
  updateConfigCost,
  getAllMapping,
  createMapping,
  updateMapping,
  deleteMapping,

};
