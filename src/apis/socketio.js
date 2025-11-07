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
export { getAllClient, getLogs, requestExtension, pullAll };
