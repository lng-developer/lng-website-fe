import instance from '.';

const getAllSellers = (params) => {
  return instance.get('/user/sellers', { params });
};

const getAllDesigner = (params) => {
  return instance.get('/user/designer', { params });
};

export { getAllSellers, getAllDesigner };
