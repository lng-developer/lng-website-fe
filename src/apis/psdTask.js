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

const getAllIdeaTask = (params) => {
  return instance.get('/idea-task', { params });
};

const createIdeaTask = (payload) => {
  return instance.post('/idea-task', payload);
};

const getIdeaTaskStatictisc = (params) => {
  return instance.get('/idea-task/stats', { params });
};

const assignIdeaDesigner = (id, payload) => {
  return instance.post(`/idea-task/${id}/assign`, payload);
};

const startIdeaPsd = (id, payload) => {
  return instance.post(`/idea-task/${id}/start`, payload);
};

const approveIdeaTask = (id) => {
  return instance.post(`/idea-task/${id}/approve`);
};

const rejectIdeaTask = (id, payload) => {
  return instance.post(`/idea-task/${id}/reject`, payload);
};

const uploadIdaeTask = (id, payload) => {
  return instance.post(`/idea-task/${id}/upload-psd`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const updateIdeaTask = (id, payload) => {
  return instance.put(`/idea-task/${id}`, payload); // Giả sử dùng PUT
};

const deleteIdeaTask = (id) => {
  return instance.delete(`/idea-task/${id}`);
};

const DownloadIdeaTask = (id) => {
  return instance.get(`/idea-task/${id}/psd`);
};

const deletePsdTask = (id) => {
  return instance.delete(`/psd-task/${id}`);
};

export {
  getAllPsdTask,
  assignDesigner,
  requestPsd,
  startPsd,
  uploadPsd,
  qctPsd,
  getTaskStatictisc,
  getAllIdeaTask,
  createIdeaTask,
  updateIdeaTask,
  deleteIdeaTask,
  getIdeaTaskStatictisc,
  assignIdeaDesigner,
  startIdeaPsd,
  approveIdeaTask,
  rejectIdeaTask,
  uploadIdaeTask,
  deletePsdTask,
  DownloadIdeaTask,
};
