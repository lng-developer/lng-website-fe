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

const getALlVendorProduct = () => {
  return instance.get('/vendor-product');
};

export { getALlVendor, updateVender, addVendor, deleteVendor, getALlVendorProduct };
