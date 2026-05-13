import instance from '.';

export const getAllAdsEtsy = (start,end,shopid) => {
  return instance.get(`/etsy-ads?from=${start}&to=${end}&shopId=${shopid}`);
};

