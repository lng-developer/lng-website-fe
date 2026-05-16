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
      const res = await getAllEtsyOrders({ page: 1, perPage: 100000 });
      const list = res?.data?.data || res?.data || [];
      setOrders(Array.isArray(list) ? list : []);
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
      if (s?.employee_id) map.set(String(s.employee_id), s.full_name || '');
    });
    return map;
  }, [sellers]);

  const resolveSellerNamesFromSkus = (skus) => {
    const names = new Set();
    skus.forEach((sku) => {
      if (!sku) return;
      const code = String(sku).slice(0, 5);
      const name = sellerByEmployeeId.get(code);
      if (name) names.add(name);
    });
    return Array.from(names).join(', ');
  };

  const listingInfoMap = useMemo(() => {
    const map = new Map();
    (orders || []).forEach((order) => {
      const seller = order?.seller?.full_name || order?.seller?.name || order?.seller || null;
      (order?.items || []).forEach((item) => {
        const lid = String(item?.listingId || '');
        if (!lid) return;
        const entry = map.get(lid) || { skus: new Set(), sellers: new Set() };
        if (item?.sku) entry.skus.add(item.sku);
        if (seller) entry.sellers.add(typeof seller === 'string' ? seller : JSON.stringify(seller));
        map.set(lid, entry);
      });
    });
    return map;
  }, [orders]);

  const getListingInfo = (listingId) => {
    const entry = listingInfoMap.get(String(listingId));
    if (!entry) return { sku: '', seller: '' };
    const skus = Array.from(entry.skus);
    const sellerFromSku = resolveSellerNamesFromSkus(skus);
    return {
      sku: skus.join(', '),
      seller: sellerFromSku || Array.from(entry.sellers).join(', '),
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
      items.forEach((it) => {
        (it?.rows || []).forEach((r, idx) => {
          const info = getListingInfo(r.listingId);
          rows.push({
            key: `${it._id}-${r.listingId}-${idx}`,
            shopName: it.shopName,
            ...r,
            title: decodeHtml(r.title),
            sku: info.sku,
            seller: info.seller,
          });
        });
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
