import instance from '.';

export const getOrderLifecycleSummary = (params = {}) => {
  return instance.get('/order-lifecycle/summary', { params });
};

export const getOrderLifecycleEvents = (params = {}) => {
  return instance.get('/order-lifecycle/events', { params });
};
