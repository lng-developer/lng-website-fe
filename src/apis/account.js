import instance from '.';

export const getAllAccount = (params) => {
  return instance.get('/account', { params });
};
export const createAccount = (payload) => {
  return instance.post('/account', payload);
};
export const updateAccount = (id, payload) => {
  return instance.put(`/account/${id}`, payload);
};
export const deleteAccount = (id) => {
  return instance.delete(`/account/${id}`);
};
export const resetTempPassword = (accountId) => {
  return instance.post(`/account/${accountId}/password/reset-temp`);
};