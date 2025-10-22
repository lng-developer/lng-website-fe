import instance from '.';

export async function fetchOrders(params) {
  const r = await instance.get('/order/fe', { params });
  if (r.status !== 200) throw new Error(r?.data?.message || 'Order fetch failed');
  return { items: r.data?.data ?? [], total: r.data?.totalCount ?? 0 };
}
export async function fetchCountStatus(params) {
  const r = await instance.get('/order/statistic', { params });
  if (r.status !== 200) throw new Error(r?.data?.message || 'Count fetch failed');
  return r.data;
}
export async function fetchShops() {
  const r = await instance.get('/shop');
  if (r.status !== 200) throw new Error('Shop fetch failed');
  return r.data ?? [];
}
export async function fetchVendorProducts() {
  const r = await instance.get('/vendor-product', { all: true });
  if (r.status !== 200) throw new Error('Vendor fetch failed');
  return (r.data?.data ?? []).map((i) => ({ value: i?._id, label: `${i?.vendor?.name} - ${i?.product_name}` }));
}
