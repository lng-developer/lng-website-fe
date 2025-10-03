import instance from '.';

const getAllReport = (params) => {
  return instance.get('/report', { params });
};

const importReport = (payload) => {
  return instance.post('/report/import-file', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const importAds = (payload) => {
  return instance.post('/ads/import-day', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const getOrderCostStatistics = (params) => {
  return instance.get('/report/order_cost/statistics', { params });
};

const getAds = (params) => {
  return instance.get('/ads', { params });
};

export { getAllReport, importReport, importAds, getOrderCostStatistics, getAds };
