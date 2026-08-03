import instance from '.';

export const getAllAdsEtsy = (start, end, shopid) => {
  const params = { from: start, to: end };
  if (shopid) params.shopId = shopid;

  return instance.get('/etsy-ads', { params });
};

export const getEtsyAdsByEmployee = (params) => {
  return instance.get('/etsy-ads/by-employee', { params });
};

export const exportAdsEtsyByEmployee = ({ from, to, shopId }) => {
  const params = { from, to };
  if (shopId) params.shopId = shopId;

  return instance.get('/etsy-ads/export-by-employee', {
    params,
    responseType: 'blob',
  });
};
