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

export { getAllListing, createListing, importListing };
