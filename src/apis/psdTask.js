import instance from '.';

const getAllPsdTask = (params) => {
  return instance.get('/psd-task', { params });
};

const assignDesigner = (id, payload) => {
  return instance.post(`/psd-task/${id}/assign`, payload);
};

const requestPsd = (payload) => {
  return instance.post('/psd-task/request', payload);
};

export { getAllPsdTask, assignDesigner, requestPsd };
