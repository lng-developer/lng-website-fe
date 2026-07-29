import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { defaultFrom, defaultTo } from '../../../../utils/fomatDate';
import { getAllEtsyOrders } from '../../../../apis/etsy';
import {
  computeEtsyOrderStats,
  normalizeEtsyOrderCostResponse,
} from '../etsyOrderCostMapper';

const PAGE_SIZE = 10;

export function useEtsyOrderCost() {
  const [allOrders, setAllOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const latestRequestRef = useRef(0);

  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
    search: '',
    shopName: '',
    status: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [allExpanded, setAllExpanded] = useState(true);

  const fetchOrders = useCallback(async (params) => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setLoading(true);

    try {
      const res = await getAllEtsyOrders({
        page: params.page,
        perPage: params.limit,
        from: params.from,
        to: params.to,
        search: params.search,
        shopName: params.shopName,
        status: params.status,
      });

      if (latestRequestRef.current !== requestId) return;

      const payload = normalizeEtsyOrderCostResponse(res?.data);
      setAllOrders(payload.orders);
      setTotalCount(payload.totalCount);
    } catch (error) {
      if (latestRequestRef.current !== requestId) return;
      console.error('Failed to fetch Etsy order cost report:', error);
      setAllOrders([]);
      setTotalCount(0);
    } finally {
      if (latestRequestRef.current === requestId) setLoading(false);
    }
  }, []);

  const updateFilter = (newValues) => {
    setFilters((prev) => ({ ...prev, ...newValues }));
    setCurrentPage(1);
  };

  const debouncedSearch = useMemo(
    () => debounce((val) => updateFilter({ search: val }), 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const pagedOrders = allOrders;

  const filteredStats = useMemo(
    () => computeEtsyOrderStats(allOrders),
    [allOrders]
  );

  const shopOptions = useMemo(
    () => [...new Set(allOrders.map((o) => o.shopName).filter(Boolean))],
    [allOrders]
  );

  const statusOptions = useMemo(
    () => [...new Set(allOrders.map((o) => o.status).filter(Boolean))],
    [allOrders]
  );

  const handleExpand = (expanded, record) => {
    setExpandedRowKeys((prev) =>
      expanded ? [...prev, record.key] : prev.filter((key) => key !== record.key)
    );
  };

  const toggleAllExpanded = () => {
    if (allExpanded) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(pagedOrders.map((order) => order.orderId));
    }
    setAllExpanded((prev) => !prev);
  };

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size || PAGE_SIZE);
  };

  useEffect(() => {
    if (allExpanded) {
      setExpandedRowKeys(pagedOrders.map((order) => order.orderId));
    }
  }, [pagedOrders, allExpanded]);

  useEffect(() => {
    fetchOrders({
      ...filters,
      page: currentPage,
      limit: pageSize,
    });
  }, [currentPage, fetchOrders, filters, pageSize]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  return {
    pagedOrders,
    filteredStats,
    totalCount,
    loading,
    filters,
    updateFilter,
    debouncedSearch,
    shopOptions,
    statusOptions,
    currentPage,
    pageSize,
    handlePageChange,
    expandedRowKeys,
    allExpanded,
    handleExpand,
    toggleAllExpanded,
    refresh: () => fetchOrders({ ...filters, page: currentPage, limit: pageSize }),
  };
}
