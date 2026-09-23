import { useState, useEffect, useMemo } from 'react';
import { ThunderboltOutlined, SearchOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { TbDatabaseImport } from 'react-icons/tb';
import { DatePicker, Spin, Input } from 'antd';
import { getAllClient, pullAll, requestExtension } from '../../apis/socketio';
import { toast } from 'sonner';

const PAGE_TOKENS = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: '#0f172a',
  mutedText: '#64748b',
  primary: '#0958d7',
  primaryHover: '#0747a6',
  success: '#2f8f14',
  warning: '#d46a08',
  danger: '#cd1323',
};

const STATUS_META = {
  online: { label: 'Online', color: PAGE_TOKENS.success },
  offline: { label: 'Offline', color: PAGE_TOKENS.danger },
  'never-connected': { label: 'Chưa kết nối', color: PAGE_TOKENS.mutedText },
  unknown: { label: 'Không rõ', color: PAGE_TOKENS.mutedText },
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.unknown;

const StatusBadge = ({ status }) => {
  const meta = getStatusMeta(status);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: `${meta.color}14`,
        borderColor: `${meta.color}40`,
        color: meta.color,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
};

const ExtensionManager = () => {
  const { collapsed } = useOutletContext();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [dateInputs, setDateInputs] = useState({});
  const [loadingOrder, setLoadingOrder] = useState({});
  const [loadingAds, setLoadingAds] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);

  const handleImportOrder = async (client) => {
    setLoadingOrder(prev => ({ ...prev, [client.clientId]: true }));
    try {
      const response = await requestExtension({
        shopId: client?.shopId,
        machineId: client?.machineId,
        type: 'IMPORT_ORDERS',
        action: 'click',
        label: client?.label,
        payload: {},
      });
      if (response.status === 200) {
        toast.success(`Imported orders for ${client.label}`);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingOrder(prev => ({ ...prev, [client.clientId]: false }));
    }
  };

  const handleImportAdsSpend = async (client) => {
    const date = dateInputs[client.clientId];
    if (!date) {
      toast.error('Please select a date first');
      return;
    }
    setLoadingAds(prev => ({ ...prev, [client.clientId]: true }));
    try {
      const response = await requestExtension({
        shopId: client?.shopId,
        machineId: client?.machineId,
        type: 'IMPORT_ADS_SPEND',
        action: 'click',
        label: client?.label,
        payload: { date },
      });
      if (response.status === 200) {
        toast.success(`Imported ads spend for ${client.label}`);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingAds(prev => ({ ...prev, [client.clientId]: false }));
    }
  };

  const handleImportAllOrder = async () => {
    setLoadingAll(true);
    try {
      const response = await pullAll({
        type: 'PULL_ALL',
        action: 'click',
        payload: {},
      });
      if (response.status === 200) {
        toast.success('Import order request sent to all clients');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingAll(false);
    }
  };

  const formatDateToUI = (time, empty = 'Chưa từng') => {
    if (!time) return empty;
    const d = new Date(time);
    if (Number.isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(d);
  };

  const formatSession = (client) => {
    if (client.status !== 'online') return client.status === 'offline' ? 'Đã ngắt kết nối' : 'Chưa có extension';
    if (!client.connectedAt) return 'Đang kết nối';
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(client.connectedAt).getTime()) / 60000));
    return minutes < 60 ? `${minutes} phút` : `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
  };

  const fetchAllClients = async () => {
    try {
      const response = await getAllClient();
      if (response.status === 200) {
        const data = response.data;
        const list = Array.isArray(data) ? data : (Array.isArray(data?.clients) ? data.clients : (Array.isArray(data?.data) ? data.data : []));
        setClients(list);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllClients();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchAllClients, 15000);
    return () => clearInterval(interval);
  }, []);

  const statusStats = useMemo(
    () => ({
      total: clients.length,
      online: clients.filter(c => c.status === 'online').length,
      offline: clients.filter(c => c.status === 'offline').length,
      neverConnected: clients.filter(c => c.status === 'never-connected').length,
    }),
    [clients]
  );

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      `${c.label} ${c.shopName}`.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_TOKENS.background }}>
      {/* Header */}
      <div
        className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 border-b transition-all duration-300`}
        style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
      >
        <div className="flex h-[60px] items-center justify-between gap-4 px-4 md:px-8">
          <h1 className="!mb-0 text-2xl font-semibold" style={{ color: PAGE_TOKENS.text }}>
            Manage Clients
          </h1>

          <span className="text-xs" style={{ color: PAGE_TOKENS.mutedText }}>Cập nhật trạng thái mỗi 15 giây</span>
        </div>
      </div>

      <div className="mt-[60px] px-4 py-4 md:px-8">
        {/* Stat cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Shops" value={statusStats.total} color={PAGE_TOKENS.primary} />
          <StatCard label="Online" value={statusStats.online} color={PAGE_TOKENS.success} />
          <StatCard label="Offline" value={statusStats.offline} color={PAGE_TOKENS.danger} />
          <StatCard label="Chưa kết nối" value={statusStats.neverConnected} color={PAGE_TOKENS.mutedText} />
        </div>

        {/* Toolbar */}
        <div
          className="mb-4 flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
          style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
        >
          <div className="flex items-center gap-3">
            <h2 className="!mb-0 text-lg font-semibold" style={{ color: PAGE_TOKENS.text }}>Shops</h2>
            <span className="text-xs" style={{ color: PAGE_TOKENS.mutedText }}>
              {filteredClients.length} of {clients.length}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              prefix={<SearchOutlined style={{ color: PAGE_TOKENS.mutedText }} />}
              placeholder="Search by label or shop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!h-10 !w-full sm:!w-72"
              allowClear
              aria-label="Search clients by label or shop"
            />
            <button
              onClick={handleImportAllOrder}
              disabled={loadingAll || statusStats.online === 0}
              className="flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-5 text-sm font-semibold !text-white transition-colors hover:!text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: PAGE_TOKENS.primary }}
            >
              {loadingAll ? <Spin size="small" /> : <ThunderboltOutlined />}
              Import All
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-hidden rounded-lg border"
          style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: PAGE_TOKENS.surfaceMuted, color: PAGE_TOKENS.mutedText }}>
                <tr>
                  <th className="w-10 px-4 py-3 text-left text-xs font-semibold uppercase"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Shop</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Phiên hiện tại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Lần thấy gần nhất</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PAGE_TOKENS.border }}>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm" style={{ color: PAGE_TOKENS.mutedText }}>
                      {clients.length === 0 ? 'Không có shop đang hoạt động' : 'Không có shop khớp tìm kiếm'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const isOrderLoading = !!loadingOrder[client.clientId];
                    const isAdsLoading = !!loadingAds[client.clientId];
                    const canRequest = client.status === 'online' && !!client.machineId;
                    const statusMeta = getStatusMeta(client.status);

                    return (
                      <tr
                        key={client.clientId}
                        className="transition-colors hover:bg-[#f8fafc]"
                      >
                        <td className="px-4 py-4">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusMeta.color }}></div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold" style={{ color: PAGE_TOKENS.text }}>{client.shopName}</div>
                          <div className="mt-0.5 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>{client.label}</div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={client.status} />
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs tabular-nums" style={{ color: PAGE_TOKENS.mutedText }}>{formatSession(client)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="whitespace-nowrap text-xs tabular-nums" style={{ color: PAGE_TOKENS.mutedText }}>
                            {formatDateToUI(client.lastSeen)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => handleImportOrder(client)}
                              disabled={isOrderLoading || !canRequest}
                              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border bg-white px-3 text-xs font-semibold transition-colors hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ borderColor: PAGE_TOKENS.borderStrong, color: PAGE_TOKENS.text }}
                              title={canRequest ? 'Import Orders' : 'Chỉ gửi được khi extension online'}
                              aria-label={`Import orders for ${client.label || client.shopName}`}
                            >
                              {isOrderLoading ? <Spin size="small" /> : <TbDatabaseImport size={14} />}
                              <span>Order</span>
                            </button>

                            <DatePicker
                              size="small"
                              onChange={(_, dateString) =>
                                setDateInputs(prev => ({ ...prev, [client.clientId]: dateString }))
                              }
                              className="!w-32"
                              disabled={!canRequest}
                              placeholder="Pick date"
                              aria-label={`Pick ads spend date for ${client.label || client.shopName}`}
                            />

                            <button
                              onClick={() => handleImportAdsSpend(client)}
                              disabled={isAdsLoading || !canRequest}
                              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-semibold !text-white transition-colors hover:!text-white disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ backgroundColor: PAGE_TOKENS.primary }}
                              title={canRequest ? 'Import Ads Spend' : 'Chỉ gửi được khi extension online'}
                              aria-label={`Import ads spend for ${client.label || client.shopName}`}
                            >
                              {isAdsLoading ? <Spin size="small" /> : <TbDatabaseImport size={14} />}
                              <span>Ads</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div
    className="flex items-center justify-between rounded-lg border px-4 py-3"
    style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
  >
    <div>
      <div className="text-[11px] font-semibold uppercase" style={{ color: PAGE_TOKENS.mutedText }}>{label}</div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums" style={{ color: PAGE_TOKENS.text }}>{value}</div>
    </div>
    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }}></div>
  </div>
);

export default ExtensionManager;
