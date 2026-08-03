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

const buildEtsyListingDesignFileUrl = (listingId, action = '') => {
  const params = new URLSearchParams({ listingId: String(listingId || '') });
  const suffix = action ? `/${action}` : '';
  return `/etsy-listing/design-file${suffix}?${params.toString()}`;
};

const uploadEtsyListingDesignFile = (listingId, payload, options = {}) => {
  return instance.post(buildEtsyListingDesignFileUrl(listingId), payload, {
    ...options,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(options.headers || {}),
    },
  });
};

const downloadEtsyListingDesignFile = (listingId) => {
  return instance.get(buildEtsyListingDesignFileUrl(listingId, 'download'));
};

const deleteEtsyListingDesignFile = (listingId) => {
  return instance.delete(buildEtsyListingDesignFileUrl(listingId));
};

export {
  getEtsyListings,
  getEtsyListingDetail,
  buildEtsyListingDesignFileUrl,
  uploadEtsyListingDesignFile,
  downloadEtsyListingDesignFile,
  deleteEtsyListingDesignFile,
};
