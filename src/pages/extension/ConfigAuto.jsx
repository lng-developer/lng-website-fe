import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { createConfigAuto, deleteConfigAuto, getConfigAutos, runConfigAutoNow, updateConfigAuto } from '../../apis/configAuto';
import { getAllShop } from '../../apis/shop';
import { getExtensionTask } from '../../apis/extensionLogs';
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
const SCHEDULABLE_TYPES = ['IMPORT_ORDER', 'IMPORT_ADS'];
const DEFAULT_SCHEDULE_HOURS = '5, 10, 15, 20';
const STABLE_ADS_RULES = [
    { hour: 10, minute: 30, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startDaysAgo: 1, endDaysAgo: 1 },
    { hour: 18, minute: 30, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startDaysAgo: 1, endDaysAgo: 1 },
    { hour: 10, minute: 30, daysOfWeek: [6], startDaysAgo: 7, endDaysAgo: 2 }
];
const cloneStableAdsRules = () => STABLE_ADS_RULES.map((rule) => ({ ...rule, daysOfWeek: [...rule.daysOfWeek] }));
const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const adsTimeValue = (rule) => `${String(rule?.hour ?? 0).padStart(2, '0')}:${String(rule?.minute ?? 0).padStart(2, '0')}`;
const parseAdsTime = (value) => {
    const [hour, minute] = String(value || '').split(':').map(Number);
    return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60 ? { hour, minute } : null;
};
const adsScheduleLabel = (rules = []) => rules.length
    ? rules.map((rule) => `${adsTimeValue(rule)} ${rule.daysOfWeek?.length === 7 ? 'mỗi ngày' : rule.daysOfWeek?.map((day) => WEEKDAY_LABELS[day]).filter(Boolean).join(', ') || 'lịch tùy chọn'} D-${rule.startDaysAgo}${rule.startDaysAgo === rule.endDaysAgo ? '' : ` → D-${rule.endDaysAgo}`}`).join(' · ')
    : 'Lịch giờ cũ';
const EMPTY_ADS_RULE = { hour: 10, minute: 30, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startDaysAgo: 1, endDaysAgo: 1 };
const isValidAdsScheduleRules = (rules) => Array.isArray(rules) && rules.length > 0 && rules.every((rule) => Number.isInteger(rule.hour) && rule.hour >= 0 && rule.hour < 24 && Number.isInteger(rule.minute) && rule.minute >= 0 && rule.minute < 60 && Array.isArray(rule.daysOfWeek) && rule.daysOfWeek.length > 0 && rule.daysOfWeek.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) && Number.isInteger(rule.startDaysAgo) && Number.isInteger(rule.endDaysAgo) && rule.startDaysAgo >= rule.endDaysAgo && rule.startDaysAgo <= 31 && rule.endDaysAgo >= 1);
const AdsScheduleRulesEditor = ({ rules, onChange }) => {
    const updateRule = (index, patch) => onChange(rules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule));
    return <div className="space-y-3">
        <div className="flex items-center justify-between gap-3"><p className="m-0 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>Tự thêm lịch theo nhu cầu. Mỗi dòng là một task độc lập.</p><button type="button" onClick={() => onChange(cloneStableAdsRules())} className="shrink-0 text-xs font-semibold" style={{ color: PAGE_TOKENS.primary }}>Dùng gợi ý ổn định</button></div>
        {rules.map((rule, index) => <fieldset key={index} className="rounded-md border p-3" style={{ borderColor: PAGE_TOKENS.border }}>
            <legend className="px-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>Lịch {index + 1}</legend>
            <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col gap-1 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>Giờ<input type="time" required value={adsTimeValue(rule)} onChange={(event) => { const time = parseAdsTime(event.target.value); if (time) updateRule(index, time); }} className="h-9 rounded-md border bg-white px-2 text-sm" style={{ borderColor: PAGE_TOKENS.border }} /></label>
                <label className="flex flex-col gap-1 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>Từ D-<input type="number" min="1" max="31" required value={rule.startDaysAgo} onChange={(event) => updateRule(index, { startDaysAgo: Number(event.target.value) })} className="h-9 rounded-md border bg-white px-2 text-sm" style={{ borderColor: PAGE_TOKENS.border }} /></label>
                <label className="flex flex-col gap-1 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>Đến D-<input type="number" min="1" max="31" required value={rule.endDaysAgo} onChange={(event) => updateRule(index, { endDaysAgo: Number(event.target.value) })} className="h-9 rounded-md border bg-white px-2 text-sm" style={{ borderColor: PAGE_TOKENS.border }} /></label>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">{WEEKDAY_LABELS.map((label, day) => <label key={label} className="flex items-center gap-1 text-xs" style={{ color: PAGE_TOKENS.text }}><input type="checkbox" checked={rule.daysOfWeek.includes(day)} onChange={(event) => updateRule(index, { daysOfWeek: event.target.checked ? [...rule.daysOfWeek, day].sort((a, b) => a - b) : rule.daysOfWeek.filter((value) => value !== day) })} />{label}</label>)}</div>
            <button type="button" onClick={() => onChange(rules.filter((_, ruleIndex) => ruleIndex !== index))} className="mt-3 text-xs font-semibold text-red-700">Xóa lịch này</button>
        </fieldset>)}
        <button type="button" onClick={() => onChange([...rules, { ...EMPTY_ADS_RULE, daysOfWeek: [...EMPTY_ADS_RULE.daysOfWeek] }])} className="rounded-md border px-3 py-2 text-xs font-semibold" style={{ borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.text }}>+ Thêm lịch</button>
    </div>;
};

