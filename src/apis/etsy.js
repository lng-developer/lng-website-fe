import instance from '.';
const getAllEtsyOrders = (params) => {
  const query = {};

  // Phân trang
  if (params.page)    query.page  = params.page;
  if (params.perPage) query.limit = params.perPage;

  // Date range
  if (params.from) query.from = params.from;
  if (params.to)   query.to   = params.to;

  // Search & filters
  if (params.search)       query.search       = params.search;
  if (params.shopName)     query.shopName     = params.shopName;
  if (params.teamId)       query.teamId       = params.teamId;
  if (params.shippingType) query.shippingType = params.shippingType;

  // Status filter — backend dùng "status" (singular)
  if (params.status) query.status = params.status;

  // Boolean flags — chỉ gửi khi = true để tránh gửi false/0 lên backend
  if (params.noPsd)     query.noPsd     = true;
  if (params.openCase)  query.openCase  = true;
  if (params.userNull)  query.userNull  = true;
  if (params.platform)  query.platform  = params.platform;

  return instance.get('/etsy', { params: query });
};

const importEtsyOrders = (formData) => {
  return instance.post('/etsy/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const getEtsyStatistic = (params) => {
  return instance.get('/etsy/statistic', { params });
};

const computeEtsyBaseCost = (body) => {
  return instance.post('/etsy/compute-base-cost', body);
};

export { getAllEtsyOrders, importEtsyOrders, getEtsyStatistic, computeEtsyBaseCost };
