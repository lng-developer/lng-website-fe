/**
 * useEtsyOrderCost.js
 * ─────────────────────────────────────────────────────────────
 * Custom hook chứa toàn bộ logic cho trang Etsy Order Cost.
 * Tách riêng khỏi UI để dễ maintain và đổi sang API thực.
 *
 * Khi có API:
 *   1. Xóa import generateMockEtsyOrders / computeEtsyOrderStats
 *   2. Thay fetchOrders bằng API call
 *   3. Thay fetchStats bằng API call
 * ─────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import { defaultFrom, defaultTo } from '../../../../utils/fomatDate';
import { generateMockEtsyOrders, computeEtsyOrderStats } from '../mock/etsy.mockData';

const PAGE_SIZE = 10;

export function useEtsyOrderCost() {
  // ── raw data from "API" ─────────────────────────────────────
  const [allOrders, setAllOrders] = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(false);

  // ── filter state ────────────────────────────────────────────
  const [filters, setFilters] = useState({
    from:     defaultFrom,
    to:       defaultTo,
    search:   '',
    shopName: '',
    status:   '',
  });

  // ── pagination ───────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(PAGE_SIZE);

  // ── expand state ─────────────────────────────────────────────
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [allExpanded, setAllExpanded]         = useState(true);

  // ── fetch (mock) ─────────────────────────────────────────────
  const fetchOrders = useCallback((params) => {
    setLoading(true);
    // TODO: replace with API call
    // const res = await getEtsyOrderCost(params);
    setTimeout(() => {
      const data = generateMockEtsyOrders(params.from, params.to);
      setAllOrders(data);
      setStats(computeEtsyOrderStats(data));
      setLoading(false);
    }, 350);
  }, []);

  // ── filter helpers ───────────────────────────────────────────
  const updateFilter = (newValues) => {
    setFilters((prev) => ({ ...prev, ...newValues }));
    setCurrentPage(1);
  };

  const debouncedSearch = useMemo(
    () => debounce((val) => updateFilter({ search: val }), 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── filtered + paginated data ────────────────────────────────
  const filteredOrders = useMemo(() => {
    let data = allOrders;
    const q = filters.search?.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.buyerName?.toLowerCase().includes(q) ||
          o.shopName?.toLowerCase().includes(q)
      );
    }
    if (filters.shopName) {
      data = data.filter((o) => o.shopName === filters.shopName);
    }
    if (filters.status) {
      data = data.filter((o) => o.status === filters.status);
    }
    return data;
  }, [allOrders, filters.search, filters.shopName, filters.status]);

  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalCount = filteredOrders.length;

  // ── live stats computed from filtered orders ─────────────────
  const filteredStats = useMemo(
    () => computeEtsyOrderStats(filteredOrders),
    [filteredOrders]
  );

  // ── expand helpers ────────────────────────────────────────────
  const handleExpand = (expanded, record) => {
    setExpandedRowKeys((prev) =>
      expanded ? [...prev, record.key] : prev.filter((k) => k !== record.key)
    );
  };

  const toggleAllExpanded = () => {
    if (allExpanded) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(pagedOrders.map((o) => o.orderId));
    }
    setAllExpanded((prev) => !prev);
  };

  // ── pagination ────────────────────────────────────────────────
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size || PAGE_SIZE);
  };

  // ── keep expand keys in sync when page changes ────────────────
  useEffect(() => {
    if (allExpanded) {
      setExpandedRowKeys(pagedOrders.map((o) => o.orderId));
    }
  }, [pagedOrders, allExpanded]);

  // ── initial fetch & re-fetch on date change ───────────────────
  useEffect(() => {
    fetchOrders(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to]);

  return {
    // data
    pagedOrders,
    filteredStats,
    totalCount,
    loading,
    // filters
    filters,
    updateFilter,
    debouncedSearch,
    // pagination
    currentPage,
    pageSize,
    handlePageChange,
    // expand
    expandedRowKeys,
    allExpanded,
    handleExpand,
    toggleAllExpanded,
    // actions
    refresh: () => fetchOrders(filters),
  };
}
