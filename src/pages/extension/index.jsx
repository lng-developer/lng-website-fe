import { useState, useEffect, useMemo } from 'react';
import { ThunderboltOutlined, SearchOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { TbDatabaseImport } from 'react-icons/tb';
import { DatePicker, Spin, Input } from 'antd';
import { getAllClient, pullAll, requestExtension } from '../../apis/socketio';
import { toast } from 'sonner';
import useSocketIO from '../../hooks/useSocketIO';
import { getAllShop } from '../../apis/shop';

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
  'maybe-online': { label: 'Maybe Online', color: PAGE_TOKENS.warning },
  offline: { label: 'Offline', color: PAGE_TOKENS.danger },
  unknown: { label: 'Unknown', color: PAGE_TOKENS.mutedText },
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.unknown;

const RealtimeBadge = ({ connected, error }) => {
  const color = connected ? PAGE_TOKENS.success : PAGE_TOKENS.danger;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
      style={{ backgroundColor: PAGE_TOKENS.surfaceMuted, borderColor: PAGE_TOKENS.border }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-medium" style={{ color: PAGE_TOKENS.text }}>
        {connected ? 'Real-time Connected' : 'Disconnected'}
      </span>
      {error && (
        <span className="max-w-[220px] truncate text-xs" style={{ color: PAGE_TOKENS.danger }}>
          ({error})
        </span>
      )}
    </div>
  );
};

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
  const [shopId, setShopId] = useState(null);
  const [search, setSearch] = useState('');
  const [dateInputs, setDateInputs] = useState({});
  const [loadingOrder, setLoadingOrder] = useState({});
  const [loadingAds, setLoadingAds] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);

  useEffect(() => {
    const fetchShopId = async () => {
      try {
        const res = await getAllShop();
        if (res.status === 200) {
          const shops = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
          if (shops.length > 0) setShopId(shops[0]._id ?? shops[0].id);
        }
      } catch (err) {
        console.log('fetchShopId error:', err);
      }
    };
    fetchShopId();
  }, []);

  const { socket, connected, error: socketError } = useSocketIO('https://api.lngmerch.co', {
    auth: {
      token: localStorage.getItem('accessToken')?.replace(/^"|"$/g, ''),
      shopId,
    }
  });

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

  const formatDateToUI = (time) => {
    const ts = Number(time);
    if (!Number.isFinite(ts)) return '-';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '-';
    return `${d.toLocaleTimeString('vi-VN')} ${d.toLocaleDateString('vi-VN')}`;
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
    if (!socket || !connected) return;

    const handleClientStatusUpdate = (data) => {
      setClients(prev => prev.map(client => (
        client.clientId === data.clientId ? { ...client, ...data } : client
      )));
    };

    const handleClientConnected = (data) => {
      toast.success(`${data.label} connected`);
      fetchAllClients();
    };

    const handleClientDisconnected = (data) => {
      toast.info(`${data.label} disconnected`);
      setClients(prev => prev.map(client => (
        client.clientId === data.clientId ? { ...client, status: 'offline' } : client
      )));
    };

    socket.on('client:status-update', handleClientStatusUpdate);
    socket.on('client:connected', handleClientConnected);
    socket.on('client:disconnected', handleClientDisconnected);

    return () => {
      socket.off('client:status-update', handleClientStatusUpdate);
      socket.off('client:connected', handleClientConnected);
      socket.off('client:disconnected', handleClientDisconnected);
    };
  }, [socket, connected]);

  useEffect(() => {
    const interval = setInterval(fetchAllClients, 15000);
    return () => clearInterval(interval);
  }, []);

  const statusStats = useMemo(
    () => ({
      total: clients.length,
      online: clients.filter(c => c.status === 'online').length,
      maybe: clients.filter(c => c.status === 'maybe-online').length,
      offline: clients.filter(c => c.status === 'offline').length,
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

          <RealtimeBadge connected={connected} error={socketError} />
        </div>
      </div>

      <div className="mt-[60px] px-4 py-4 md:px-8">
        {/* Stat cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Clients" value={statusStats.total} color={PAGE_TOKENS.primary} />
          <StatCard label="Online" value={statusStats.online} color={PAGE_TOKENS.success} />
          <StatCard label="Maybe Online" value={statusStats.maybe} color={PAGE_TOKENS.warning} />
          <StatCard label="Offline" value={statusStats.offline} color={PAGE_TOKENS.danger} />
        </div>

        {/* Toolbar */}
        <div
          className="mb-4 flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
          style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
        >
          <div className="flex items-center gap-3">
            <h2 className="!mb-0 text-lg font-semibold" style={{ color: PAGE_TOKENS.text }}>Clients</h2>
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
              disabled={loadingAll}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Uptime</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Connected</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: PAGE_TOKENS.border }}>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm" style={{ color: PAGE_TOKENS.mutedText }}>
                      {clients.length === 0 ? 'No clients connected' : 'No clients match your search'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const isOrderLoading = !!loadingOrder[client.clientId];
                    const isAdsLoading = !!loadingAds[client.clientId];
                    const uptime = client.statusSummary
                      ? (client.status === 'online'
                          ? `${Math.floor(client.statusSummary.onlineForSec / 60)}m online`
                          : `${Math.floor(client.statusSummary.idleForSec / 60)}m idle`)
                      : '-';
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
                          <span className="text-xs tabular-nums" style={{ color: PAGE_TOKENS.mutedText }}>{uptime}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="whitespace-nowrap text-xs tabular-nums" style={{ color: PAGE_TOKENS.mutedText }}>
                            {formatDateToUI(client.connectedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => handleImportOrder(client)}
                              disabled={isOrderLoading}
                              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border bg-white px-3 text-xs font-semibold transition-colors hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ borderColor: PAGE_TOKENS.borderStrong, color: PAGE_TOKENS.text }}
                              title="Import Orders"
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
                              placeholder="Pick date"
                              aria-label={`Pick ads spend date for ${client.label || client.shopName}`}
                            />

                            <button
                              onClick={() => handleImportAdsSpend(client)}
                              disabled={isAdsLoading}
                              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-semibold !text-white transition-colors hover:!text-white disabled:cursor-not-allowed disabled:opacity-50"
                              style={{ backgroundColor: PAGE_TOKENS.primary }}
                              title="Import Ads Spend"
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
