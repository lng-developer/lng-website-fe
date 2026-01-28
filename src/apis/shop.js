import instance from '.';

// Nếu dự án bạn đã có instance instance (ví dụ: instanceClient), thay instance bằng instance đó để đồng bộ interceptor/token.

export const getAllShop = () => instance.get('/shop');

export const createShop = (payload) => instance.post('/shop', payload);

export const updateShop = (id, payload) => instance.put(`/shop/${id}`, payload);

export const deleteShop = (id) => instance.delete(`/shop/${id}`);

export const addUserToShop = (payload) => instance.post('/shop/add-user', payload);

export const updateShopStatus = (payload) => instance.post('/shop/update-status', payload);
