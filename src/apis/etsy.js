import instance from '.';
const getAllEtsyOrders = (params) => {
  const query = {
    page:         params.page        || undefined,
    limit:        params.perPage     || undefined,
    from:         params.from        || undefined,
    to:           params.to          || undefined,
    search:       params.search      || undefined,
    shopName:     params.shopName    || undefined,
    teamId:       params.teamId      || undefined,
    shippingType: params.shippingType || undefined,
    status:       params.status      || undefined,
    // Boolean flags: gửi true nếu = true, bỏ qua (undefined) nếu false
    isNoCostCenter:  params.isNoCostCenter  || undefined,
    invalidAddress:  params.invalidAddress  || undefined,
    openCase:        params.openCase        || undefined,
    noPsd:           params.noPsd           || undefined,
  };

  console.log('[EtsyAPI] getAllEtsyOrders query:', query);
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
