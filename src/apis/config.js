import instance from '.';

const getAllConfig = (params) => {
  return instance.get('/product-type?include=details', { params });
};

export { getAllConfig };
