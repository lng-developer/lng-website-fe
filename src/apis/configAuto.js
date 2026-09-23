import instance from '.';

// Lấy danh sách configs
export const getConfigAutos = () => {
  return instance.get('/auto-config',);
};

// Cập nhật config
export const updateConfigAuto = (id, data) => {
  return instance.put(`/auto-config/${id}`, data);
};

// Tạo config mới (nếu cần)
export const createConfigAuto = (data) => {
  return instance.post('/auto-config', data);
};

// Xóa config (nếu cần)
export const deleteConfigAuto = (id) => {
  return instance.delete(`/auto-config/${id}`);
};

export const runConfigAutoNow = (id, payload = {}) => {
  return instance.post(`/auto-config/${id}/run`, payload);
};
