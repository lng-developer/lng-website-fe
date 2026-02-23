import instance from '.';
const getAllEtsyOrders = (params) => {
  return instance.get('/etsy', {
    params: {
      ...params,
      limit: params.perPage || 20,
    },
  });
};

export { getAllEtsyOrders };
