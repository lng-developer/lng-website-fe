import instance from '.';

const getAllPointsWithLogs = (params) => {
  return instance.get('/points/all/with-logs', { params });
};

export { getAllPointsWithLogs };