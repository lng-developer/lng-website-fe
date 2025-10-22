import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { fetchOrders, fetchCountStatus, fetchShops, fetchVendorProducts } from '../apis/orders';
import { replaceOrder, retestBasecode } from '../apis/order';

export const useOrders = (filters) =>
  useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
    select: (d) => d, // có thể map ở đây nếu muốn
  });

export const useOrderCounts = (filters) =>
  useQuery({
    queryKey: ['order-counts', { ...filters, openCase: false }],
    queryFn: () => fetchCountStatus({ ...filters, openCase: false }),
  });

export const useShops = () => useQuery({ queryKey: ['shops'], queryFn: fetchShops, staleTime: 30 * 60 * 1000 });

export const useVendorProduct = () => useQuery({ queryKey: ['vendor-products'], queryFn: fetchVendorProducts, staleTime: 60 * 60 * 1000 });

export const useRetestBasecode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => retestBasecode({ orderId }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order-counts'] });
    },
  });
};

export const useReplaceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => replaceOrder(orderId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order-counts'] });
    },
  });
};

export const ordersKey = (filters) => ['orders', filters];

export async function prefetchOrders(QueryClient, filters) {
  return QueryClient.prefetchQuery({
    queryKey: ordersKey(filters),
    queryFn: () => fetchOrders(filters),
    staleTime: 5 * 60 * 1000,
  });
}
