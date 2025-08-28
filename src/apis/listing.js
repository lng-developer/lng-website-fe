import instance from '.';

const getAllListing = (params) => {
  return instance.get('/listing', { params });
};

export { getAllListing };
