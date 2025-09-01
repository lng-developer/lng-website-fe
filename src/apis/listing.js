import instance from '.';

const getAllListing = (params) => {
  return instance.get('/listing', { params });
};

const createListing = (payload) => {
  return instance.post('/listing', payload);
};

const importListing = (payload) => {
  return instance.post('/listing/import', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const uploadPSD = (asin, payload) => {
  return instance.patch(`/listing/${asin}/psd`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const dowloadPSD = (asin) => {
  return instance.get(`/listing/${asin}/psd-url`);
};

export { getAllListing, createListing, importListing, uploadPSD, dowloadPSD };
