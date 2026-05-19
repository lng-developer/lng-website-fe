import { useOutletContext } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Empty, Select, Table, Tag, Tooltip } from 'antd';
import { defaultFrom, defaultTo } from '../../utils/fomatDate';
import DateRangePicker from '../../components/DateRangePicker';
import { getAllAdsEtsy } from '../../apis/adsEtsy';
import { getAllShop } from '../../apis/shop';
import { getAllEtsyOrders } from '../../apis/etsy';
import { getAllSellers } from '../../apis/user';

const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtNum = (n) => Number(n || 0).toLocaleString('en-US');
const fmtPercent = (n) => `${Number(n || 0).toFixed(1)}%`;

const decodeHtml = (str = '') =>
  String(str)
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const toYMD = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const pickItemListingId = (item) =>
  String(
    item?.listingId ||
      item?.listing_id ||
      item?.listingID ||
      item?.rawListing?.listing_id ||
      item?.rawListing?.listing?.listing_id ||
      ''
  );

const pickItemSku = (item) =>
  String(
    item?.sku ||
      item?.SKU ||
      item?.productSku ||
      item?.product_sku ||
      item?.rawTransaction?.sku ||
      item?.rawTransaction?.product?.product_identifier ||
      ''
  ).trim();

const splitSkuValues = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((sku) => String(sku || '').trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((sku) => sku.trim())
    .filter(Boolean);
};

const pickOrderItemId = (item) => String(item?.orderItemId || item?.order_item_id || item?._id || '');

const hasBackendSku = (row) => {
  const sku = String(row?.sku || row?.SKU || row?.productSku || '').trim();
  const skus = Array.isArray(row?.skus) ? row.skus.filter(Boolean) : row?.skus;
  return !!sku || (Array.isArray(skus) ? skus.length > 0 : !!skus);
};

const pickTotalCount = (data) => data?.totalCount || data?.total || data?.count || data?.pagination?.total || undefined;

const explainMissingSku = (row, info, rowSku) => {
  const adsListingId = String(row?.listingId || '');
  if (!adsListingId) return 'ads_row_missing_listing_id';
  if (!info?.hasListingInOrderMap) return 'listing_id_not_found_in_orders';
  if (!rowSku && !info?.sku) return 'listing_found_but_order_sku_missing';
  return 'unknown';
};

const logSkuDebug = (stage, data) => {
  try {
    console.log(`[ADS_ETSY_FE][SKU_DEBUG][${stage}]`, data);
  } catch (error) {
    console.warn('[ADS_ETSY_FE][SKU_DEBUG][LOG_ERROR]', {
      stage,
      message: error?.message || String(error),
    });
  }
};

