import instance from '.'; 

const getSkuMappingConfig = (params) => {
  return instance.get('/sku-mapping/config', { params });
};
const createSkuMappingConfig = (payload) => {
  return instance.post('/sku-mapping/config', payload);
};
const updateSkuMappingConfig = (id, payload) => {
  return instance.patch(`/sku-mapping/config/${id}`, payload);
};
 const toggleSkuMappingActive = (id) => {
  return instance.post(`/sku-mapping/config/${id}/active`);
};
 const deleteSkuMappingConfig = (id) => {
  return instance.delete(`/sku-mapping/config/${id}`);
};
export { 
    getSkuMappingConfig,
    createSkuMappingConfig,
    updateSkuMappingConfig,
    toggleSkuMappingActive,
    deleteSkuMappingConfig
 };