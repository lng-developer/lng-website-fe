import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getConfigAutos, updateConfigAuto } from '../../apis/configAuto';
import { toast } from 'sonner';

const TYPE_META = {
  IMPORT_ORDER:    { label: 'Import Order',    icon: '📥', color: '#3b82f6', bg: '#eff6ff' },
  PULL_TRACKING:   { label: 'Pull Tracking',   icon: '🔄', color: '#8b5cf6', bg: '#f5f3ff' },
  UPLOAD_TRACKING: { label: 'Upload Tracking', icon: '📤', color: '#10b981', bg: '#ecfdf5' },
  IMPORT_FBM:      { label: 'Import FBM',      icon: '📦', color: '#f59e0b', bg: '#fffbeb' },
  IMPORT_ADS:      { label: 'Import Ads',      icon: '📊', color: '#ef4444', bg: '#fef2f2' },
};

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    style={{
      width: 44, height: 24, borderRadius: 999, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative', padding: 0, flexShrink: 0,
      background: checked ? '#22c55e' : '#cbd5e1',
      transition: 'background 0.25s',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <div style={{
      position: 'absolute', top: 2,
      width: 20, height: 20, borderRadius: '50%',
      background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      transition: 'transform 0.25s',
      transform: checked ? 'translateX(22px)' : 'translateX(2px)',
    }} />
  </button>
);

const ConfigAuto = () => {
  const { collapsed } = useOutletContext();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getConfigAutos();
      setConfigs(res.data?.data || []);
    } catch {
      toast.error('Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const groupedByShop = configs.reduce((acc, cfg) => {
    if (!acc[cfg.shopId]) acc[cfg.shopId] = { shopId: cfg.shopId, shopName: cfg.shopName, items: [] };
    acc[cfg.shopId].items.push(cfg);
    return acc;
  }, {});

  const handleToggle = useCallback(async (cfg) => {
    setUpdating(cfg._id);
    try {
      await updateConfigAuto(cfg._id, { status: !cfg.status });
      setConfigs(prev => prev.map(c => c._id === cfg._id ? { ...c, status: !c.status } : c));
      toast.success(`${TYPE_META[cfg.type]?.label || cfg.type} đã ${!cfg.status ? 'bật' : 'tắt'}`);
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setUpdating(null);
    }
  }, []);

  const handleTimeChange = useCallback(async (cfg, newTime) => {
    setUpdating(cfg._id);
    try {
      await updateConfigAuto(cfg._id, { time: newTime });
      setConfigs(prev => prev.map(c => c._id === cfg._id ? { ...c, time: newTime } : c));
      toast.success('Đã cập nhật thời gian');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setUpdating(null);
    }
  }, []);

  const shops = Object.values(groupedByShop);
  const totalActive = configs.filter(c => c.status).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white border-b border-gray-100 transition-all duration-300`}
        style={{ boxShadow: '0 1px 8px rgba(15,23,42,0.06)' }}>
        <div className="h-[60px] px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚙️</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Cấu hình tự động</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{totalActive} tác vụ đang chạy · {configs.length} tổng cộng</p>
            </div>
          </div>
          <button onClick={fetchData} disabled={loading} style={S.refreshBtn}>
            <span style={{ fontSize: 14 }}>{loading ? '⏳' : '🔄'}</span>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 60, padding: '24px 32px' }}>
        {loading ? (
          <div style={S.empty}>Đang tải cấu hình...</div>
        ) : shops.length === 0 ? (
          <div style={S.empty}>Không có cấu hình nào</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {shops.map(shop => {
              const activeCount = shop.items.filter(i => i.status).length;
              return (
                <div key={shop.shopId} style={S.card}>
                  {/* Shop title row */}
                  <div style={S.cardHeader}>
                    <div style={S.avatar}>{shop.shopName?.charAt(0)?.toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{shop.shopName}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
                        {activeCount}/{shop.items.length} tác vụ đang bật
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: activeCount > 0 ? '#dcfce7' : '#f1f5f9',
                      color: activeCount > 0 ? '#16a34a' : '#64748b',
                    }}>
                      {activeCount > 0 ? '● Active' : '○ Inactive'}
                    </span>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={S.table}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={S.th}>Tác vụ</th>
                          <th style={S.th}>Mô tả</th>
                          <th style={{ ...S.th, textAlign: 'center' }}>Chu kỳ</th>
                          <th style={{ ...S.th, textAlign: 'center' }}>Cập nhật lần cuối</th>
                          <th style={{ ...S.th, textAlign: 'center' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shop.items.map((cfg, idx) => {
                          const meta = TYPE_META[cfg.type] || { label: cfg.type, icon: '⚙️', color: '#64748b', bg: '#f8fafc' };
                          const isUpdating = updating === cfg._id;
                          return (
                            <tr key={cfg._id} style={{
                              background: idx % 2 === 0 ? '#fff' : '#fafafa',
                              opacity: isUpdating ? 0.6 : 1,
                              transition: 'opacity 0.2s',
                            }}>
                              {/* Type */}
                              <td style={S.td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 32, height: 32, borderRadius: 8,
                                    background: meta.bg, fontSize: 16,
                                  }}>{meta.icon}</span>
                                  <span style={{ fontWeight: 600, fontSize: 13, color: meta.color }}>{meta.label}</span>
                                </div>
                              </td>

                              {/* Describe */}
                              <td style={{ ...S.td, color: '#64748b', fontSize: 13 }}>{cfg.describe || '—'}</td>

                              {/* Time */}
                              <td style={{ ...S.td, textAlign: 'center' }}>
                                <select
                                  value={cfg.time}
                                  disabled={isUpdating}
                                  onChange={(e) => handleTimeChange(cfg, Number(e.target.value))}
                                  style={S.select}
                                >
                                  {[5, 60, 120, 240, 720].map(t => (
                                    <option key={t} value={t}>{t} phút</option>
                                  ))}
                                </select>
                              </td>

                              {/* Updated at */}
                              <td style={{ ...S.td, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                                {cfg.updated_at ? new Date(cfg.updated_at).toLocaleString('vi-VN') : '—'}
                              </td>

                              {/* Toggle */}
                              <td style={{ ...S.td, textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 11, color: cfg.status ? '#16a34a' : '#94a3b8', fontWeight: 600, minWidth: 28 }}>
                                    {cfg.status ? 'ON' : 'OFF'}
                                  </span>
                                  <Toggle
                                    checked={cfg.status}
                                    onChange={() => handleToggle(cfg)}
                                    disabled={isUpdating}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const S = {
  card: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    background: 'linear-gradient(135deg,#f8fafc,#eef2ff)',
  },
  avatar: {
    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16,
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 20px', fontSize: 12, fontWeight: 700,
    color: '#64748b', textAlign: 'left',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 20px',
    borderBottom: '1px solid #f8fafc',
    verticalAlign: 'middle',
  },
  select: {
    border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '5px 10px', fontSize: 12,
    color: '#334155', background: '#fff',
    cursor: 'pointer', outline: 'none',
  },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '8px 16px', background: '#fff',
    color: '#334155', fontWeight: 600,
    cursor: 'pointer', fontSize: 13,
  },
  empty: {
    textAlign: 'center', padding: 80,
    color: '#94a3b8', fontSize: 15,
  },
};

export default ConfigAuto;
