import { useEffect, useMemo, useState } from 'react';
import { getAllShop } from '../../../apis/shop';
import {
    approveTrackingReview,
    checkOrdersStatus,
    createShippingBatchFromOrders,
    downloadAmazonFeedReport,
    getShippingBatches,
    sendShippingBatchUpload
} from '../../../apis/shippingBatch';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import {
    AMAZON_SUBMIT_TABLE_COLUMNS,
    AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS,
    getAmazonSubmitStatus
} from './shippingEligibility';
import {
    buildAmazonFeedProcess,
    formatAmazonFeedTime,
    isAmazonFeedInProgress,
    shouldShowAmazonFeedTimeline
} from './amazonFeedProcess';
import { countActiveAdvancedFilters } from './trackingFilterLayout';

const getCarrierInfo = (tracking, carrier = '') => {
    const carrierName = carrier.toLowerCase();
    if (carrierName.includes('4px')) {
        return { carrierCode: '4PX', shipMethod: '4PX-Global Express' };
    }
    if (carrierName.includes('yanwen')) {
        return { carrierCode: 'Yanwen', shipMethod: 'Yanwen Air Economy Mail General' };
    }
    if (carrierName.includes('yun')) {
        return { carrierCode: 'Yun Express', shipMethod: 'YunExpress Global Direct line (standard )-Tracked' };
    }
    if (carrierName.includes('usps')) {
        return { carrierCode: 'USPS', shipMethod: 'USPS First Class' };
    }
    const t = (tracking || '').toUpperCase();
    if (t.startsWith('4PX')) {
        return { carrierCode: '4PX', shipMethod: '4PX-Global Express' };
    }
    if (t.startsWith('UK') || t.startsWith('UL')) {
        return { carrierCode: 'Yanwen', shipMethod: 'Yanwen Air Economy Mail General' };
    }
    if (t.startsWith('YT')) {
        return {
            carrierCode: 'Yun Express',
            shipMethod: 'YunExpress Global Direct line (standard )-Tracked'
        };
    }
    return { carrierCode: 'USPS', shipMethod: 'USPS First Class' };
};

const formatShipDate = (d) => d.toISOString().replace(/\.\d{3}Z$/, '+00:00');

const getAmazonUsDate = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
};

const addDaysToYmd = (value, days) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};

const getShipByMeta = (shipByDate) => {
    if (!shipByDate) return { label: 'Chưa có', tone: 'neutral' };
    const shipBy = getAmazonUsDate(new Date(shipByDate));
    const today = getAmazonUsDate();
    const label = new Date(shipByDate).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric' });
    if (shipBy < today) return { label: `Quá hạn · ${label}`, tone: 'danger' };
    if (shipBy === today) return { label: `Hôm nay · ${label}`, tone: 'warning' };
    return { label, tone: 'neutral' };
};

const mergeAmazonFeeds = (previous, batches) => {
    const persisted = batches.filter((batch) => batch.amazonFeed?.status);
    const persistedIds = new Set(persisted.map((batch) => String(batch.batchId)));
    const queued = previous.filter((batch) =>
        batch.amazonFeed?.status === 'queued' && !persistedIds.has(String(batch.batchId))
    );
    return [...queued, ...persisted].slice(0, 5);
};

const PAGE_TOKENS = {
    bg: '#f8fafc',
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    muted: '#64748b',
    primary: '#0958d7',
    primaryHover: '#0747a6',
    successText: '#166534',
    successBg: '#dcfce7',
    successBorder: '#86efac',
    warningText: '#92400e',
    warningBg: '#fef3c7',
    warningBorder: '#fcd34d',
    dangerText: '#991b1b',
    dangerBg: '#fee2e2',
    dangerBorder: '#fecaca'
};

const pillStyles = {
    primary: {
        color: '#ffffff',
        backgroundColor: PAGE_TOKENS.primary,
        borderColor: PAGE_TOKENS.primary
    },
    success: {
        color: PAGE_TOKENS.successText,
        backgroundColor: PAGE_TOKENS.successBg,
        borderColor: PAGE_TOKENS.successBorder
    },
    warning: {
        color: PAGE_TOKENS.warningText,
        backgroundColor: PAGE_TOKENS.warningBg,
        borderColor: PAGE_TOKENS.warningBorder
    },
    neutral: {
        color: PAGE_TOKENS.muted,
        backgroundColor: PAGE_TOKENS.surfaceSubtle,
        borderColor: PAGE_TOKENS.border
    }
};

const PAGE_CSS = `
    .check-order-page .bg-white { background-color: ${PAGE_TOKENS.surface}; }
    .check-order-page .bg-neutral-50,
    .check-order-page .bg-neutral-100 { background-color: ${PAGE_TOKENS.surfaceSubtle}; }
    .check-order-page .bg-neutral-200 { background-color: ${PAGE_TOKENS.border}; }
    .check-order-page .bg-neutral-900 { background-color: ${PAGE_TOKENS.primary}; }
    .check-order-page .border-neutral-100,
    .check-order-page .border-neutral-200 { border-color: ${PAGE_TOKENS.border}; }
    .check-order-page .border-neutral-300,
    .check-order-page .border-neutral-400 { border-color: ${PAGE_TOKENS.borderStrong}; }
    .check-order-page .border-neutral-900 { border-color: ${PAGE_TOKENS.primary}; }
    .check-order-page .text-neutral-300,
    .check-order-page .text-neutral-400,
    .check-order-page .text-neutral-500,
    .check-order-page .text-neutral-600,
    .check-order-page .text-neutral-700 { color: ${PAGE_TOKENS.muted}; }
    .check-order-page .text-neutral-800,
    .check-order-page .text-neutral-900 { color: ${PAGE_TOKENS.text}; }
    .check-order-page .hover\\:bg-neutral-50:hover,
    .check-order-page .hover\\:bg-neutral-100:hover { background-color: #eef2ff; }
    .check-order-page .hover\\:bg-neutral-800:hover { background-color: ${PAGE_TOKENS.primaryHover}; }
    .check-order-page .hover\\:border-neutral-400:hover { border-color: ${PAGE_TOKENS.primary}; }
    .check-order-page .hover\\:text-neutral-900:hover { color: ${PAGE_TOKENS.text}; }
    .check-order-page .focus\\:border-neutral-900:focus { border-color: ${PAGE_TOKENS.primary}; }
    .check-order-page .accent-neutral-900 { accent-color: ${PAGE_TOKENS.primary}; }
    .check-order-page th { color: ${PAGE_TOKENS.muted}; letter-spacing: 0; }
    .check-order-page td { color: ${PAGE_TOKENS.muted}; }
    .check-order-page tbody tr:hover { background-color: #eff6ff; }
    .check-order-page button,
    .check-order-page select,
    .check-order-page input { min-height: 32px; }
`;

