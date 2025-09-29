import instance from '.';

const getAllPsdTask = (params) => {
  return instance.get('/psd-task', { params });
};

const getTaskStatictisc = (params) => {
  return instance.get('/psd-task/statictisc', { params });
};

const assignDesigner = (id, payload) => {
  return instance.post(`/psd-task/${id}/assign`, payload);
};

const requestPsd = (payload) => {
  return instance.post('/psd-task/request', payload);
};

const startPsd = (id, payload) => {
  return instance.post(`/psd-task/${id}/start`, payload);
};

const uploadPsd = (id, payload) => {
  return instance.post(`/psd-task/${id}/upload`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const qctPsd = (id, payload) => {
  return instance.post(`/psd-task/${id}/qc`, payload);
};

export { getAllPsdTask, assignDesigner, requestPsd, startPsd, uploadPsd, qctPsd, getTaskStatictisc };
