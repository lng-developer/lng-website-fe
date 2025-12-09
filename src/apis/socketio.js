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

const updateTrackingFake = (batchId, payload) => {
  return instance.post(`/shipping-batches/${batchId}/update-from-system`, {
    machineId: payload.machineId,
    label: payload.label,
  });
};

const downloadFileConfirmShip = (batchId) => {
  return instance.get(`/shipping-batches/${batchId}/download`, {
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
};
