import instance from '.';

const getAllClient = (params) => {
  return instance.get('/ext/online', { params });
};

const getLogs = (params) => {
  return instance.get('/ext/logs', { params });
};

const requestExtension = (payload) => {
  return instance.post('/ext/command', payload);
};
export { getAllClient, getLogs, requestExtension };