const AdsEtsyReport = () => {
  const { collapsed } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
  });

  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  const getADSEtsyReport = async (params, shop) => {
    if (!shop) return;
    try {
      setLoading(true);
      const from = toYMD(params?.from);
      const to = toYMD(params?.to);
      const response = await getAllAdsEtsy(from, to, shop);
      const list = response?.data?.items || [];

      const adsAudit = list.flatMap((doc) =>
        (doc?.rows || []).map((row) => ({
          docId: doc?._id,
          day: doc?.day,
          shopName: doc?.shopName,
          listingId: String(row?.listingId || ''),
          title: String(row?.title || '').slice(0, 80),
          sku: row?.sku,
          skus: row?.skus,
          skuSource: row?.skuSource,
          hasBackendSku: hasBackendSku(row),
          spend: row?.spend,
          revenue: row?.revenue,
          orders: row?.orders,
          rawKeys: Object.keys(row || {}),
        }))
      );
      const skuSourceCounts = adsAudit.reduce((acc, row) => {
        const source = row.skuSource || 'missing';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      logSkuDebug('ADS_API_RESPONSE', {
        docsCount: list.length,
        adsRowsCount: adsAudit.length,
        adsListingIdsCount: new Set(adsAudit.map((x) => x.listingId).filter(Boolean)).size,
        sample: adsAudit.slice(0, 30),
      });

      logSkuDebug('ADS_API_RESPONSE_DEEP', {
        selectedShopId: shop,
        from,
        to,
        docsCount: list.length,
        rowsCount: adsAudit.length,
        uniqueAdsListingIds: new Set(adsAudit.map((x) => x.listingId).filter(Boolean)).size,
        rowsWithSkuFromBackend: adsAudit.filter((x) => x.hasBackendSku).length,
        rowsMissingSkuFromBackend: adsAudit.filter((x) => !x.hasBackendSku).length,
        skuSourceCounts,
        sampleRows: adsAudit.slice(0, 50),
      });

      setItems(list);
    } catch (error) {
      console.error('Error fetching Etsy Ads Report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const res = await getAllShop();
      const list = (res?.data || []).filter((s) => s?.merchant === 'Etsy' && s?.status === 'Active');
      setShops(list);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchEtsyOrders = async () => {
    try {
      const perPage = 200;
      let page = 1;
      let totalPages = 1;
      const allOrders = [];

      while (page <= totalPages) {
        const requestParams = { page, perPage };

        logSkuDebug('ORDERS_API_REQUEST', {
          page,
          perPage,
          shopId,
          filters: {
            from: toYMD(filters?.from),
            to: toYMD(filters?.to),
          },
          params: requestParams,
        });

        const res = await getAllEtsyOrders(requestParams);
        const list = res?.data?.data || res?.data || [];
        const safeList = Array.isArray(list) ? list : [];
        const pageSkuAudit = safeList.flatMap((order) =>
          (order?.items || []).map((item) => ({
            orderId: order?.orderId || order?._id || '',
            orderItemId: pickOrderItemId(item),
            transactionId: item?.transactionId || item?.transaction_id || '',
            listingId: pickItemListingId(item),
            sku: pickItemSku(item),
            itemName: String(item?.itemName || item?.title || '').slice(0, 80),
            itemKeys: Object.keys(item || {}),
          }))
        );

        logSkuDebug('ORDERS_API_PAGE_RESPONSE', {
          page,
          responseDataType: Array.isArray(res?.data) ? 'array' : typeof res?.data,
          dataKeys: res?.data && typeof res.data === 'object' ? Object.keys(res.data) : [],
          currentPage: res?.data?.currentPage,
          totalPages: res?.data?.totalPages,
          totalCount: pickTotalCount(res?.data),
          ordersCount: safeList.length,
          totalItems: pageSkuAudit.length,
          itemsWithListingId: pageSkuAudit.filter((x) => x.listingId).length,
          itemsWithSku: pageSkuAudit.filter((x) => x.sku).length,
          itemsMissingSku: pageSkuAudit.filter((x) => !x.sku).length,
          itemsMissingListingId: pageSkuAudit.filter((x) => !x.listingId).length,
          sample: pageSkuAudit.slice(0, 30),
        });

        if (page === 1) {
          logSkuDebug('ORDERS_API_RESPONSE', {
            rawDataType: Array.isArray(res?.data) ? 'array' : typeof res?.data,
            dataKeys: res?.data && typeof res.data === 'object' ? Object.keys(res.data) : [],
            currentPage: res?.data?.currentPage,
            totalPages: res?.data?.totalPages,
            perPage,
            ordersCount: safeList.length,
            totalItems: pageSkuAudit.length,
            itemsWithSku: pageSkuAudit.filter((x) => x.sku).length,
            itemsMissingSku: pageSkuAudit.filter((x) => !x.sku).length,
            sample: pageSkuAudit.slice(0, 30),
            missingSkuSample: pageSkuAudit.filter((x) => !x.sku).slice(0, 20),
          });
        }

        allOrders.push(...safeList);
        totalPages = Number(res?.data?.totalPages || 1);
        page += 1;
      }

      const skuAudit = allOrders.flatMap((order) =>
        (order?.items || []).map((item) => ({
          orderId: order?.orderId || order?._id || '',
          orderItemId: pickOrderItemId(item),
          transactionId: item?.transactionId || item?.transaction_id || '',
          listingId: pickItemListingId(item),
          itemName: String(item?.itemName || item?.title || '').slice(0, 80),
          sku: pickItemSku(item),
          hasSku: !!pickItemSku(item),
        }))
      );
      const listingSkuMap = new Map();

      skuAudit.forEach((item) => {
        if (!item.listingId) return;
        const entry = listingSkuMap.get(item.listingId) || { skus: new Set(), ordersCount: 0 };
        entry.ordersCount += 1;
        if (item.sku) entry.skus.add(item.sku);
        listingSkuMap.set(item.listingId, entry);
      });

      logSkuDebug('ORDERS_ALL_PAGES_FETCHED', {
        totalPages,
        totalOrders: allOrders.length,
        totalItems: skuAudit.length,
        uniqueListingIds: new Set(skuAudit.map((x) => x.listingId).filter(Boolean)).size,
        itemsWithSku: skuAudit.filter((x) => x.hasSku).length,
        itemsMissingSku: skuAudit.filter((x) => !x.hasSku).length,
        sample: skuAudit.slice(0, 30),
      });

      logSkuDebug('ORDERS_ALL_PAGES_DEEP', {
        totalPagesFetched: page - 1,
        totalOrders: allOrders.length,
        totalItems: skuAudit.length,
        uniqueOrderListingIds: new Set(skuAudit.map((x) => x.listingId).filter(Boolean)).size,
        itemsWithSku: skuAudit.filter((x) => x.sku).length,
        itemsMissingSku: skuAudit.filter((x) => !x.sku).length,
        itemsWithListingId: skuAudit.filter((x) => x.listingId).length,
        itemsMissingListingId: skuAudit.filter((x) => !x.listingId).length,
        topListingIdSkuSample: Array.from(listingSkuMap.entries())
          .sort((a, b) => b[1].ordersCount - a[1].ordersCount)
          .slice(0, 50)
          .map(([listingId, entry]) => ({
            listingId,
            skus: Array.from(entry.skus),
            ordersCount: entry.ordersCount,
          })),
        missingSkuSample: skuAudit.filter((x) => !x.sku).slice(0, 50),
        missingListingIdSample: skuAudit.filter((x) => !x.listingId).slice(0, 50),
      });

      setOrders(allOrders);
    } catch (error) {
      console.error('Error fetching Etsy orders:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await getAllSellers();
      setSellers(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const sellerByEmployeeId = useMemo(() => {
    const map = new Map();
    (sellers || []).forEach((s) => {
      if (s?.employee_id) map.set(String(s.employee_id).trim().toUpperCase(), s.full_name || '');
    });
    return map;
  }, [sellers]);

  const resolveSellerNamesFromSkus = (skus) => {
    const names = new Set();
    skus.forEach((sku) => {
      if (!sku) return;
      const code = String(sku).trim().slice(0, 5).toUpperCase();
      const name = sellerByEmployeeId.get(code);
      if (name) names.add(name);
    });
    return Array.from(names).join(', ');
  };

  const listingInfoMap = useMemo(() => {
    const map = new Map();
    let totalItems = 0;
    let itemsWithListingId = 0;
    let itemsWithSku = 0;
    const skipped = [];

    (orders || []).forEach((order) => {
      const seller = order?.seller?.full_name || order?.seller?.name || order?.seller || null;

      (order?.items || []).forEach((item) => {
        totalItems += 1;

        const lid = pickItemListingId(item);
        const sku = pickItemSku(item);

        if (lid) itemsWithListingId += 1;
        if (sku) itemsWithSku += 1;

        if (!lid) {
          skipped.push({
            orderId: order?.orderId || order?._id || '',
            transactionId: item?.transactionId || item?.transaction_id || '',
            itemName: String(item?.itemName || item?.title || '').slice(0, 80),
            sku,
            itemKeys: Object.keys(item || {}),
          });
          return;
        }

        const entry = map.get(lid) || { skus: new Set(), sellers: new Set(), ordersCount: 0 };
        entry.ordersCount += 1;
        if (sku) entry.skus.add(sku);
        if (seller) entry.sellers.add(typeof seller === 'string' ? seller : JSON.stringify(seller));
        map.set(lid, entry);
      });
    });

    logSkuDebug('LISTING_INFO_MAP_BUILT', {
      ordersCount: orders?.length || 0,
      totalItems,
      itemsWithListingId,
      itemsWithSku,
      mapSize: map.size,
      skippedNoListingIdCount: skipped.length,
      skippedNoListingIdSample: skipped.slice(0, 20),
      mapSample: Array.from(map.entries())
        .slice(0, 30)
        .map(([listingId, entry]) => ({
          listingId,
          skus: Array.from(entry.skus),
          sellers: Array.from(entry.sellers),
          ordersCount: entry.ordersCount,
        })),
    });

    logSkuDebug('LISTING_INFO_MAP_DETAIL', {
      ordersCount: orders?.length || 0,
      totalItems,
      mapSize: map.size,
      listingIdsWithSku: Array.from(map.values()).filter((entry) => entry.skus.size > 0).length,
      listingIdsWithoutSku: Array.from(map.values()).filter((entry) => entry.skus.size === 0).length,
      duplicateListingIdsWithMultipleSkus: Array.from(map.values()).filter((entry) => entry.skus.size > 1).length,
      mapSample: Array.from(map.entries())
        .slice(0, 50)
        .map(([listingId, entry]) => ({
          listingId,
          skus: Array.from(entry.skus),
          sellers: Array.from(entry.sellers),
          ordersCount: entry.ordersCount,
        })),
      skippedNoListingIdSample: skipped.slice(0, 50),
    });

    return map;
  }, [orders]);

  const getListingInfo = (listingId) => {
    const entry = listingInfoMap.get(String(listingId));
    if (!entry) return { sku: '', seller: '', hasListingInOrderMap: false, skus: [] };
    const skus = Array.from(entry.skus);
    const sellerFromSku = resolveSellerNamesFromSkus(skus);
    return {
      sku: skus.join(', '),
      seller: sellerFromSku || Array.from(entry.sellers).join(', '),
      hasListingInOrderMap: true,
      skus,
    };
  };

  useEffect(() => {
    fetchShops();
    fetchEtsyOrders();
    fetchSellers();
  }, []);

  useEffect(() => {
    if (shopId) getADSEtsyReport(filters, shopId);
    else setItems([]);
  }, [filters.from, filters.to, shopId]);

    const summary = useMemo(() => {
      return items.reduce(
        (acc, it) => {
          acc.totalSpend += Number(it?.totalSpend || 0);
          acc.totalViews += Number(it?.totalViews || 0);
          acc.totalClicks += Number(it?.totalClicks || 0);
          acc.totalOrders += Number(it?.totalOrders || 0);
          acc.totalRevenue += Number(it?.totalRevenue || 0);
          acc.totalRows += Number(it?.totalRows || 0);
          return acc;
        },
        { totalSpend: 0, totalViews: 0, totalClicks: 0, totalOrders: 0, totalRevenue: 0, totalRows: 0 }
      );
    }, [items]);

    const tableData = useMemo(() => {
      const rows = [];
      const matchAudit = [];
      const adsListingIds = new Set();

      items.forEach((it) => {
        (it?.rows || []).forEach((r, idx) => {
          const adsListingId = String(r.listingId || '');
          if (adsListingId) adsListingIds.add(adsListingId);
          const info = getListingInfo(adsListingId);
          const rowSku = String(r.sku || r.SKU || r.productSku || '').trim();
          const rowSkus = Array.isArray(r.skus) ? r.skus.filter(Boolean) : r.skus;
          const rowSeller = String(r.seller || r.sellerName || '').trim();
          const finalSku = rowSku || info.sku;
          const sellerFromVisibleSku = resolveSellerNamesFromSkus([
            ...splitSkuValues(rowSku),
            ...splitSkuValues(rowSkus),
            ...splitSkuValues(info.sku),
          ]);
          const finalSeller = sellerFromVisibleSku || rowSeller || info.seller;
          const skuSource = rowSku ? 'ads_row' : info.sku ? 'orders_fallback' : 'missing';

          matchAudit.push({
            adsListingId,
            title: String(r.title || '').slice(0, 80),
            matched: !!finalSku,
            sku: finalSku,
            skuSource,
            seller: finalSeller,
            spend: r.spend,
            revenue: r.revenue,
            orders: r.orders,
            rowSku,
            rowSkus,
            rowSkuSource: r.skuSource,
            hasListingInOrderMap: info.hasListingInOrderMap,
            orderMapSkus: info.skus,
            reason: finalSku ? '' : explainMissingSku(r, info, rowSku),
          });

          rows.push({
            key: `${it._id}-${r.listingId}-${idx}`,
            shopName: it.shopName,
            ...r,
            title: decodeHtml(r.title),
            sku: finalSku,
            seller: finalSeller,
          });
        });
      });

      logSkuDebug('ADS_TO_ORDER_MATCH_AUDIT', {
        adsRows: matchAudit.length,
        matchedRows: matchAudit.filter((x) => x.matched).length,
        missingSkuRows: matchAudit.filter((x) => !x.matched).length,
        matchedSample: matchAudit.filter((x) => x.matched).slice(0, 20),
        missingSample: matchAudit.filter((x) => !x.matched).slice(0, 30),
      });

      logSkuDebug('SKU_SOURCE_AUDIT', {
        adsRows: matchAudit.length,
        fromAdsRow: matchAudit.filter((x) => x.skuSource === 'ads_row').length,
        fromOrdersFallback: matchAudit.filter((x) => x.skuSource === 'orders_fallback').length,
        missing: matchAudit.filter((x) => x.skuSource === 'missing').length,
        missingSample: matchAudit.filter((x) => x.skuSource === 'missing').slice(0, 30),
      });

      logSkuDebug('ADS_TO_ORDER_MATCH_DEEP', {
        adsRows: matchAudit.length,
        adsUniqueListingIds: adsListingIds.size,
        orderMapListingIds: listingInfoMap.size,
        matchedByAdsRowSku: matchAudit.filter((x) => x.skuSource === 'ads_row').length,
        matchedByOrdersFallback: matchAudit.filter((x) => x.skuSource === 'orders_fallback').length,
        matchedListingIdButNoSku: matchAudit.filter((x) => x.reason === 'listing_found_but_order_sku_missing').length,
        missingListingIdInOrderMap: matchAudit.filter((x) => x.reason === 'listing_id_not_found_in_orders').length,
        missingAdsListingId: matchAudit.filter((x) => x.reason === 'ads_row_missing_listing_id').length,
        missingSample: matchAudit
          .filter((x) => !x.matched)
          .slice(0, 50)
          .map((x) => ({
            adsListingId: x.adsListingId,
            title: x.title,
            spend: x.spend,
            orders: x.orders,
            rowSku: x.rowSku,
            rowSkus: x.rowSkus,
            rowSkuSource: x.rowSkuSource,
            hasListingInOrderMap: x.hasListingInOrderMap,
            orderMapSkus: x.orderMapSkus,
            reason: x.reason,
          })),
        matchedSample: matchAudit
          .filter((x) => x.matched)
          .slice(0, 30)
          .map((x) => ({
            adsListingId: x.adsListingId,
            title: x.title,
            sku: x.sku,
            skuSource: x.skuSource,
            rowSku: x.rowSku,
            rowSkus: x.rowSkus,
            orderMapSkus: x.orderMapSkus,
            spend: x.spend,
            orders: x.orders,
          })),
      });

      return rows.sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0));
    }, [items, listingInfoMap, sellerByEmployeeId]);

    const columns = [
      {
        title: '#',
        key: 'index',
        width: 60,
        align: 'center',
        render: (_, __, index) => <span className="text-gray-500">{index + 1}</span>,
      },
      {
        title: 'Listing',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text, record) => (
          <Tooltip title={text}>
            <div className="flex flex-col">
              <span className="font-medium text-black truncate max-w-[420px]">{text}</span>
              <span className="text-xs text-gray-500 font-mono">ID: {record.listingId}</span>
            </div>
          </Tooltip>
        ),
      },
      {
        title: 'SKU',
        dataIndex: 'sku',
        key: 'sku',
        width: 180,
        render: (v) =>
          v ? (
            <Tooltip title={v}>
              <span className="font-mono text-xs text-black truncate inline-block max-w-[160px] align-middle">{v}</span>
            </Tooltip>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      {
        title: 'Seller',
        dataIndex: 'seller',
        key: 'seller',
        width: 140,
        render: (v) =>
          v ? (
            <Tooltip title={v}>
              <span className="text-xs text-gray-800 truncate inline-block max-w-[120px] align-middle">{v}</span>
            </Tooltip>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        align: 'center',
        render: (v) => <span className="text-gray-700">{v}</span>,
      },
      {
        title: 'Spend',
        dataIndex: 'spend',
        key: 'spend',
        width: 110,
        align: 'right',
        sorter: (a, b) => a.spend - b.spend,
        render: (v) => <span className="font-semibold text-black">{fmtMoney(v)}</span>,
      },
      {
        title: 'Views',
        dataIndex: 'views',
        key: 'views',
        width: 100,
        align: 'right',
        sorter: (a, b) => a.views - b.views,
        render: (v) => <span className="text-gray-800">{fmtNum(v)}</span>,
      },
      {
        title: 'Clicks',
        dataIndex: 'clicks',
        key: 'clicks',
        width: 90,
        align: 'right',
        sorter: (a, b) => a.clicks - b.clicks,
        render: (v) => <span className="text-gray-800">{fmtNum(v)}</span>,
      },
      {
        title: 'CTR',
        dataIndex: 'clickRate',
        key: 'clickRate',
        width: 90,
        align: 'right',
        sorter: (a, b) => a.clickRate - b.clickRate,
        render: (v) => <span className="text-gray-700">{fmtPercent(v)}</span>,
      },
      {
        title: 'Orders',
        dataIndex: 'orders',
        key: 'orders',
        width: 90,
        align: 'right',
        sorter: (a, b) => a.orders - b.orders,
        render: (v) =>
          Number(v) > 0 ? (
            <Tag className="!bg-black !text-white !border-black !m-0">{fmtNum(v)}</Tag>
          ) : (
            <span className="text-gray-400">0</span>
          ),
      },
      {
        title: 'Revenue',
        dataIndex: 'revenue',
        key: 'revenue',
        width: 120,
        align: 'right',
        sorter: (a, b) => a.revenue - b.revenue,
        render: (v) =>
          Number(v) > 0 ? <span className="font-semibold text-black">{fmtMoney(v)}</span> : <span className="text-gray-400">$0.00</span>,
      },
      {
        title: 'ROAS',
        dataIndex: 'roas',
        key: 'roas',
        width: 90,
        align: 'right',
        sorter: (a, b) => a.roas - b.roas,
        render: (v) =>
          Number(v) > 0 ? (
            <Tag className="!bg-white !text-black !border-black !m-0">{Number(v).toFixed(2)}x</Tag>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
    ];

    const StatCard = ({ label, value, sub }) => (
      <div className="flex-1 p-4 rounded-xl border border-gray-200 bg-white hover:border-black transition-colors">
        <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</div>
        <div className="text-2xl font-bold text-black mt-1">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
      </div>
    );

    return (
      <div className="bg-white h-screen overflow-hidden flex flex-col">
        <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300 border-b border-gray-200`}>
          <div className="h-[60px] gap-4 p-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-black rounded-full" />
              <h1 className="text-2xl font-bold !mb-0 text-black">Etsy Ads Report</h1>
            </div>
            <div className="flex justify-center items-center gap-2">
              <Select
                value={shopId}
                onChange={(val) => setShopId(val)}
                placeholder="Select Etsy Shop"
                style={{ width: 240 }}
                size="large"
                options={shops.map((s) => ({ label: s.name, value: s._id }))}
                className="ads-etsy-select"
                allowClear
              />
              <DateRangePicker
                mode="range"
                showOutsideDays
                modifiersClassNames={{
                  selected: 'my-selected',
                  range_middle: 'my-range-middle',
                }}
                modifiersStyles={{
                  range_middle: {
                    backgroundColor: '#f3f4f6',
                    fontWeight: 'normal',
                  },
                }}
                updateFilter={updateFilter}
              />
            </div>
          </div>
        </div>

        <div className="mt-[60px] px-8 py-6">
          {/* Summary cards */}
          <div className="flex gap-4 flex-wrap">
            <StatCard label="Total Spend" value={fmtMoney(summary.totalSpend)} sub={`${items.length} shop(s)`} />
            <StatCard label="Revenue" value={fmtMoney(summary.totalRevenue)} sub={`${summary.totalOrders} orders`} />
            <StatCard
              label="ROAS"
              value={summary.totalSpend > 0 ? `${(summary.totalRevenue / summary.totalSpend).toFixed(2)}x` : '-'}
              sub="Return on ad spend"
            />
            <StatCard label="Views" value={fmtNum(summary.totalViews)} sub={`${fmtNum(summary.totalClicks)} clicks`} />
            <StatCard
              label="CTR"
              value={summary.totalViews > 0 ? fmtPercent((summary.totalClicks / summary.totalViews) * 100) : '0.0%'}
              sub={`${summary.totalRows} listings`}
            />
          </div>

          {/* Shop header */}
          {items?.length > 0 && (
            <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-black text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold">
                  {items[0]?.shopName?.charAt(0) || 'E'}
                </div>
                <div>
                  <div className="text-lg font-bold">{items[0]?.shopName}</div>
                  <div className="text-xs text-gray-300 font-mono">Etsy Shop ID: {items[0]?.etsyShopId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-300 uppercase tracking-wider">Day</div>
                <div className="font-semibold">{items[0]?.day?.slice(0, 10)}</div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden bg-white">
            {tableData.length > 0 ? (
              <Table
                loading={loading}
                dataSource={tableData}
                columns={columns}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  showTotal: (total) => `Total ${total} listings`,
                }}
                size="middle"
                scroll={{ x: 1420, y: 'calc(100vh - 430px)' }}
                sticky
                className="ads-etsy-table"
              />
            ) : (
              <div className="py-16">
                <Empty description={!shopId ? 'Please select an Etsy shop to view the report' : loading ? 'Loading...' : 'No data'} />
              </div>
            )}
          </div>
        </div>

        <style>{`
        .ads-etsy-table .ant-table-thead > tr > th {
          background: #f9fafb !important;
          color: #000 !important;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb !important;
        }
        .ads-etsy-table .ant-table-tbody > tr:hover > td {
          background: #f9fafb !important;
        }
        .ads-etsy-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f3f4f6 !important;
        }
        .ads-etsy-table .ant-pagination .ant-pagination-item-active {
          background: #000 !important;
          border-color: #000 !important;
        }
        .ads-etsy-table .ant-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .ads-etsy-table .ant-table-body::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .ads-etsy-table .ant-table-body::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .ads-etsy-table .ant-table-body::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
      </div>
    );
  };

  export default AdsEtsyReport;
