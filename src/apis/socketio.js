import instance from '.';

const getAllClient = (params) => {
  return instance.get('/ext/online', { params });
};

const getLogs = (params) => {
  return instance.get('/logs', { params });
};

const requestExtension = (payload) => {
  return instance.post('/ext/command', payload);
};

const pullAll = (payload) => {
  return instance.post('/ext/pull-all', payload);
};

const createFileConfirmShip = (payload) => {
  return instance.post('/shipping-batches', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const getShippingBatch = () => {
  return instance.get('/shipping-batches');
};

const updateTrackingFake = (batchId) => {
  return instance.post(`/shipping-batches/${batchId}/update-from-system`);
};

const updateAllTrackingFake = (machineId) => {
  return instance.post(`/shipping-batches/update-all-fake`, {
    machineId,
  });
};

const downloadFileConfirmShip = (batchId, shipDate) => {
  return instance.get(`/shipping-batches/${batchId}/download?shipDate=${shipDate}`, {
    responseType: 'blob',
  });
};

const downloadFileUpdateTracking = (machineId, batchId) => {
  return instance.get(`/shipping-batches/download-all-updated?machineId=${machineId}?batchId=${batchId}`, {
    responseType: 'blob',
  });
};

export {
  getAllClient,
  getLogs,
  requestExtension,
  pullAll,
  createFileConfirmShip,
  getShippingBatch,
  updateTrackingFake,
  downloadFileConfirmShip,
  updateAllTrackingFake,
  downloadFileUpdateTracking,
};
