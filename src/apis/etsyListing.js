import instance from '.';

const getEtsyListings = (params = {}) => {
  return instance.get('/etsy-listing', {
    params: {
      page: params.page || 1,
      perPage: params.perPage || 10,
      search: params.search || '',
      stock: params.stock || '',
      shopId: params.shopId || '',
    },
  });
};

const getEtsyListingDetail = (id) => {
  return instance.get(`/etsy-listing/${id}`);
};

export { getEtsyListings, getEtsyListingDetail };