const parseScheduleHours = (value) => {
    const hours = String(value || '')
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23);
    return [...new Set(hours)].sort((a, b) => a - b);
};
const yesterdayYmd = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
};

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
    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(d);
};

const taskStatusLabel = (status) => ({
    sent: 'Đã gửi extension',
    received: 'Extension đã nhận',
    completed: '✓ Thành công',
    failed: '✕ Thất bại',
    expired: '✕ Hết hạn chờ extension',
    'no-client': 'Chưa có extension'
}[status] || 'Chưa chạy');

const taskStatusTone = (status) => ({
    completed: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' },
    failed: { backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' },
    expired: { backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' },
    received: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' },
    sent: { backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }
}[status] || { backgroundColor: PAGE_TOKENS.surfaceMuted, borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.mutedText });

const taskTypeLabel = (type) => TYPE_META[type]?.label || ({ IMPORT_ORDERS: 'Import Order', IMPORT_ADS_SPEND: 'Import Ads' }[type] || type || '-');

const formatDuration = (from, to) => {
    const ms = new Date(to).getTime() - new Date(from).getTime();
    if (!from || !to || Number.isNaN(ms) || ms < 0) return '-';
    if (ms < 60000) return `${Math.round(ms / 1000)} giây`;
    return `${Math.floor(ms / 60000)} phút ${Math.round((ms % 60000) / 1000)} giây`;
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
        {active ? 'Đang bật' : 'Đã tắt'}
    </span>
);

const ConfigAuto = () => {
    const { collapsed } = useOutletContext();
    const [configs, setConfigs] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(null);
    const [activeShopType, setActiveShopType] = useState('Amazon');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({ shopId: '', type: 'IMPORT_ORDER', scheduleHours: DEFAULT_SCHEDULE_HOURS, adsStartDaysAgo: 1, adsEndDaysAgo: 1, adsScheduleRules: [], status: false });
    const [editingConfig, setEditingConfig] = useState(null);
    const [editForm, setEditForm] = useState({ scheduleHours: '', adsScheduleRules: [], status: false });
    const [savingEdit, setSavingEdit] = useState(false);
    const [runningConfigId, setRunningConfigId] = useState(null);
    const [manualAdsRun, setManualAdsRun] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [taskDetail, setTaskDetail] = useState(null);
    const [taskDetailLoading, setTaskDetailLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [configRes, shopRes] = await Promise.all([getConfigAutos(), getAllShop()]);
            setConfigs(configRes.data?.data || []);
            const shopRows = Array.isArray(shopRes.data) ? shopRes.data : shopRes.data?.data || [];
            setShops(shopRows.filter((shop) => shop?.status === 'Active'));
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

    const handleCreate = useCallback(async (event) => {
        event.preventDefault();
        const shop = shops.find((item) => String(item._id) === createForm.shopId);
        if (!shop) return toast.error('Vui lòng chọn shop đang hoạt động');
        const scheduleHours = parseScheduleHours(createForm.scheduleHours);
        if (createForm.type !== 'IMPORT_ADS' && !scheduleHours.length) return toast.error('Nhập ít nhất một giờ từ 0 đến 23, cách nhau bằng dấu phẩy');
        if (createForm.type === 'IMPORT_ADS' && !isValidAdsScheduleRules(createForm.adsScheduleRules)) return toast.error('Thêm ít nhất một lịch Ads hợp lệ; D bắt đầu phải cũ hơn hoặc bằng D kết thúc');
        if (configs.some((cfg) => String(cfg.shopId) === createForm.shopId && cfg.type === createForm.type)) {
            return toast.error('Shop này đã có cấu hình cho tác vụ đã chọn');
        }

        try {
            setCreating(true);
            await createConfigAuto({
                shopId: createForm.shopId,
                shopName: shop.name || shop.store,
                shopType: shop.merchant || 'Amazon',
                type: createForm.type,
                scheduleHours: createForm.type === 'IMPORT_ADS' ? [] : scheduleHours,
                time: 60,
                ...(createForm.type === 'IMPORT_ADS' ? { adsStartDaysAgo: 1, adsEndDaysAgo: 1, adsScheduleRules: createForm.adsScheduleRules } : {}),
                status: createForm.status
            });
            toast.success(createForm.status ? 'Đã tạo và bật cấu hình' : 'Đã tạo cấu hình ở trạng thái tắt');
            setShowCreate(false);
            setCreateForm({ shopId: '', type: 'IMPORT_ORDER', scheduleHours: DEFAULT_SCHEDULE_HOURS, adsStartDaysAgo: 1, adsEndDaysAgo: 1, adsScheduleRules: [], status: false });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tạo cấu hình');
        } finally {
            setCreating(false);
        }
    }, [configs, createForm, fetchData, shops]);

    const openEdit = useCallback((cfg) => {
        setEditingConfig(cfg);
        setEditForm({ scheduleHours: (cfg.scheduleHours || []).join(', '), adsScheduleRules: cfg.adsScheduleRules || [], status: cfg.status });
    }, []);

    const handleEdit = useCallback(async (event) => {
        event.preventDefault();
        const scheduleHours = parseScheduleHours(editForm.scheduleHours);
        if (editingConfig.type !== 'IMPORT_ADS' && !scheduleHours.length) return toast.error('Nhập ít nhất một giờ từ 0 đến 23, cách nhau bằng dấu phẩy');
        const adsScheduleRules = editingConfig.type === 'IMPORT_ADS' ? editForm.adsScheduleRules : null;
        if (editingConfig.type === 'IMPORT_ADS' && !isValidAdsScheduleRules(adsScheduleRules)) return toast.error('Thêm ít nhất một lịch Ads hợp lệ; D bắt đầu phải cũ hơn hoặc bằng D kết thúc');
        setSavingEdit(true);
        try {
            const payload = { scheduleHours: editingConfig.type === 'IMPORT_ADS' ? [] : scheduleHours, status: editForm.status, ...(editingConfig.type === 'IMPORT_ADS' ? { adsStartDaysAgo: 1, adsEndDaysAgo: 1, adsScheduleRules } : {}) };
            const response = await updateConfigAuto(editingConfig._id, payload);
            const updated = response.data?.data || { ...editingConfig, ...payload };
            setConfigs((prev) => prev.map((item) => (item._id === editingConfig._id ? updated : item)));
            setEditingConfig(null);
            toast.success('Đã cập nhật cấu hình');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setSavingEdit(false);
        }
    }, [editForm, editingConfig]);

    const handleDelete = useCallback(async (cfg) => {
        const taskName = TYPE_META[cfg.type]?.label || cfg.type;
        if (!window.confirm(`Xóa cấu hình ${taskName} của ${cfg.shopName}? Task chưa chạy sẽ không bị gửi tiếp.`)) return;
        setUpdating(cfg._id);
        try {
            await deleteConfigAuto(cfg._id);
            setConfigs((prev) => prev.filter((item) => item._id !== cfg._id));
            toast.success('Đã xóa cấu hình');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể xóa cấu hình');
        } finally {
            setUpdating(null);
        }
    }, []);

    const openTaskLog = useCallback(async (taskId) => {
        setSelectedTaskId(taskId);
        setTaskDetail(null);
        setTaskDetailLoading(true);
        try {
            const response = await getExtensionTask(taskId);
            setTaskDetail(response.data?.data || null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể tải lịch sử task');
        } finally {
            setTaskDetailLoading(false);
        }
    }, []);

    const handleRunNow = useCallback(async (cfg, range = null) => {
        const taskName = TYPE_META[cfg.type]?.label || cfg.type;
        if (!window.confirm(`Gửi ${taskName}${range ? ` (${range.startDate} → ${range.endDate})` : ''} tới extension của ${cfg.shopName} ngay bây giờ?`)) return;
        setRunningConfigId(cfg._id);
        try {
            const response = await runConfigAutoNow(cfg._id, range || {});
            const task = response.data?.data;
            setConfigs((prev) => prev.map((item) => (item._id === cfg._id ? {
                ...item,
                lastTaskId: task?.taskId,
                lastTaskStatus: 'sent',
                lastTaskError: '',
                lastDispatchedAt: new Date().toISOString()
            } : item)));
            toast.success(`Đã gửi ${taskName} tới extension`);
            if (task?.taskId) openTaskLog(task.taskId);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể gửi task tới extension');
        } finally {
            setRunningConfigId(null);
        }
    }, [openTaskLog]);

    const openRunNow = useCallback((cfg) => {
        if (cfg.type !== 'IMPORT_ADS') return handleRunNow(cfg);
        const day = yesterdayYmd();
        setManualAdsRun({ cfg, startDate: day, endDate: day });
    }, [handleRunNow]);

    useEffect(() => {
        if (!selectedTaskId || !['sent', 'received'].includes(taskDetail?.status)) return undefined;
        const timer = setInterval(async () => {
            try {
                const response = await getExtensionTask(selectedTaskId);
                setTaskDetail(response.data?.data || null);
            } catch {
                // Keep the last known task state; manual refresh remains available.
            }
        }, 2000);
        return () => clearInterval(timer);
    }, [selectedTaskId, taskDetail?.status]);

    const groupedShops = Object.values(groupedByShop);
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
                            <span className="text-xs" style={{ color: PAGE_TOKENS.mutedText }}>cấu hình bật</span>
                            <span className="mx-1 h-3 w-px" style={{ backgroundColor: PAGE_TOKENS.borderStrong }}></span>
                            <span className="text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                {filteredConfigs.length}
                            </span>
                            <span className="text-xs" style={{ color: PAGE_TOKENS.mutedText }}>cấu hình</span>
                        </div>

                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="rounded-md px-3 py-2 text-xs font-semibold !text-white transition-colors hover:!text-white disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ backgroundColor: PAGE_TOKENS.primary }}
                        >
                            {loading ? 'Đang tải...' : 'Refresh'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="rounded-md border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0958d7] focus-visible:ring-offset-2"
                            style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.primary, color: PAGE_TOKENS.primary }}
                        >
                            + Thêm cấu hình
                        </button>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-[60px] md:px-8">
                {loading ? (
                    <div className="py-16 text-center text-sm" style={{ color: PAGE_TOKENS.mutedText }}>
                        Đang tải cấu hình...
                    </div>
                ) : groupedShops.length === 0 ? (
                    <div className="py-16 text-center text-sm" style={{ color: PAGE_TOKENS.mutedText }}>
                        Không có cấu hình nào
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2 xl:grid-cols-3">
                        {groupedShops.map((shop) => {
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
                                                            className="mt-0.5 flex flex-wrap items-center gap-1 text-xs leading-tight"
                                                            style={{ color: PAGE_TOKENS.mutedText }}
                                                            title={
                                                                cfg.nextRunAt
                                                                    ? `Lần chạy tiếp theo: ${new Date(cfg.nextRunAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
                                                                    : ''
                                                            }
                                                        >
                                                            <span style={{ color: PAGE_TOKENS.mutedText }}>Chạy tiếp:</span>
                                                            <span className="font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                                                {cfg.status ? formatFullTime(cfg.nextRunAt) : 'Đã tắt'}
                                                            </span>
                                                            <span style={{ color: PAGE_TOKENS.borderStrong }}>·</span>
                                                            <span>{taskStatusLabel(cfg.lastTaskStatus)}</span>
                                                            {cfg.type === 'IMPORT_ADS' && <>
                                                                <span style={{ color: PAGE_TOKENS.borderStrong }}>·</span>
                                                                <span>{adsScheduleLabel(cfg.adsScheduleRules)}</span>
                                                            </>}
                                                            {cfg.lastDispatchedAt && <>
                                                                <span style={{ color: PAGE_TOKENS.borderStrong }}>·</span>
                                                                <span>Gửi {formatRelativeTime(cfg.lastDispatchedAt)}</span>
                                                            </>}
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => openRunNow(cfg)}
                                                        disabled={isUpdating || runningConfigId === cfg._id}
                                                        className="rounded-md border px-2 py-1 text-xs font-semibold transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        style={{ borderColor: '#86efac', color: '#166534' }}
                                                        aria-label={`Chạy ngay ${meta.label}`}
                                                    >
                                                        {runningConfigId === cfg._id ? 'Đang gửi...' : 'Chạy ngay'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(cfg)}
                                                        disabled={isUpdating}
                                                        className="rounded-md border px-2 py-1 text-xs font-semibold transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        style={{ borderColor: `${PAGE_TOKENS.primary}55`, color: PAGE_TOKENS.primary }}
                                                        aria-label={`Sửa ${meta.label}`}
                                                    >
                                                        Sửa
                                                    </button>
                                                    {cfg.lastTaskId && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openTaskLog(cfg.lastTaskId)}
                                                            className="rounded-md border px-2 py-1 text-xs font-semibold transition-colors hover:bg-slate-100"
                                                            style={{ borderColor: PAGE_TOKENS.borderStrong, color: PAGE_TOKENS.text }}
                                                            aria-label={`Xem log ${meta.label}`}
                                                        >
                                                            Log
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(cfg)}
                                                        disabled={isUpdating}
                                                        className="rounded-md border px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        style={{ borderColor: '#fecaca' }}
                                                        aria-label={`Xóa ${meta.label}`}
                                                    >
                                                        Xóa
                                                    </button>
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
            {showCreate && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-auto-config-title">
                    <form onSubmit={handleCreate} className="w-full max-w-md rounded-xl border p-5 shadow-2xl" style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}>
                        <div className="mb-5">
                            <h2 id="create-auto-config-title" className="m-0 text-lg font-semibold" style={{ color: PAGE_TOKENS.text }}>Thêm cấu hình tự động</h2>
                            <p className="mt-1 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>BE sẽ tạo task theo cấu hình này; extension chỉ nhận và thực thi task.</p>
                        </div>
                        <div className="space-y-4">
                            <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                Shop
                                <select required value={createForm.shopId} onChange={(event) => setCreateForm((current) => ({ ...current, shopId: event.target.value }))} className="h-10 rounded-md border bg-white px-3 text-sm font-normal" style={{ borderColor: PAGE_TOKENS.border }}>
                                    <option value="">Chọn shop</option>
                                    {shops.map((shop) => <option key={shop._id} value={shop._id}>{shop.name || shop.store} · {shop.merchant || 'Amazon'}</option>)}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                Tác vụ
                                <select value={createForm.type} onChange={(event) => setCreateForm((current) => ({ ...current, type: event.target.value }))} className="h-10 rounded-md border bg-white px-3 text-sm font-normal" style={{ borderColor: PAGE_TOKENS.border }}>
                                    {SCHEDULABLE_TYPES.map((type) => <option key={type} value={type}>{TYPE_META[type].label}</option>)}
                                </select>
                            </label>
                            {createForm.type !== 'IMPORT_ADS' && <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                Giờ chạy (giờ Việt Nam, cách nhau bằng dấu phẩy)
                                <input required value={createForm.scheduleHours} onChange={(event) => setCreateForm((current) => ({ ...current, scheduleHours: event.target.value }))} placeholder="5, 10, 15, 20" className="h-10 rounded-md border bg-white px-3 text-sm font-normal" style={{ borderColor: PAGE_TOKENS.border }} />
                            </label>}
                            {createForm.type === 'IMPORT_ADS' && <AdsScheduleRulesEditor rules={createForm.adsScheduleRules} onChange={(adsScheduleRules) => setCreateForm((current) => ({ ...current, adsScheduleRules }))} />}
                            <label className="flex items-center gap-2 text-sm" style={{ color: PAGE_TOKENS.text }}>
                                <input type="checkbox" checked={createForm.status} onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.checked }))} /> Bật ngay sau khi tạo
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" disabled={creating} onClick={() => setShowCreate(false)} className="rounded-md border px-3 py-2 text-xs font-semibold" style={{ borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.text }}>Hủy</button>
                            <button type="submit" disabled={creating || !createForm.shopId || (createForm.type === 'IMPORT_ADS' ? !isValidAdsScheduleRules(createForm.adsScheduleRules) : !parseScheduleHours(createForm.scheduleHours).length)} className="rounded-md px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: PAGE_TOKENS.primary }}>{creating ? 'Đang tạo...' : 'Tạo cấu hình'}</button>
                        </div>
                    </form>
                </div>
            )}
            {editingConfig && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-auto-config-title">
                    <form onSubmit={handleEdit} className="w-full max-w-xl rounded-xl border p-5 shadow-2xl" style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}>
                        <div className="mb-5">
                            <h2 id="edit-auto-config-title" className="m-0 text-lg font-semibold" style={{ color: PAGE_TOKENS.text }}>Sửa cấu hình tự động</h2>
                            <p className="mt-1 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>{editingConfig.shopName} · {TYPE_META[editingConfig.type]?.label || editingConfig.type}</p>
                        </div>
                        <div className="space-y-4">
                            {editingConfig.type !== 'IMPORT_ADS' && <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>
                                Giờ chạy (giờ Việt Nam, cách nhau bằng dấu phẩy)
                                <input autoFocus required value={editForm.scheduleHours} onChange={(event) => setEditForm((current) => ({ ...current, scheduleHours: event.target.value }))} placeholder="5, 10, 15, 20" className="h-10 rounded-md border bg-white px-3 text-sm font-normal" style={{ borderColor: PAGE_TOKENS.border }} />
                            </label>}
                            {editingConfig.type === 'IMPORT_ADS' && <AdsScheduleRulesEditor rules={editForm.adsScheduleRules} onChange={(adsScheduleRules) => setEditForm((current) => ({ ...current, adsScheduleRules }))} />}
                            <label className="flex items-center gap-2 text-sm" style={{ color: PAGE_TOKENS.text }}>
                                <input type="checkbox" checked={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.checked }))} /> Bật cấu hình
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" disabled={savingEdit} onClick={() => setEditingConfig(null)} className="rounded-md border px-3 py-2 text-xs font-semibold" style={{ borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.text }}>Hủy</button>
                            <button type="submit" disabled={savingEdit || (editingConfig.type === 'IMPORT_ADS' ? !isValidAdsScheduleRules(editForm.adsScheduleRules) : !parseScheduleHours(editForm.scheduleHours).length)} className="rounded-md px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: PAGE_TOKENS.primary }}>{savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                        </div>
                    </form>
                </div>
            )}
            {manualAdsRun && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="manual-ads-run-title">
                    <form onSubmit={(event) => { event.preventDefault(); const { cfg, startDate, endDate } = manualAdsRun; if (!startDate || !endDate || startDate > endDate) return toast.error('Chọn khoảng ngày hợp lệ'); setManualAdsRun(null); handleRunNow(cfg, { startDate, endDate }); }} className="w-full max-w-md rounded-xl border p-5 shadow-2xl" style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}>
                        <h2 id="manual-ads-run-title" className="m-0 text-lg font-semibold" style={{ color: PAGE_TOKENS.text }}>Kéo Ads thủ công</h2>
                        <p className="mt-1 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>Chọn dữ liệu cần kéo. Lịch tự động không bị thay đổi.</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>Từ ngày<input type="date" required value={manualAdsRun.startDate} onChange={(event) => setManualAdsRun((current) => ({ ...current, startDate: event.target.value }))} className="h-10 rounded-md border bg-white px-2 text-sm font-normal" style={{ borderColor: PAGE_TOKENS.border }} /></label>
                            <label className="flex flex-col gap-1 text-xs font-semibold" style={{ color: PAGE_TOKENS.text }}>Đến ngày<input type="date" required value={manualAdsRun.endDate} onChange={(event) => setManualAdsRun((current) => ({ ...current, endDate: event.target.value }))} className="h-10 rounded-md border bg-white px-2 text-sm font-normal" style={{ borderColor: PAGE_TOKENS.border }} /></label>
                        </div>
                        <p className="mt-3 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>Tối đa 31 ngày mỗi lần.</p>
                        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setManualAdsRun(null)} className="rounded-md border px-3 py-2 text-xs font-semibold" style={{ borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.text }}>Hủy</button><button type="submit" className="rounded-md px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: PAGE_TOKENS.primary }}>Gửi task</button></div>
                    </form>
                </div>
            )}
            {selectedTaskId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="task-log-title">
                    <div className="w-full max-w-md rounded-xl border p-5 shadow-2xl" style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}>
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 id="task-log-title" className="m-0 text-lg font-semibold" style={{ color: PAGE_TOKENS.text }}>Vòng đời task</h2>
                                <p className="mt-1 break-all text-xs" style={{ color: PAGE_TOKENS.mutedText }}>{selectedTaskId}</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => openTaskLog(selectedTaskId)} className="rounded-md border px-2 py-1 text-xs font-semibold" style={{ borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.text }}>Làm mới</button>
                                <button type="button" onClick={() => setSelectedTaskId(null)} className="rounded-md border px-2 py-1 text-xs font-semibold" style={{ borderColor: PAGE_TOKENS.border, color: PAGE_TOKENS.text }}>Đóng</button>
                            </div>
                        </div>
                        {taskDetailLoading ? (
                            <p className="text-sm" style={{ color: PAGE_TOKENS.mutedText }}>Đang tải...</p>
                        ) : taskDetail ? (
                            <div className="space-y-4 text-sm" style={{ color: PAGE_TOKENS.text }}>
                                <div className="flex items-center justify-between gap-3 rounded-lg border p-3" style={{ borderColor: taskStatusTone(taskDetail.status).borderColor, backgroundColor: taskStatusTone(taskDetail.status).backgroundColor }}>
                                    <div>
                                        <p className="m-0 text-xs font-semibold" style={{ color: PAGE_TOKENS.mutedText }}>TRẠNG THÁI HIỆN TẠI</p>
                                        <p className="mt-1 font-semibold" style={{ color: taskStatusTone(taskDetail.status).color }}>{taskStatusLabel(taskDetail.status)}</p>
                                        {['sent', 'received'].includes(taskDetail.status) && <p className="mt-1 text-xs" style={{ color: PAGE_TOKENS.mutedText }}>Đang tự cập nhật mỗi 2 giây</p>}
                                    </div>
                                    <span className="rounded-full border px-2 py-1 text-xs font-semibold" style={{ ...taskStatusTone(taskDetail.status) }}>{taskTypeLabel(taskDetail.type)}</span>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                                    <div><dt style={{ color: PAGE_TOKENS.mutedText }}>Shop ID</dt><dd className="mt-1 break-all font-medium">{taskDetail.shopId || '-'}</dd></div>
                                    <div><dt style={{ color: PAGE_TOKENS.mutedText }}>Machine ID</dt><dd className="mt-1 break-all font-medium">{taskDetail.machineId || '-'}</dd></div>
                                    <div><dt style={{ color: PAGE_TOKENS.mutedText }}>Tạo task</dt><dd className="mt-1 font-medium">{formatFullTime(taskDetail.createdAt)}</dd></div>
                                    <div><dt style={{ color: PAGE_TOKENS.mutedText }}>Cập nhật gần nhất</dt><dd className="mt-1 font-medium">{formatFullTime(taskDetail.updatedAt)}</dd></div>
                                    <div><dt style={{ color: PAGE_TOKENS.mutedText }}>Số lần gửi lại</dt><dd className="mt-1 font-medium">{taskDetail.resendCount || 0}{taskDetail.lastResentAt ? ` · ${formatFullTime(taskDetail.lastResentAt)}` : ''}</dd></div>
                                    <div><dt style={{ color: PAGE_TOKENS.mutedText }}>Thời gian chạy</dt><dd className="mt-1 font-medium">{formatDuration(taskDetail.sentAt, taskDetail.completedAt)}</dd></div>
                                </dl>
                                <ol className="m-0 space-y-3 border-l-2 pl-4 text-xs" style={{ borderColor: PAGE_TOKENS.border }}>
                                    <li><strong>BE gửi task</strong><span className="block mt-0.5" style={{ color: PAGE_TOKENS.mutedText }}>{formatFullTime(taskDetail.sentAt)}</span></li>
                                    <li><strong>Extension nhận</strong><span className="block mt-0.5" style={{ color: PAGE_TOKENS.mutedText }}>{formatFullTime(taskDetail.ackedAt)}</span></li>
                                    <li><strong>Kết quả</strong><span className="block mt-0.5" style={{ color: PAGE_TOKENS.mutedText }}>{taskDetail.completedAt ? `${taskStatusLabel(taskDetail.status)} · ${formatFullTime(taskDetail.completedAt)}` : 'Đang chờ extension phản hồi'}</span></li>
                                </ol>
                                {taskDetail.type === 'IMPORT_ADS_SPEND' && taskDetail.result?.days?.length > 0 && <div className="rounded-md border p-3 text-xs" style={{ borderColor: PAGE_TOKENS.border, backgroundColor: PAGE_TOKENS.surfaceMuted }}>
                                    <p className="m-0 font-semibold">Kết quả BE đã xử lý</p>
                                    <div className="mt-2 space-y-2">{taskDetail.result.days.map((day) => <div key={day.day} className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span>{day.day || '-'}</span><span>{day.skipped ? day.message || 'Không có spend, không ghi đè dữ liệu cũ' : `${day.importedRows} dòng · ${day.sellersAffected} seller · $${Number(day.shopSpend || 0).toFixed(2)}`}</span></div>)}</div>
                                </div>}
                                {taskDetail.lastError && <p className="m-0 rounded-md bg-red-50 p-3 text-xs text-red-700"><strong>Lỗi extension:</strong> {taskDetail.lastError}</p>}
                            </div>
                        ) : <p className="text-sm" style={{ color: PAGE_TOKENS.mutedText }}>Chưa có dữ liệu task.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigAuto;
