import instance from '.';

const getALlVendor = () => {
  return instance.get('/vendor');
};

const updateVender = (id, name) => {
  return instance.put(`/vendor/${id}`, {
    name,
  });
};

const addVendor = (name, fulfillment_type) => {
  return instance.post('/vendor', {
    name,
    fulfillment_type,
  });
};

const deleteVendor = (id) => {
  return instance.delete(`/vendor/${id}`);
};

const getALlVendorProduct = (params) => {
  return instance.get('/vendor-product', { params });
};

const getProductCostCenter = (id) => {
  return instance.get(`/vendor-cost-center/by-product/${id}`);
};

const getAllProductCostCenter = (params) => {
  return instance.get('/vendor-cost-center', { params });
};

const importCostCenter = (payload) => {
  return instance.post('/vendor-cost-center/import', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const addVendorProduct = (payload) => {
  return instance.post('/vendor-product', payload);
};

const importVendorProduct = (payload) => {
  return instance.post('/vendor-product/import-excel', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const updateVendorProduct = (id, payload) => {
  return instance.put(`/vendor-product/${id}`, payload);
};

const updateVendorProductCostCenter = (id, payload) => {
  return instance.put(`/vendor-cost-center/${id}`, payload);
};

export {
  getALlVendor,
  updateVender,
  addVendor,
  deleteVendor,
  getALlVendorProduct,
  getProductCostCenter,
  getAllProductCostCenter,
  importCostCenter,
  addVendorProduct,
  importVendorProduct,
  updateVendorProduct,
  updateVendorProductCostCenter,
};