const CheckOder = () => {
    const [orders, setOrders] = useState([]);
    const [filterOptions, setFilterOptions] = useState({ vendors: [], carriers: [] });
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterTracking, setFilterTracking] = useState('all');
    const [filterAmazon, setFilterAmazon] = useState('all');
    const [filterVendor, setFilterVendor] = useState('');
    const [filterCarrier, setFilterCarrier] = useState('');
    const [filterCarrierHandoff, setFilterCarrierHandoff] = useState('all');
    const [filterShipBy, setFilterShipBy] = useState('all');
    const [filterShipByFrom, setFilterShipByFrom] = useState('');
    const [filterShipByTo, setFilterShipByTo] = useState('');
    const [filterAmzDateFrom, setFilterAmzDateFrom] = useState('');
    const [filterAmzDateTo, setFilterAmzDateTo] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(20);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
    const [showShopModal, setShowShopModal] = useState(true);
    const [tempSelectedShop, setTempSelectedShop] = useState(null);
    const [loadingShops, setLoadingShops] = useState(false);

    const [selectedOrders, setSelectedOrders] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [reviewBatches, setReviewBatches] = useState([]);
    const [amazonFeeds, setAmazonFeeds] = useState([]);
    const [expandedAmazonFeedIds, setExpandedAmazonFeedIds] = useState(() => new Set());
    const [reviewShipDate, setReviewShipDate] = useState(getAmazonUsDate);
    const [confirmedSingleShipment, setConfirmedSingleShipment] = useState(false);
    const [confirmedNoTransparency, setConfirmedNoTransparency] = useState(false);

    useEffect(() => {
        getShop();
    }, []);

    useEffect(() => {
        if (selectedShop && !showShopModal) {
            fetchData();
        }
    }, [selectedShop, limit, page, filterTracking, filterAmazon, filterVendor, filterCarrier, filterCarrierHandoff, filterShipBy, filterShipByFrom, filterShipByTo, searchTerm]);

    const getShop = async () => {
        try {
            setLoadingShops(true);
            const res = await getAllShop();
            setShops(res.data || []);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách shop:', error);
            setError('Không thể tải danh sách shop. Vui lòng thử lại.');
        } finally {
            setLoadingShops(false);
        }
    };

    const handleConfirmShop = () => {
        if (tempSelectedShop) {
            setSelectedShop(tempSelectedShop);
            setShowShopModal(false);
            setOrders([]);
            setAmazonFeeds([]);
            setExpandedAmazonFeedIds(new Set());
            setStats({});
            setSelectedOrders([]);
            setError(null);
            setFilterTracking('all');
            setFilterAmazon('all');
            setFilterVendor('');
            setFilterCarrier('');
            setFilterCarrierHandoff('all');
            setFilterShipBy('all');
            setFilterShipByFrom('');
            setFilterShipByTo('');
            setFilterAmzDateFrom('');
            setFilterAmzDateTo('');
            setShowAdvancedFilters(false);
            setSearchTerm('');
            setPage(1);
        }
    };

    const handleChangeShop = () => {
        setShowShopModal(true);
        setTempSelectedShop(selectedShop);
        setError(null);
    };

    const fetchData = async () => {
        if (!selectedShop) {
            setError('Vui lòng chọn shop.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [res, batchesRes] = await Promise.all([
                checkOrdersStatus({
                machineId: selectedShop._id,
                limit,
                page,
                search: searchTerm.trim(),
                tracking: filterTracking,
                amazon: filterAmazon,
                vendor: filterVendor,
                carrier: filterCarrier,
                carrierHandoff: filterCarrierHandoff,
                shipBy: filterShipBy,
                shipByFrom: filterShipByFrom,
                shipByTo: filterShipByTo
                }),
                getShippingBatches({ machineId: selectedShop._id, limit: 5 })
            ]);

            setOrders(res.data.orders || []);
            setAmazonFeeds((previous) => mergeAmazonFeeds(previous, batchesRes.data?.batches || []));
            setFilterOptions(res.data.filterOptions || { vendors: [], carriers: [] });
            setStats(res.data.stats || {});
            setTotalCount(res.data.totalCount || 0);
            setSelectedOrders([]);
        } catch (err) {
            console.error('LỖI:', err);
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
            setOrders([]);
            setStats({});
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

    const hasAmazonFeedInProgress = amazonFeeds.some((batch) => isAmazonFeedInProgress(batch.amazonFeed));
    const activeAdvancedFilterCount = countActiveAdvancedFilters({
        vendor: filterVendor,
        carrier: filterCarrier,
        submitFrom: filterAmzDateFrom,
        submitTo: filterAmzDateTo
    });

    useEffect(() => {
        if (!selectedShop?._id || !hasAmazonFeedInProgress) return undefined;

        const refreshAmazonFeeds = async () => {
            try {
                const response = await getShippingBatches({ machineId: selectedShop._id, limit: 5 });
                setAmazonFeeds((previous) => mergeAmazonFeeds(previous, response.data?.batches || []));
            } catch (err) {
                console.error('Không thể cập nhật tiến trình Amazon feed:', err);
            }
        };

        const interval = window.setInterval(refreshAmazonFeeds, 15000);
        return () => window.clearInterval(interval);
    }, [hasAmazonFeedInProgress, selectedShop?._id]);

    const filteredOrders = useMemo(() => {
        const fromTs = filterAmzDateFrom ? new Date(filterAmzDateFrom).setHours(0, 0, 0, 0) : null;
        const toTs = filterAmzDateTo ? new Date(filterAmzDateTo).setHours(23, 59, 59, 999) : null;

        return orders.filter((order) => {
            const matchesTracking =
                filterTracking === 'all' ||
                (filterTracking === 'yes' ? order.hasTracking : !order.hasTracking);

            const matchesAmazon =
                filterAmazon === 'all' ||
                (filterAmazon === 'yes' ? order.submittedToAmazon : !order.submittedToAmazon);

            let matchesAmzDate = true;
            if (fromTs !== null || toTs !== null) {
                if (!order.createAtToAmz) {
                    matchesAmzDate = false;
                } else {
                    const ts = new Date(order.createAtToAmz).getTime();
                    if (fromTs !== null && ts < fromTs) matchesAmzDate = false;
                    if (toTs !== null && ts > toTs) matchesAmzDate = false;
                }
            }

            const matchesSearch =
                searchTerm === '' ||
                order.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.shopId?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesTracking && matchesAmazon && matchesAmzDate && matchesSearch;
        });
    }, [orders, filterTracking, filterAmazon, filterAmzDateFrom, filterAmzDateTo, searchTerm]);

    const setShipByPreset = (value) => {
        const today = getAmazonUsDate();
        setFilterShipBy(value);
        if (value === 'today') {
            setFilterShipByFrom(today);
            setFilterShipByTo(today);
        } else if (value === 'overdue') {
            setFilterShipByFrom(today);
            setFilterShipByTo('');
        } else if (value === 'next2') {
            setFilterShipByFrom(addDaysToYmd(today, 1));
            setFilterShipByTo(addDaysToYmd(today, 2));
        } else {
            setFilterShipByFrom('');
            setFilterShipByTo('');
        }
        setPage(1);
    };

    const reviewRows = useMemo(() => reviewBatches.flatMap((batch) =>
        (batch.orders || []).map((order) => {
            const source = orders.find((current) => current.orderId === order.orderId && current.shopId === batch.shopId);
            return { ...order, itemsCount: source?.itemsCount || 0, shipmentItems: source?.shipmentItems || [] };
        })
    ), [reviewBatches, orders]);

    const getOrderKey = (order) =>
        `${order.orderId || 'no-order-id'}__${order.shopId || 'no-shop-id'}`;

    const isOrderSelected = (order) => {
        return selectedOrders.some(
            (item) => item.orderId === order.orderId && item.shopId === order.shopId
        );
    };

    const handleSelectOrder = (order) => {
        if (!order.orderId || !order.shopId || getAmazonSubmitStatus(order).state !== 'ready') return;

        const payload = { orderId: order.orderId, shopId: order.shopId };

        setSelectedOrders((prev) => {
            const exists = prev.some(
                (item) => item.orderId === payload.orderId && item.shopId === payload.shopId
            );
            if (exists) {
                return prev.filter(
                    (item) => !(item.orderId === payload.orderId && item.shopId === payload.shopId)
                );
            }
            return [...prev, payload];
        });
    };

    const isAllFilteredSelected =
        filteredOrders.length > 0 &&
        filteredOrders
            .filter((order) => order.orderId && order.shopId && getAmazonSubmitStatus(order).state === 'ready')
            .every((order) =>
                selectedOrders.some(
                    (item) => item.orderId === order.orderId && item.shopId === order.shopId
                )
            );

    const handleSelectAllFiltered = () => {
        const validFilteredOrders = filteredOrders
            .filter((order) => order.orderId && order.shopId && getAmazonSubmitStatus(order).state === 'ready')
            .map((order) => ({ orderId: order.orderId, shopId: order.shopId }));

        if (isAllFilteredSelected) {
            setSelectedOrders((prev) =>
                prev.filter(
                    (selected) =>
                        !validFilteredOrders.some(
                            (item) =>
                                item.orderId === selected.orderId &&
                                item.shopId === selected.shopId
                        )
                )
            );
        } else {
            setSelectedOrders((prev) => {
                const merged = [...prev];
                validFilteredOrders.forEach((item) => {
                    const exists = merged.some(
                        (x) => x.orderId === item.orderId && x.shopId === item.shopId
                    );
                    if (!exists) merged.push(item);
                });
                return merged;
            });
        }
    };

    const handleExportTxt = async () => {
        const rows = filteredOrders.filter((o) => o.orderId && o.tracking);

        if (rows.length === 0) {
            alert('Không có đơn có tracking để xuất');
            return;
        }

        try {
            setExporting(true);

            const shipDate = formatShipDate(new Date());
            const header = ['order-id', 'ship-date', 'carrier-code', 'tracking-number', 'ship-method'].join('\t');

            const lines = rows.map((o) => {
                const { carrierCode, shipMethod } = getCarrierInfo(o.tracking);
                return [o.orderId, shipDate, carrierCode, o.tracking, shipMethod].join('\t');
            });

            const content = [header, ...lines].join('\n') + '\n';

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const shopName = selectedShop?.name || 'AllShops';
            const filename = `ConfirmShip_${shopName}_${timestamp}.txt`;

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, filename);

            alert(`Xuất TXT thành công: ${rows.length} đơn hàng`);
        } catch (error) {
            console.error('Export TXT error:', error);
            alert('Có lỗi khi xuất TXT');
        } finally {
            setExporting(false);
        }
    };

    const handleExportExcel = async () => {
        if (filteredOrders.length === 0) {
            alert('Không có dữ liệu để xuất');
            return;
        }

        try {
            setExportingExcel(true);

            const columns = [
                { header: 'Order ID', key: 'orderId', width: 22 },
                { header: 'Shop Name', key: 'shopName', width: 18 },
                { header: 'Shop ID', key: 'shopId', width: 26 },
                { header: 'Trạng thái', key: 'status', width: 14 },
                { header: 'Ngày tạo', key: 'createdAt', width: 20 },
                { header: 'Có tracking', key: 'hasTracking', width: 12 },
                { header: 'Mã tracking', key: 'tracking', width: 24 },
                { header: 'Carrier', key: 'carrier', width: 16 },
                { header: 'Đã submit AMZ', key: 'submittedToAmazon', width: 14 },
                { header: 'Ngày submit AMZ', key: 'createAtToAmz', width: 20 },
                { header: 'SL', key: 'itemsCount', width: 6 },
                { header: 'Fulfillment', key: 'fulfillment', width: 14 },
                { header: 'Updated At', key: 'updatedAt', width: 20 }
            ];

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Orders');
            worksheet.columns = columns;

            filteredOrders.forEach((o) => {
                worksheet.addRow({
                    orderId: o.orderId || '',
                    shopName: o.shopName || '',
                    shopId: o.shopId || '',
                    status: o.status || '',
                    createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
                    hasTracking: o.hasTracking ? 'Có' : 'Không',
                    tracking: o.tracking || '',
                    carrier: o.trackingInfo?.carrier || '',
                    submittedToAmazon: o.submittedToAmazon ? 'Có' : 'Không',
                    createAtToAmz: o.createAtToAmz ? new Date(o.createAtToAmz).toLocaleString() : '',
                    itemsCount: o.itemsCount || 0,
                    fulfillment: o.trackingInfo?.fulfillment || '',
                    updatedAt: o.trackingInfo?.updated_at
                        ? new Date(o.trackingInfo.updated_at).toLocaleString()
                        : ''
                });
            });

            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF111827' }
            };
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const shopName = selectedShop?.name || 'AllShops';
            const filename = `Orders_${shopName}_${timestamp}.xlsx`;
            saveAs(blob, filename);

            alert(`Xuất Excel thành công: ${filteredOrders.length} đơn hàng`);
        } catch (error) {
            console.error('Export Excel error:', error);
            alert('Có lỗi khi xuất Excel');
        } finally {
            setExportingExcel(false);
        }
    };

    const handlePushOrders = async () => {
        if (!selectedShop) {
            alert('Vui lòng chọn shop.');
            return;
        }
        if (selectedOrders.length === 0) {
            alert('Vui lòng chọn ít nhất 1 đơn hàng.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await createShippingBatchFromOrders({
                machineId: selectedShop._id,
                orders: selectedOrders,
                label: 'Manual Upload',
                autoUpload: false
            });
            const excludedOrders = (res.data?.batches || []).flatMap((batch) => batch.excludedOrders || []);
            const batches = (res.data?.batches || []).filter((batch) => batch.success && batch.totalReal > 0 && batch.totalFake === 0);
            if (!batches.length) {
                const splitCount = excludedOrders.filter((order) => order.reason === 'SPLIT_SHIPMENT').length;
                alert(splitCount
                    ? `${splitCount} đơn có nhiều tracking (split shipment), không thể gửi bằng bulk TSV.`
                    : 'Không có batch nào đủ điều kiện để review.');
                return;
            }
            if (excludedOrders.length) {
                const splitCount = excludedOrders.filter((order) => order.reason === 'SPLIT_SHIPMENT').length;
                alert(`${excludedOrders.length} đơn bị loại khỏi bulk review${splitCount ? `, gồm ${splitCount} đơn split shipment` : ''}.`);
            }
            setReviewBatches(batches);
            setConfirmedSingleShipment(false);
            setConfirmedNoTransparency(false);
        } catch (err) {
            console.error('Push orders error:', err);
            alert(err.response?.data?.message || err.message || 'Có lỗi khi đẩy đơn');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApproveAndSend = async () => {
        if (!confirmedSingleShipment || !confirmedNoTransparency) return;
        try {
            setSubmitting(true);
            for (const batch of reviewBatches) {
                await approveTrackingReview(batch.batchId, {
                    shipDate: reviewShipDate,
                    confirmedSingleShipment,
                    confirmedNoTransparency
                });
                await sendShippingBatchUpload({
                    batchId: batch.batchId,
                    machineId: selectedShop._id,
                    shopId: batch.shopId
                });
            }
            setAmazonFeeds((previous) => mergeAmazonFeeds(previous, reviewBatches.map((batch) => ({
                ...batch,
                amazonFeed: { status: 'queued' }
            }))));
            setReviewBatches([]);
            setSelectedOrders([]);
            fetchData();
        } catch (err) {
            console.error('Review/send tracking error:', err);
            alert(err.response?.data?.message || err.message || 'Không thể gửi task upload tracking');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadAmazonReport = async (batch) => {
        try {
            const response = await downloadAmazonFeedReport(batch.batchId);
            saveAs(response.data, `amazon-processing-report-${batch.amazonFeed.amazonBatchId || batch.batchId}.txt`);
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể tải Processing Report');
        }
    };

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center p-4" style={{ backgroundColor: PAGE_TOKENS.bg }}>
                <div
                    className="rounded-lg border px-5 py-4 text-sm font-semibold shadow-sm"
                    style={{
                        backgroundColor: PAGE_TOKENS.dangerBg,
                        borderColor: PAGE_TOKENS.dangerBorder,
                        color: PAGE_TOKENS.dangerText
                    }}
                >
                    {error}
                </div>
            </div>
        );
    }

    if (!selectedShop && !showShopModal) {
        return (
            <div className="h-screen flex items-center justify-center p-4" style={{ backgroundColor: PAGE_TOKENS.bg }}>
                <div className="flex flex-col items-center gap-3 text-center">
                    <div
                        className="w-20 h-20 rounded-xl text-white flex items-center justify-center text-3xl font-bold"
                        style={{ backgroundColor: PAGE_TOKENS.primary }}
                    >
                        S
                    </div>
                    <div className="text-xl font-bold mt-2" style={{ color: PAGE_TOKENS.text }}>
                        Vui lòng chọn shop để xem tracking
                    </div>
                    <div className="text-sm mb-2" style={{ color: PAGE_TOKENS.muted }}>
                        Bạn cần chọn một shop để bắt đầu theo dõi trạng thái đơn hàng
                    </div>
                    <button
                        onClick={() => setShowShopModal(true)}
                        className="min-h-11 px-6 py-3 rounded-lg !text-white font-semibold transition-colors"
                        style={{ backgroundColor: PAGE_TOKENS.primary }}
                    >
                        Chọn shop
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="check-order-page h-screen overflow-hidden p-4 box-border" style={{ backgroundColor: PAGE_TOKENS.bg }}>
            <style>{PAGE_CSS}</style>
            {/* Loading Overlay */}
            {loading && selectedShop && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-[2000]">
                    <div
                        className="flex flex-col items-center gap-4 rounded-xl px-8 py-7 shadow-xl border"
                        style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
                    >
                        <div
                            className="w-10 h-10 border-[3px] rounded-full animate-spin"
                            style={{ borderColor: PAGE_TOKENS.border, borderTopColor: PAGE_TOKENS.primary }}
                        ></div>
                        <div className="text-sm font-semibold" style={{ color: PAGE_TOKENS.text }}>
                            Đang tải dữ liệu đơn hàng...
                        </div>
                    </div>
                </div>
            )}

            {/* Shop Selection Modal */}
            {showShopModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div
                        className="rounded-xl p-6 w-full max-w-xl max-h-[80vh] overflow-auto shadow-2xl border"
                        style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-2xl font-bold text-neutral-900 m-0">Chọn Shop</h3>
                            <button
                                aria-label="Close shop selection modal"
                                onClick={() => setShowShopModal(false)}
                                className="w-10 h-10 rounded-lg transition-colors flex items-center justify-center text-lg hover:bg-slate-100"
                                style={{ color: PAGE_TOKENS.muted }}
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-sm text-neutral-500 mb-5">
                            Vui lòng chọn shop để tiếp tục
                        </p>

                        {loadingShops ? (
                            <div className="text-center py-10 text-neutral-500">
                                Đang tải danh sách shop...
                            </div>
                        ) : (
                            <div className="grid gap-2 mb-6 max-h-[400px] overflow-auto pr-1">
                                {shops.map((shop) => {
                                    const isSelected = tempSelectedShop?._id === shop._id;
                                    return (
                                        <div
                                            key={shop._id}
                                            role="button"
                                            tabIndex={0}
                                            aria-pressed={isSelected}
                                            onClick={() => setTempSelectedShop(shop)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setTempSelectedShop(shop);
                                                }
                                            }}
                                            className="border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm"
                                            style={{
                                                backgroundColor: isSelected ? PAGE_TOKENS.primary : PAGE_TOKENS.surface,
                                                borderColor: isSelected ? PAGE_TOKENS.primary : PAGE_TOKENS.border,
                                                color: isSelected ? '#ffffff' : PAGE_TOKENS.text
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                                                    style={{
                                                        backgroundColor: isSelected ? PAGE_TOKENS.surface : PAGE_TOKENS.primary,
                                                        color: isSelected ? PAGE_TOKENS.primary : '#ffffff'
                                                    }}
                                                >
                                                    {shop.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-base truncate">
                                                        {shop.name}
                                                    </div>
                                                    <div
                                                        className="text-xs truncate"
                                                        style={{ color: isSelected ? '#dbeafe' : PAGE_TOKENS.muted }}
                                                    >
                                                        {shop.store} - {shop.merchant}
                                                    </div>
                                                </div>
                                                <span
                                                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                                                    style={
                                                        isSelected
                                                            ? { color: '#ffffff', borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.12)' }
                                                            : shop.status === 'Active'
                                                            ? pillStyles.success
                                                            : pillStyles.neutral
                                                    }
                                                >
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: shop.status === 'Active' ? '#22c55e' : PAGE_TOKENS.muted }}
                                                    ></span>
                                                    {shop.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex justify-between gap-3">
                            {selectedShop ? (
                                <button
                                    onClick={() => setShowShopModal(false)}
                                    aria-label="Cancel shop selection"
                                    className="min-h-11 px-6 py-3 rounded-lg border font-semibold transition-colors hover:bg-slate-50"
                                    style={{
                                        backgroundColor: PAGE_TOKENS.surface,
                                        borderColor: PAGE_TOKENS.border,
                                        color: PAGE_TOKENS.text
                                    }}
                                >
                                    Huỷ
                                </button>
                            ) : (
                                <div />
                            )}
                            <button
                                onClick={handleConfirmShop}
                                aria-label="Confirm selected shop"
                                disabled={!tempSelectedShop || loadingShops}
                                className="min-h-11 px-6 py-3 rounded-lg !text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ backgroundColor: PAGE_TOKENS.primary }}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-full flex flex-col gap-2 overflow-hidden">
                {/* Toolbar: title + stats + shop + limit + reload */}
                <div
                    className="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-sm"
                    style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
                >
                    <div className="flex items-center gap-2 pr-3 border-r" style={{ borderColor: PAGE_TOKENS.border }}>
                        <div>
                            <h2 className="m-0 text-sm font-bold leading-tight" style={{ color: PAGE_TOKENS.text }}>
                                Kiểm tra đơn hàng
                            </h2>
                            <p className="m-0 text-xs leading-tight" style={{ color: PAGE_TOKENS.muted }}>
                                Tracking & hiệu suất
                            </p>
                        </div>
                    </div>

                    {/* Inline stats */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
                        {[
                            { label: 'Tổng', value: stats.totalScanned || 0, dark: true },
                            { label: 'Có tracking', value: stats.totalWithTracking || 0, dot: 'bg-green-500' },
                            { label: 'Không tracking', value: stats.totalWithoutTracking || 0, dot: 'bg-neutral-400' },
                            { label: 'Đã submit', value: stats.totalSubmitted || 0, dot: 'bg-neutral-900' },
                            { label: 'Chưa submit', value: stats.totalNotSubmitted || 0, dot: 'bg-neutral-300' }
                        ].map((s, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border whitespace-nowrap ${
                                    s.dark
                                        ? 'bg-neutral-900 border-neutral-900 text-white'
                                        : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                                }`}
                            >
                                {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>}
                                <span className={`text-[11px] font-semibold ${s.dark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {s.label}
                                </span>
                                <span className="text-sm font-bold">{s.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Shop</span>
                            <span className="text-xs text-neutral-900 font-semibold max-w-[120px] truncate">
                                {selectedShop ? selectedShop.name : 'Chưa chọn'}
                            </span>
                            <button
                                onClick={handleChangeShop}
                                className="border border-neutral-300 rounded px-1.5 py-0.5 bg-white text-neutral-900 text-[10px] font-semibold hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
                            >
                                Đổi
                            </button>
                        </div>

                        <select
                            aria-label="Select order limit"
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-900 font-semibold cursor-pointer outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                        </select>

                        <button
                            aria-label="Reload order status"
                            onClick={fetchData}
                            disabled={!selectedShop || loading}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 !text-white font-semibold text-xs hover:bg-neutral-800 hover:!text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? '...' : 'Tải lại'}
                        </button>
                    </div>
                </div>

                {amazonFeeds.length > 0 && (
                    <section
                        aria-label="Tiến trình gửi Amazon"
                        className="rounded-xl border px-3 py-2"
                        style={{ backgroundColor: PAGE_TOKENS.surface, borderColor: PAGE_TOKENS.border }}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xs font-bold" style={{ color: PAGE_TOKENS.text }}>Amazon feed</h2>
                                <span className="text-[11px]" style={{ color: PAGE_TOKENS.muted }}>5 batch gần nhất</span>
                            </div>
                            {hasAmazonFeedInProgress && (
                                <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{
                                    color: PAGE_TOKENS.primary,
                                    backgroundColor: '#eff6ff',
                                    borderColor: '#bfdbfe'
                                }}>
                                    Đang theo dõi
                                </span>
                            )}
                        </div>

                        <div className="mt-2 grid gap-1.5">
                            {amazonFeeds.map((batch) => {
                                const feed = batch.amazonFeed;
                                const process = buildAmazonFeedProcess(feed);
                                const isExpanded = shouldShowAmazonFeedTimeline(feed, expandedAmazonFeedIds.has(String(batch.batchId)));
                                const tone = process.tone === 'success'
                                    ? { color: PAGE_TOKENS.successText, backgroundColor: PAGE_TOKENS.successBg, borderColor: PAGE_TOKENS.successBorder }
                                    : process.tone === 'warning'
                                        ? { color: PAGE_TOKENS.warningText, backgroundColor: PAGE_TOKENS.warningBg, borderColor: PAGE_TOKENS.warningBorder }
                                        : process.tone === 'danger'
                                            ? { color: PAGE_TOKENS.dangerText, backgroundColor: PAGE_TOKENS.dangerBg, borderColor: PAGE_TOKENS.dangerBorder }
                                            : { color: PAGE_TOKENS.primary, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' };

                                return (
                                    <article key={batch.batchId} className="rounded-lg border px-3 py-2" style={{ borderColor: PAGE_TOKENS.border }}>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-x-3 gap-y-1">
                                                <p className="text-xs font-bold whitespace-nowrap" style={{ color: PAGE_TOKENS.text }}>
                                                    {feed.amazonBatchId ? `Amazon batch ${feed.amazonBatchId}` : `Batch ${String(batch.batchId).slice(-8)}`}
                                                </p>
                                                <p className="text-[11px]" style={{ color: PAGE_TOKENS.muted }}>{process.summary}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="hidden text-[11px] md:inline" style={{ color: PAGE_TOKENS.muted }}>
                                                    {feed.status !== 'queued' ? `${feed.recordsActivated || 0}/${feed.recordsProcessed || 0} xác nhận` : 'Chờ extension'}
                                                </span>
                                                <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={tone}>{process.badge}</span>
                                                {!isAmazonFeedInProgress(feed) && (
                                                    <button
                                                        type="button"
                                                        aria-expanded={isExpanded}
                                                        onClick={() => setExpandedAmazonFeedIds((previous) => {
                                                            const next = new Set(previous);
                                                            const id = String(batch.batchId);
                                                            if (next.has(id)) next.delete(id);
                                                            else next.add(id);
                                                            return next;
                                                        })}
                                                        className="text-[11px] font-semibold underline"
                                                        style={{ color: PAGE_TOKENS.primary }}
                                                    >
                                                        {isExpanded ? 'Thu gọn' : 'Chi tiết'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-2 border-t pt-2" style={{ borderColor: PAGE_TOKENS.border }}>
                                                <div className="overflow-x-auto pb-1">
                                                    <div className="flex min-w-[540px] items-start">
                                                        {process.steps.map((step, index) => {
                                                            const stepTone = step.state === 'complete'
                                                                ? { color: '#ffffff', backgroundColor: PAGE_TOKENS.successText, borderColor: PAGE_TOKENS.successText }
                                                                : step.state === 'active'
                                                                    ? { color: '#ffffff', backgroundColor: PAGE_TOKENS.primary, borderColor: PAGE_TOKENS.primary }
                                                                    : step.state === 'warning'
                                                                        ? { color: PAGE_TOKENS.warningText, backgroundColor: PAGE_TOKENS.warningBg, borderColor: PAGE_TOKENS.warningBorder }
                                                                        : step.state === 'error'
                                                                            ? { color: '#ffffff', backgroundColor: PAGE_TOKENS.dangerText, borderColor: PAGE_TOKENS.dangerText }
                                                                            : { color: PAGE_TOKENS.muted, backgroundColor: PAGE_TOKENS.surfaceSubtle, borderColor: PAGE_TOKENS.borderStrong };
                                                            const marker = step.state === 'complete' ? '✓' : step.state === 'active' ? '…' : step.state === 'warning' ? '!' : step.state === 'error' ? '×' : index + 1;

                                                            return (
                                                                <div className="flex flex-1 items-start last:flex-none" key={step.key}>
                                                                    <div className="min-w-[88px] text-center">
                                                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold" style={stepTone}>{marker}</span>
                                                                        <p className="mt-0.5 text-[10px] font-semibold" style={{ color: step.state === 'pending' ? PAGE_TOKENS.muted : PAGE_TOKENS.text }}>{step.label}</p>
                                                                    </div>
                                                                    {index < process.steps.length - 1 && (
                                                                        <span className="mt-2.5 h-px flex-1" style={{ backgroundColor: step.state === 'complete' ? PAGE_TOKENS.successBorder : PAGE_TOKENS.border }} />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: PAGE_TOKENS.muted }}>
                                                    <span>Đã gửi: {formatAmazonFeedTime(feed.submittedAt)}</span>
                                                    {feed.completedAt && <span>Hoàn tất: {formatAmazonFeedTime(feed.completedAt)}</span>}
                                                    {Number(feed.errorCount) > 0 && <span style={{ color: PAGE_TOKENS.dangerText }}>{feed.errorCount} lỗi</span>}
                                                    {Number(feed.warningCount) > 0 && <span style={{ color: PAGE_TOKENS.warningText }}>{feed.warningCount} cảnh báo</span>}
                                                    {feed.reportText && (
                                                        <button type="button" onClick={() => handleDownloadAmazonReport(batch)} className="font-semibold underline" style={{ color: PAGE_TOKENS.primary }}>
                                                            Tải Processing Report
                                                        </button>
                                                    )}
                                                </div>
                                                {feed.failureReason && (
                                                    <p className="mt-1 text-xs" style={{ color: PAGE_TOKENS.dangerText }}>{feed.failureReason}</p>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Filter Bar */}
                <div className="flex flex-col gap-2 bg-white border border-neutral-200 rounded-xl p-3">
                    <div className="flex flex-nowrap items-center gap-1.5 overflow-visible">
                        <div className="relative w-[260px] shrink-0">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                aria-label="Search orders by shop name, shop ID, or order ID"
                                type="text"
                                placeholder="Tìm theo Shop Name, Shop ID hoặc Order ID..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs bg-neutral-50 outline-none focus:bg-white focus:border-neutral-900 transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Tracking</span>
                            <select
                                aria-label="Filter by tracking availability"
                                value={filterTracking}
                                onChange={(e) => {
                                    setFilterTracking(e.target.value);
                                    setPage(1);
                                }}
                                disabled={loading}
                                className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50"
                            >
                                <option value="all">Tất cả</option>
                                <option value="yes">Có</option>
                                <option value="no">Không</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">AMZ</span>
                            <select
                                aria-label="Filter by Amazon submit status"
                                value={filterAmazon}
                                onChange={(e) => {
                                    setFilterAmazon(e.target.value);
                                    setPage(1);
                                }}
                                disabled={loading}
                                className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50"
                            >
                                <option value="all">Tất cả</option>
                                <option value="yes">Đã submit</option>
                                <option value="no">Chưa submit</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Carrier nhận</span>
                            <select aria-label="Filter by carrier handoff" value={filterCarrierHandoff} onChange={(e) => { setFilterCarrierHandoff(e.target.value); setPage(1); }} disabled={loading} className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50">
                                <option value="all">Tất cả</option>
                                <option value="yes">Đã nhận</option>
                                <option value="no">Chưa nhận</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Ship by</span>
                            <select aria-label="Filter by Amazon ship-by deadline" value={filterShipBy} onChange={(e) => setShipByPreset(e.target.value)} disabled={loading} className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50">
                                <option value="all">Tất cả</option>
                                <option value="overdue">Quá hạn</option>
                                <option value="today">Hôm nay</option>
                                <option value="next2">1–2 ngày tới</option>
                                <option value="missing">Chưa có</option>
                                <option value="range">Khoảng ngày</option>
                            </select>
                            {filterShipBy === 'range' && (
                                <div className="flex items-center gap-1 border-l border-neutral-200 pl-2">
                                    <label className="text-[10px] text-neutral-400 font-semibold" htmlFor="ship-by-from">Từ</label>
                                    <input id="ship-by-from" aria-label="Filter ship-by date from" type="date" value={filterShipByFrom} onChange={(e) => { setFilterShipByFrom(e.target.value); setPage(1); }} disabled={loading} className="w-[120px] rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-900 disabled:opacity-50" />
                                    <label className="text-[10px] text-neutral-400 font-semibold" htmlFor="ship-by-to">Đến</label>
                                    <input id="ship-by-to" aria-label="Filter ship-by date to" type="date" value={filterShipByTo} onChange={(e) => { setFilterShipByTo(e.target.value); setPage(1); }} disabled={loading} className="w-[120px] rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-900 disabled:opacity-50" />
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            aria-expanded={showAdvancedFilters}
                            onClick={() => setShowAdvancedFilters((current) => !current)}
                            className="px-2 py-1 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                        >
                            Bộ lọc nâng cao{activeAdvancedFilterCount ? ` (${activeAdvancedFilterCount})` : ''}
                        </button>
                        <div className="ml-auto flex shrink-0 items-center gap-1.5">
                            {(filterTracking !== 'all' || filterAmazon !== 'all' || filterVendor || filterCarrier || filterCarrierHandoff !== 'all' || filterShipBy !== 'all' || filterShipByFrom || filterShipByTo || filterAmzDateFrom || filterAmzDateTo) && (
                                <button
                                    aria-label="Clear all filters"
                                    onClick={() => {
                                        setFilterTracking('all'); setFilterAmazon('all'); setFilterVendor('');
                                        setFilterCarrier(''); setFilterCarrierHandoff('all');
                                        setFilterShipBy('all'); setFilterShipByFrom(''); setFilterShipByTo('');
                                        setFilterAmzDateFrom(''); setFilterAmzDateTo(''); setPage(1);
                                    }}
                                    className="text-neutral-500 hover:text-neutral-900 text-xs font-semibold px-1"
                                >
                                    Xóa lọc
                                </button>
                            )}
                            <details className="relative shrink-0">
                                <summary className="cursor-pointer list-none rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 [&::-webkit-details-marker]:hidden">
                                    More
                                </summary>
                                <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
                                    <button
                                        aria-label="Export filtered orders to TXT"
                                        onClick={handleExportTxt}
                                        disabled={exporting || filteredOrders.length === 0 || loading}
                                        className="w-full rounded px-2 py-1.5 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {exporting ? 'Đang xuất...' : `Xuất TXT (${filteredOrders.filter((o) => o.orderId && o.tracking).length})`}
                                    </button>
                                    <button
                                        aria-label="Export filtered orders to Excel"
                                        onClick={handleExportExcel}
                                        disabled={exportingExcel || filteredOrders.length === 0 || loading}
                                        className="w-full rounded px-2 py-1.5 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {exportingExcel ? 'Đang xuất...' : `Xuất Excel (${filteredOrders.length})`}
                                    </button>
                                </div>
                            </details>
                            <button
                                aria-label="Review selected orders before sending to Amazon"
                                onClick={handlePushOrders}
                                disabled={submitting || selectedOrders.length === 0 || loading}
                                className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 !text-white font-semibold text-xs hover:bg-blue-700 hover:!text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Đang tạo review...' : `Review & gửi (${selectedOrders.length})`}
                            </button>
                        </div>
                    </div>

                    {showAdvancedFilters && (
                        <div className="flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-2">
                            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Vendor</span>
                                <select aria-label="Filter by fulfillment vendor" value={filterVendor} onChange={(e) => { setFilterVendor(e.target.value); setPage(1); }} disabled={loading} className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50">
                                    <option value="">Tất cả</option>
                                    {filterOptions.vendors.map((vendor) => <option key={vendor} value={vendor}>{vendor}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Carrier</span>
                                <select aria-label="Filter by carrier" value={filterCarrier} onChange={(e) => { setFilterCarrier(e.target.value); setPage(1); }} disabled={loading} className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50">
                                    <option value="">Tất cả</option>
                                    {filterOptions.carriers.map((carrier) => <option key={carrier} value={carrier}>{carrier}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Submit AMZ</span>
                                <div className="flex items-center gap-1 border-l border-neutral-200 pl-2">
                                    <label className="text-[10px] text-neutral-400 font-semibold" htmlFor="submit-amz-from">Từ</label>
                                    <input id="submit-amz-from" aria-label="Filter Amazon submit date from" type="date" value={filterAmzDateFrom} onChange={(e) => setFilterAmzDateFrom(e.target.value)} disabled={loading} className="w-[120px] rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-900 disabled:opacity-50" />
                                    <label className="text-[10px] text-neutral-400 font-semibold" htmlFor="submit-amz-to">Đến</label>
                                    <input id="submit-amz-to" aria-label="Filter Amazon submit date to" type="date" value={filterAmzDateTo} onChange={(e) => setFilterAmzDateTo(e.target.value)} disabled={loading} className="w-[120px] rounded border border-neutral-200 bg-white px-1.5 py-1 text-xs text-neutral-900 outline-none focus:border-neutral-900 disabled:opacity-50" />
                                </div>
                                {(filterAmzDateFrom || filterAmzDateTo) && (
                                    <button aria-label="Clear Amazon submit date filter" onClick={() => { setFilterAmzDateFrom(''); setFilterAmzDateTo(''); }} className="text-neutral-400 hover:text-neutral-900 text-xs font-bold px-1" title="Xoá lọc ngày">✕</button>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Table Card */}
                <div className="flex-1 min-h-0 flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-auto">
                        <table className="min-w-[1480px] w-full table-fixed border-separate border-spacing-0 text-xs">
                            <thead>
                                <tr>
                                    <th className={`sticky top-0 z-10 bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wide text-center px-2 py-2 border-b border-neutral-200 ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[0]}`}>
                                        <div className="flex items-center justify-center gap-1">
                                            <input
                                                aria-label="Select all eligible filtered orders"
                                                type="checkbox"
                                                checked={isAllFilteredSelected}
                                                onChange={handleSelectAllFiltered}
                                                disabled={
                                                    loading ||
                                                    filteredOrders.filter(
                                                        (o) => o.orderId && o.shopId && getAmazonSubmitStatus(o).state === 'ready'
                                                    ).length === 0
                                                }
                                                className="accent-neutral-900 cursor-pointer"
                                            />
                                            <span>{AMAZON_SUBMIT_TABLE_COLUMNS[0]}</span>
                                        </div>
                                    </th>
                                    {AMAZON_SUBMIT_TABLE_COLUMNS.slice(1).map((h, index) => (
                                        <th
                                            key={h}
                                            className={`sticky top-0 z-10 bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wide text-left px-3 py-2 border-b border-neutral-200 whitespace-nowrap ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[index + 1]}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-neutral-500">
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => {
                                        const selected = isOrderSelected(order);
                                        const amazonSubmitStatus = getAmazonSubmitStatus(order);
                                        return (
                                            <tr
                                                key={getOrderKey(order)}
                                                className={`transition-colors ${
                                                    selected
                                                        ? 'bg-neutral-100'
                                                        : 'hover:bg-neutral-50'
                                                }`}
                                            >
                                                <td className={`px-2 py-2 border-b border-neutral-100 text-center align-top ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[0]}`}>
                                                    {amazonSubmitStatus.state !== 'ready' ? (
                                                        <span className={`inline-flex w-full flex-col break-words rounded border px-1.5 py-1 text-left text-[10px] font-semibold leading-tight ${
                                                            amazonSubmitStatus.state === 'submitted'
                                                                ? 'border-neutral-200 bg-neutral-50 text-neutral-600'
                                                                : 'border-amber-200 bg-amber-50 text-amber-800'
                                                        }`}>
                                                            {amazonSubmitStatus.label}
                                                            <span className="mt-0.5 font-normal">{amazonSubmitStatus.detail}</span>
                                                        </span>
                                                    ) : (
                                                        <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                                            <input
                                                                aria-label={`Select order ${order.orderId || ''}`}
                                                                type="checkbox"
                                                                checked={selected}
                                                                onChange={() => handleSelectOrder(order)}
                                                                disabled={!order.orderId || !order.shopId || amazonSubmitStatus.state !== 'ready'}
                                                                className="accent-neutral-900 cursor-pointer"
                                                            />
                                                            Sẵn sàng
                                                        </label>
                                                    )}
                                                </td>
                                                <td className={`px-3 py-2 border-b border-neutral-100 text-neutral-900 font-semibold whitespace-nowrap ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[1]}`}>
                                                    {order.orderId || '-'}
                                                </td>
                                                <td className={`px-3 py-2 border-b border-neutral-100 text-neutral-700 ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[2]}`}>
                                                    {order.trackingInfo?.fulfillment || 'Chưa có vendor'}
                                                </td>
                                                <td className={`px-3 py-2 border-b border-neutral-100 text-neutral-700 ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[3]}`}>
                                                    <div className="break-all font-mono text-neutral-900">{order.tracking || 'Chưa có tracking'}</div>
                                                    <div className="mt-0.5 break-words text-[10px] text-neutral-500">{order.trackingInfo?.carrier || 'Chưa có hãng vận chuyển'}</div>
                                                </td>
                                                <td className={`px-3 py-2 border-b border-neutral-100 text-neutral-700 whitespace-nowrap ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[4]}`}>
                                                    {order.trackingInfo?.actualShipAt
                                                        ? new Date(order.trackingInfo.actualShipAt).toLocaleString()
                                                        : 'N/A'}
                                                </td>
                                                <td className={`px-3 py-2 border-b border-neutral-100 ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[5]}`}>
                                                    {(() => {
                                                        const shipBy = getShipByMeta(order.shipByDate);
                                                        const tone = shipBy.tone === 'danger'
                                                            ? 'bg-red-50 text-red-700 border-red-200'
                                                            : shipBy.tone === 'warning'
                                                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                : 'bg-neutral-50 text-neutral-600 border-neutral-200';
                                                        return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${tone}`}>{shipBy.label}</span>;
                                                    })()}
                                                </td>
                                                <td className={`px-3 py-2 border-b border-neutral-100 ${AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS[6]}`}>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                                                            order.submittedToAmazon
                                                                ? 'bg-neutral-900 text-white'
                                                                : 'bg-white text-neutral-500 border border-neutral-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                order.submittedToAmazon ? 'bg-green-400' : 'bg-neutral-400'
                                                            }`}
                                                        ></span>
                                                        {order.submittedToAmazon ? 'Có' : 'Không'}
                                                    </span>
                                                    <div className="mt-1 text-[10px] text-neutral-500">
                                                        {order.createAtToAmz
                                                            ? new Date(order.createAtToAmz).toLocaleString()
                                                            : 'Chưa gửi'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12 text-neutral-500">
                                            {selectedShop
                                                ? 'Không có dữ liệu phù hợp'
                                                : 'Vui lòng chọn shop để xem dữ liệu'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-3 py-1.5 border-t border-neutral-200 text-[11px] text-neutral-500 flex items-center gap-3 bg-neutral-50">
                        <span>
                            Hiển thị <strong className="text-neutral-900">{filteredOrders.length}</strong> / <strong className="text-neutral-900">{totalCount}</strong>
                        </span>
                        <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                        <span>
                            Đã chọn <strong className="text-neutral-900">{selectedOrders.length}</strong>
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                            <button
                                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                                disabled={loading || page <= 1}
                                className="rounded border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700 disabled:opacity-40"
                            >Trước</button>
                            <span>Trang {page}</span>
                            <button
                                onClick={() => setPage((current) => current + 1)}
                                disabled={loading || page * limit >= totalCount}
                                className="rounded border border-neutral-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700 disabled:opacity-40"
                            >Sau</button>
                        </div>
                    </div>
                </div>
            </div>

            {reviewBatches.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label="Review Shipping Confirmation">
                    <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="text-base font-bold text-slate-900">Review Shipping Confirmation</h2>
                            <p className="mt-1 text-xs text-slate-600" role="status">Chưa có task nào được gửi. Kiểm tra dữ liệu dưới đây trước khi xác nhận.</p>
                        </div>
                        <div className="max-h-[52vh] overflow-auto px-5 py-4">
                            <label className="mb-4 flex max-w-xs flex-col gap-1 text-xs font-semibold text-slate-700">
                                Ship date để gửi Amazon (xác nhận theo ngày giao thực tế)
                                <input type="date" value={reviewShipDate} max={getAmazonUsDate()} onChange={(event) => setReviewShipDate(event.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm" />
                            </label>
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 text-slate-600">
                                    <tr><th className="px-2 py-2">Order ID</th><th className="px-2 py-2">Tracking</th><th className="px-2 py-2">Carrier</th><th className="px-2 py-2">Nhận tracking</th><th className="px-2 py-2">Items</th><th className="px-2 py-2">Amazon fields</th></tr>
                                </thead>
                                <tbody>
                                    {reviewRows.map((order) => {
                                        const carrier = getCarrierInfo(order.tracking, order.carrier);
                                        return <tr key={`${order.orderId}-${order.tracking}`} className="border-b border-slate-100 text-slate-700">
                                            <td className="px-2 py-2 font-mono">{order.orderId}</td>
                                            <td className="px-2 py-2 font-mono">{order.tracking}</td>
                                            <td className="px-2 py-2">{carrier.carrierCode}</td>
                                            <td className="px-2 py-2">{order.shipDate || 'Chưa có thời điểm nhận tracking'}</td>
                                            <td className="px-2 py-2">{order.shipmentItems?.map((item) => `${item.orderItemId || 'missing item id'} × ${item.quantity || 1}`).join(', ') || 'Không có item data'}</td>
                                            <td className="px-2 py-2">Transparency và ship-from: để trống (whole-order)</td>
                                        </tr>;
                                    })}
                                </tbody>
                            </table>
                            <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                <label className="flex items-start gap-2"><input type="checkbox" checked={confirmedSingleShipment} onChange={(event) => setConfirmedSingleShipment(event.target.checked)} className="mt-0.5" />Tôi xác nhận mỗi order trong batch được giao trong một shipment duy nhất. Split shipment cần order-item-id và quantity nên không được gửi bằng flow này.</label>
                                <label className="flex items-start gap-2"><input type="checkbox" checked={confirmedNoTransparency} onChange={(event) => setConfirmedNoTransparency(event.target.checked)} className="mt-0.5" />Tôi xác nhận các sản phẩm này không yêu cầu Transparency code. Nếu có Transparency, dừng flow này và bổ sung code theo order item.</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
                            <button onClick={() => setReviewBatches([])} disabled={submitting} className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Hủy</button>
                            <button onClick={handleApproveAndSend} disabled={submitting || !reviewShipDate || !confirmedSingleShipment || !confirmedNoTransparency} className="rounded bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting ? 'Đang gửi...' : `Xác nhận & gửi ${reviewBatches.reduce((total, batch) => total + batch.totalReal, 0)} đơn`}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckOder;
