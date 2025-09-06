import instance from '.';

const getAllSellers = (params) => {
  return instance.get('/user/sellers', { params });
};

export { getAllSellers };
