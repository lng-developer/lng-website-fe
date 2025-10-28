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
const getAllTeam = (params) => {
  return instance.get('/teams', {params})
}
const createTeam = (payload) => {
  return instance.post('/teams', payload);
};

const updateTeam = (teamId, payload) => {
  return instance.put(`/teams/${teamId}`, payload);
};

const deleteTeam = (teamId) => {
  return instance.delete(`/teams/${teamId}`);
};

const addTeamMembers = (teamId, payload) => {
  return instance.post(`/teams/${teamId}/members`, payload);
};

const removeTeamMembers = (teamId, payload) => {
  // Dùng .post() theo như tài liệu API
  return instance.post(`/teams/${teamId}/members/remove`, payload);
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
  getAllTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMembers,
  removeTeamMembers
};
