import instance from '.';

// Lấy danh sách configs
export const getConfigAutos = () => {
  return instance.get('/config-auto?page=1&limit=10',);
};

// Lấy config theo ID
export const getConfigAutoById = (id) => {
  return instance.get(`/config-auto/${id}`);
};

// Cập nhật config
export const updateConfigAuto = (id, data) => {
  return instance.put(`/config-auto/${id}`, data);
};

// Tạo config mới (nếu cần)
export const createConfigAuto = (data) => {
  return instance.post('/config-auto', data);
};

// Xóa config (nếu cần)
export const deleteConfigAuto = (id) => {
  return instance.delete(`/config-auto/${id}`);
};