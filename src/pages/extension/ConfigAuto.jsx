import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getConfigAutos, updateConfigAuto } from '../../apis/configAuto';
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
    success: '#2f8f14'
};

const TYPE_META = {
    IMPORT_ORDER: { label: 'Import Order', initial: 'IO' },
    PULL_TRACKING: { label: 'Pull Tracking', initial: 'PT' },
    UPLOAD_TRACKING: { label: 'Upload Tracking', initial: 'UT' },
    IMPORT_FBM: { label: 'Import FBM', initial: 'FB' },
    IMPORT_ADS: { label: 'Import Ads', initial: 'AD' }
};

const SHOP_TYPES = ['Amazon', 'Etsy'];

const Toggle = ({ checked, onChange, disabled, label }) => (
    <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        style={{
            width: 44,
            height: 24,
            borderRadius: 999,
            border: 'none',
            padding: 0,
            position: 'relative',
            flexShrink: 0,
            background: checked ? PAGE_TOKENS.primary : PAGE_TOKENS.borderStrong,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'background 0.25s'
        }}
    >
        <span
            style={{
                position: 'absolute',
                top: 2,
                left: 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transform: checked ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.25s'
            }}
        />
    </button>
);

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '-';
    const time = new Date(dateStr).getTime();
    if (Number.isNaN(time)) return '-';
    const diff = Date.now() - time;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins}p trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h trước`;
    const days = Math.floor(hrs / 24);
    return `${days}d trước`;
};

const formatFullTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '-';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const StatusBadge = ({ active }) => (
    <span
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
        style={{
            backgroundColor: active ? `${PAGE_TOKENS.success}14` : PAGE_TOKENS.surfaceMuted,
            borderColor: active ? `${PAGE_TOKENS.success}40` : PAGE_TOKENS.border,
            color: active ? PAGE_TOKENS.success : PAGE_TOKENS.mutedText
        }}
    >
        <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: active ? PAGE_TOKENS.success : PAGE_TOKENS.borderStrong }}
        />
        {active ? 'Running' : 'Paused'}
    </span>
);

const ConfigAuto = () => {
    const { collapsed } = useOutletContext();
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(null);
    const [activeShopType, setActiveShopType] = useState('Amazon');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getConfigAutos();
            setConfigs(res.data?.data || []);
        } catch {
            toast.error('Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const shopTypeStats = useMemo(
        () =>
            SHOP_TYPES.reduce((acc, type) => {
                const typeConfigs = configs.filter((cfg) => cfg.shopType === type);
                acc[type] = {
                    total: typeConfigs.length,
                    active: typeConfigs.filter((cfg) => cfg.status).length
                };
                return acc;
            }, {}),
        [configs]
    );

    const filteredConfigs = useMemo(
        () => configs.filter((cfg) => cfg.shopType === activeShopType),
        [activeShopType, configs]
    );

    const groupedByShop = useMemo(
        () =>
            filteredConfigs.reduce((acc, cfg) => {
                if (!acc[cfg.shopId]) {
                    acc[cfg.shopId] = {
                        shopId: cfg.shopId,
                        shopName: cfg.shopName,
                        shopType: cfg.shopType,
                        items: []
                    };
                }
                acc[cfg.shopId].items.push(cfg);
                return acc;
            }, {}),
        [filteredConfigs]
    );

    const handleToggle = useCallback(async (cfg) => {
        setUpdating(cfg._id);
        try {
            await updateConfigAuto(cfg._id, { status: !cfg.status });
            setConfigs((prev) =>
                prev.map((c) => (c._id === cfg._id ? { ...c, status: !c.status } : c))
            );
            toast.success(
                `${TYPE_META[cfg.type]?.label || cfg.type} đã ${!cfg.status ? 'bật' : 'tắt'}`
            );
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
            setConfigs((prev) =>
                prev.map((c) => (c._id === cfg._id ? { ...c, time: newTime } : c))
            );
            toast.success('Đã cập nhật thời gian');
        } catch {
            toast.error('Cập nhật thất bại');
        } finally {
            setUpdating(null);
        }
    }, []);

    const shops = Object.values(groupedByShop);
    const totalActive = shopTypeStats[activeShopType]?.active || 0;

    return (
        <div className="flex h-screen flex-col overflow-hidden" style={{ backgroundColor: PAGE_TOKENS.background }}>
            {/* Header */}
            <div
                className={`fixed top-0 ${
                    collapsed ? 'left-64' : 'left-13.5'
                } right-0 z-50 border-b transition-all duration-300`}
                style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
            >
                <div className="flex h-[60px] items-center justify-between gap-4 px-4 md:px-8">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{ backgroundColor: PAGE_TOKENS.primary }}
                        >
                            CA
                        </div>
                        <div>
                            <h1 className="m-0 text-lg font-semibold leading-tight md:text-2xl" style={{ color: PAGE_TOKENS.text }}>
                                Cấu hình tự động
                            </h1>
                            <p className="m-0 mt-0.5 hidden text-xs leading-tight sm:block" style={{ color: PAGE_TOKENS.mutedText }}>
                                Quản lý tác vụ tự động theo shop
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center gap-1 rounded-lg border p-1"
                            style={{ backgroundColor: PAGE_TOKENS.surfaceMuted, borderColor: PAGE_TOKENS.border }}
                        >
                            {SHOP_TYPES.map((type) => {
                                const isActive = activeShopType === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setActiveShopType(type)}
                                        className="rounded-md px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0958d7] focus-visible:ring-offset-2"
                                        style={{
                                            backgroundColor: isActive ? PAGE_TOKENS.surface : 'transparent',
                                            boxShadow: isActive ? '0 1px 2px rgb(15 23 42 / 0.08)' : 'none',
                                            color: isActive ? PAGE_TOKENS.text : PAGE_TOKENS.mutedText
                                        }}
                                    >
                                        {type}
                                        <span
                                            className="ml-1 font-semibold"
                                            style={{ color: isActive ? PAGE_TOKENS.mutedText : PAGE_TOKENS.borderStrong }}
                                        >
                                            {shopTypeStats[type]?.total || 0}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 md:flex"
                            style={{ backgroundColor: PAGE_TOKENS.surfaceMuted, borderColor: PAGE_TOKENS.border }}
                        >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PAGE_TOKENS.success }}></span>
                            <span className="text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                {totalActive}
                            </span>
                            <span className="text-xs" style={{ color: PAGE_TOKENS.mutedText }}>đang chạy</span>
                            <span className="mx-1 h-3 w-px" style={{ backgroundColor: PAGE_TOKENS.borderStrong }}></span>
                            <span className="text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                {filteredConfigs.length}
                            </span>
                            <span className="text-xs" style={{ color: PAGE_TOKENS.mutedText }}>tổng</span>
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="rounded-md px-3 py-2 text-xs font-semibold !text-white transition-colors hover:!text-white disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ backgroundColor: PAGE_TOKENS.primary }}
                        >
                            {loading ? 'Đang tải...' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-[60px] md:px-8">
                {loading ? (
                    <div className="py-16 text-center text-sm" style={{ color: PAGE_TOKENS.mutedText }}>
                        Đang tải cấu hình...
                    </div>
                ) : shops.length === 0 ? (
                    <div className="py-16 text-center text-sm" style={{ color: PAGE_TOKENS.mutedText }}>
                        Không có cấu hình nào
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2 xl:grid-cols-3">
                        {shops.map((shop) => {
                            const activeCount = shop.items.filter((i) => i.status).length;
                            const hasActive = activeCount > 0;
                            return (
                                <div
                                    key={shop.shopId}
                                    className="overflow-hidden rounded-lg border transition-colors hover:border-[#0958d7]"
                                    style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
                                >
                                    {/* Shop header */}
                                    <div
                                        className="flex items-center gap-3 border-b px-4 py-3"
                                        style={{ borderColor: PAGE_TOKENS.border }}
                                    >
                                        <div
                                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                                            style={{ backgroundColor: PAGE_TOKENS.primary }}
                                        >
                                            {shop.shopName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate text-sm font-semibold leading-tight" style={{ color: PAGE_TOKENS.text }}>
                                                {shop.shopName}
                                            </div>
                                            <div className="mt-0.5 text-xs leading-tight" style={{ color: PAGE_TOKENS.mutedText }}>
                                                <span className="font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                                    {activeCount}
                                                </span>
                                                /{shop.items.length} tasks
                                            </div>
                                        </div>
                                        <StatusBadge active={hasActive} />
                                    </div>

                                    {/* Task list */}
                                    <div className="divide-y" style={{ borderColor: PAGE_TOKENS.border }}>
                                        {shop.items.map((cfg) => {
                                            const meta = TYPE_META[cfg.type] || {
                                                label: cfg.type,
                                                initial: '-'
                                            };
                                            const isUpdating = updating === cfg._id;
                                            return (
                                                <div
                                                    key={cfg._id}
                                                    className={`flex min-h-[54px] items-center gap-2 px-4 py-2 transition-opacity hover:bg-[#f8fafc] ${
                                                        isUpdating ? 'opacity-60' : ''
                                                    }`}
                                                >
                                                    <span
                                                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold"
                                                        style={{
                                                            backgroundColor: cfg.status ? `${PAGE_TOKENS.primary}12` : PAGE_TOKENS.surfaceMuted,
                                                            borderColor: cfg.status ? `${PAGE_TOKENS.primary}30` : PAGE_TOKENS.border,
                                                            color: cfg.status ? PAGE_TOKENS.primary : PAGE_TOKENS.mutedText
                                                        }}
                                                    >
                                                        {meta.initial}
                                                    </span>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="truncate text-sm font-semibold leading-tight" style={{ color: PAGE_TOKENS.text }}>
                                                            {meta.label}
                                                        </div>
                                                        <div
                                                            className="mt-0.5 flex items-center gap-1 text-xs leading-tight"
                                                            style={{ color: PAGE_TOKENS.mutedText }}
                                                            title={
                                                                cfg.updated_at
                                                                    ? new Date(
                                                                          cfg.updated_at
                                                                      ).toLocaleString('vi-VN')
                                                                    : ''
                                                            }
                                                        >
                                                            <span className="font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                                                {formatFullTime(cfg.updated_at)}
                                                            </span>
                                                            <span style={{ color: PAGE_TOKENS.borderStrong }}>·</span>
                                                            <span>{formatRelativeTime(cfg.updated_at)}</span>
                                                        </div>
                                                    </div>

                                                    <select
                                                        value={cfg.time}
                                                        disabled={isUpdating}
                                                        onChange={(e) =>
                                                            handleTimeChange(
                                                                cfg,
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                        className="h-8 cursor-pointer rounded-md border bg-white px-2 text-xs font-semibold outline-none transition-colors focus:border-[#0958d7] disabled:cursor-not-allowed disabled:opacity-50"
                                                        style={{ borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.text }}
                                                        aria-label={`Chọn chu kỳ chạy ${meta.label}`}
                                                    >
                                                        {[5, 30, 60, 120, 240, 720].map((t) => (
                                                            <option key={t} value={t}>
                                                                {t}p
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <Toggle
                                                        checked={cfg.status}
                                                        onChange={() => handleToggle(cfg)}
                                                        disabled={isUpdating}
                                                        label={`${cfg.status ? 'Tắt' : 'Bật'} ${meta.label}`}
                                                    />
                                                </div>
                                            );
                                        })}
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

export default ConfigAuto;
