import instance from '.';

const getAllSellers = (params) => {
  return instance.get('/user/sellers', { params });
};

const getAllDesigner = (params) => {
  return instance.get('/user/designer', { params });
};
const getAllUsers = (params) => {
  return instance.get('/user', { params });
};
export const createUser = (payload) => {
  return instance.post('/user', payload);
};

export const updateUser = (id, payload) => {
  return instance.put(`/user/${id}`, payload);
};

export const deleteUser = (id) => {
  return instance.delete(`/user/${id}`);
};

export const getAllRoles = () => {
  return instance.get('/role'); 
};
export { getAllSellers, getAllDesigner, getAllUsers };
