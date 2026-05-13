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

const importRefund = (payload) => {
  return instance.post('/report/import-refund', payload, {
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

const getAllAdsEtsy = (start, end, shopId) => {
  return instance.get('/ads/etsy', { params: { start, end, shopId } });
};

const exportReportCost = (params) => {
  return instance.get('/report/order_cost/export', { params, responseType: 'blob' });
};

const exportAds = (params) => {
  return instance.get('/report/ads/export', { params, responseType: 'blob' });
};

const reportForSaler = (from, to) => {
  return instance.get(`/report/etsy-matrix?from=${from}&to=${to}`);
};


export { getAllReport, importReport, importAds, getOrderCostStatistics, getAds, getAllAdsEtsy, importRefund, exportReportCost, exportAds, reportForSaler };
