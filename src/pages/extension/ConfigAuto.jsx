import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getConfigAutos, updateConfigAuto } from '../../apis/configAuto';
import { toast } from 'sonner';

const TYPE_META = {
    IMPORT_ORDER: { label: 'Import Order', initial: 'IO' },
    PULL_TRACKING: { label: 'Pull Tracking', initial: 'PT' },
    UPLOAD_TRACKING: { label: 'Upload Tracking', initial: 'UT' },
    IMPORT_FBM: { label: 'Import FBM', initial: 'FB' },
    IMPORT_ADS: { label: 'Import Ads', initial: 'AD' }
};

const Toggle = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        style={{
            width: 40,
            height: 22,
            borderRadius: 999,
            border: 'none',
            padding: 0,
            position: 'relative',
            flexShrink: 0,
            background: checked ? '#0a0a0a' : '#d4d4d4',
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
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transform: checked ? 'translateX(18px)' : 'translateX(0)',
                transition: 'transform 0.25s'
            }}
        />
    </button>
);

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins}p trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h trước`;
    const days = Math.floor(hrs / 24);
    return `${days}d trước`;
};

const formatFullTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ConfigAuto = () => {
    const { collapsed } = useOutletContext();
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

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
        if (!acc[cfg.shopId]) {
            acc[cfg.shopId] = { shopId: cfg.shopId, shopName: cfg.shopName, items: [] };
        }
        acc[cfg.shopId].items.push(cfg);
        return acc;
    }, {});

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
    const totalActive = configs.filter((c) => c.status).length;

    return (
        <div className="h-screen flex flex-col bg-neutral-100 overflow-hidden">
            {/* Header */}
            <div
                className={`fixed top-0 ${
                    collapsed ? 'left-64' : 'left-13.5'
                } right-0 z-50 bg-white border-b border-neutral-200 transition-all duration-300`}
            >
                <div className="h-14 px-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                            CA
                        </div>
                        <div>
                            <h1 className="m-0 text-[15px] font-bold text-neutral-900 leading-tight">
                                Cấu hình tự động
                            </h1>
                            <p className="m-0 text-[11px] text-neutral-500 leading-tight mt-0.5">
                                Quản lý tác vụ tự động theo shop
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span className="text-[11px] font-semibold text-neutral-900">
                                {totalActive}
                            </span>
                            <span className="text-[11px] text-neutral-500">đang chạy</span>
                            <span className="w-px h-3 bg-neutral-300 mx-1"></span>
                            <span className="text-[11px] font-semibold text-neutral-900">
                                {configs.length}
                            </span>
                            <span className="text-[11px] text-neutral-500">tổng</span>
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 !text-white font-semibold text-xs hover:bg-neutral-800 hover:!text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 pt-14 px-4 pb-4 overflow-auto">
                {loading ? (
                    <div className="text-center py-16 text-neutral-500 text-sm">
                        Đang tải cấu hình...
                    </div>
                ) : shops.length === 0 ? (
                    <div className="text-center py-16 text-neutral-500 text-sm">
                        Không có cấu hình nào
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-3">
                        {shops.map((shop) => {
                            const activeCount = shop.items.filter((i) => i.status).length;
                            const hasActive = activeCount > 0;
                            return (
                                <div
                                    key={shop.shopId}
                                    className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-neutral-900 transition-colors"
                                >
                                    {/* Shop header */}
                                    <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
                                        <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                            {shop.shopName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-neutral-900 truncate leading-tight">
                                                {shop.shopName}
                                            </div>
                                            <div className="text-[11px] text-neutral-500 mt-0.5 leading-tight">
                                                <span className="font-semibold text-neutral-900">
                                                    {activeCount}
                                                </span>
                                                /{shop.items.length} tác vụ
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                hasActive
                                                    ? 'bg-neutral-900 text-white'
                                                    : 'bg-neutral-100 text-neutral-500'
                                            }`}
                                        >
                                            <span
                                                className={`w-1 h-1 rounded-full ${
                                                    hasActive ? 'bg-green-400' : 'bg-neutral-400'
                                                }`}
                                            />
                                            {hasActive ? 'ON' : 'OFF'}
                                        </span>
                                    </div>

                                    {/* Task list */}
                                    <div className="divide-y divide-neutral-100">
                                        {shop.items.map((cfg) => {
                                            const meta = TYPE_META[cfg.type] || {
                                                label: cfg.type,
                                                initial: '·'
                                            };
                                            const isUpdating = updating === cfg._id;
                                            return (
                                                <div
                                                    key={cfg._id}
                                                    className={`flex items-center gap-2 px-4 py-2 transition-opacity hover:bg-neutral-50 ${
                                                        isUpdating ? 'opacity-60' : ''
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold flex-shrink-0 ${
                                                            cfg.status
                                                                ? 'bg-neutral-900 text-white'
                                                                : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                                                        }`}
                                                    >
                                                        {meta.initial}
                                                    </span>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-xs text-neutral-900 leading-tight truncate">
                                                            {meta.label}
                                                        </div>
                                                        <div
                                                            className="text-[10px] text-neutral-400 leading-tight mt-0.5 flex items-center gap-1"
                                                            title={
                                                                cfg.updated_at
                                                                    ? new Date(
                                                                          cfg.updated_at
                                                                      ).toLocaleString('vi-VN')
                                                                    : ''
                                                            }
                                                        >
                                                            <span className="font-semibold text-neutral-600">
                                                                {formatFullTime(cfg.updated_at)}
                                                            </span>
                                                            <span className="text-neutral-300">·</span>
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
                                                        className="border border-neutral-200 rounded-lg px-2 py-1 text-[11px] text-neutral-900 bg-white font-semibold cursor-pointer outline-none focus:border-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
