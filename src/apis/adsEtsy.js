import instance from '.';

export const getAllAdsEtsy = (start,end,shopid) => {
  return instance.get(`/etsy-ads?from=${start}&to=${end}&shopId=${shopid}`);
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
