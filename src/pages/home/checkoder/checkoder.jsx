import { useEffect, useMemo, useState } from 'react';
import { getAllShop } from '../../../apis/shop';
import { checkOrdersStatus, createShippingBatchFromOrders } from '../../../apis/shippingBatch';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

const getCarrierInfo = (tracking) => {
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

const generateFakeTracking = () => {
    const prefix = '9234';
    let suffix = '';
    for (let i = 0; i < 18; i++) {
        suffix += Math.floor(Math.random() * 10);
    }
    return prefix + suffix;
};

const CheckOder = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterTracking, setFilterTracking] = useState('all');
    const [filterAmazon, setFilterAmazon] = useState('all');
    const [filterAmzDateFrom, setFilterAmzDateFrom] = useState('');
    const [filterAmzDateTo, setFilterAmzDateTo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(20);

    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
    const [showShopModal, setShowShopModal] = useState(true);
    const [tempSelectedShop, setTempSelectedShop] = useState(null);
    const [loadingShops, setLoadingShops] = useState(false);

    const [selectedOrders, setSelectedOrders] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingFake, setExportingFake] = useState(false);

    useEffect(() => {
        getShop();
    }, []);

    useEffect(() => {
        if (selectedShop && !showShopModal) {
            fetchData();
        }
    }, [selectedShop, limit]);

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
            setStats({});
            setSelectedOrders([]);
            setError(null);
            setFilterTracking('all');
            setFilterAmazon('all');
            setFilterAmzDateFrom('');
            setFilterAmzDateTo('');
            setSearchTerm('');
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

            const res = await checkOrdersStatus({
                machineId: selectedShop._id,
                limit
            });

            setOrders(res.data.orders || []);
            setStats(res.data.stats || {});
            setSelectedOrders([]);
        } catch (err) {
            console.error('LỖI:', err);
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
            setOrders([]);
            setStats({});
        } finally {
            setLoading(false);
        }
    };

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

    const getOrderKey = (order) =>
        `${order.orderId || 'no-order-id'}__${order.shopId || 'no-shop-id'}`;

    const isOrderSelected = (order) => {
        return selectedOrders.some(
            (item) => item.orderId === order.orderId && item.shopId === order.shopId
        );
    };

    const handleSelectOrder = (order) => {
        if (!order.orderId || !order.shopId || order.submittedToAmazon) return;

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
            .filter((order) => order.orderId && order.shopId && !order.submittedToAmazon)
            .every((order) =>
                selectedOrders.some(
                    (item) => item.orderId === order.orderId && item.shopId === order.shopId
                )
            );

    const handleSelectAllFiltered = () => {
        const validFilteredOrders = filteredOrders
            .filter((order) => order.orderId && order.shopId && !order.submittedToAmazon)
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

    const handleExportFakeTxt = async () => {
        if (selectedOrders.length === 0) {
            alert('Vui lòng tích chọn ít nhất 1 đơn để fake tracking');
            return;
        }

        try {
            setExportingFake(true);

            const shipDate = formatShipDate(new Date());
            const header = ['order-id', 'ship-date', 'carrier-code', 'tracking-number', 'ship-method'].join('\t');

            const lines = selectedOrders.map((sel) => {
                const fakeTracking = generateFakeTracking();
                const { carrierCode, shipMethod } = getCarrierInfo(fakeTracking);
                return [sel.orderId, shipDate, carrierCode, fakeTracking, shipMethod].join('\t');
            });

            const content = [header, ...lines].join('\n') + '\n';

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const shopName = selectedShop?.name || 'AllShops';
            const filename = `FakeTracking_${shopName}_${timestamp}.txt`;

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, filename);

            alert(`Xuất Fake Tracking thành công: ${selectedOrders.length} đơn hàng`);
        } catch (error) {
            console.error('Export Fake TXT error:', error);
            alert('Có lỗi khi xuất Fake Tracking');
        } finally {
            setExportingFake(false);
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
            await createShippingBatchFromOrders({
                machineId: selectedShop._id,
                orders: selectedOrders,
                label: 'Manual Upload',
                autoUpload: true
            });

            alert(`Đẩy đơn thành công: ${selectedOrders.length} đơn`);

            setOrders((prevOrders) =>
                prevOrders.map((order) => {
                    const isSubmitted = selectedOrders.some(
                        (selected) =>
                            selected.orderId === order.orderId && selected.shopId === order.shopId
                    );
                    return isSubmitted ? { ...order, submittedToAmazon: true } : order;
                })
            );

            setStats((prevStats) => ({
                ...prevStats,
                totalSubmitted: (prevStats.totalSubmitted || 0) + selectedOrders.length,
                totalNotSubmitted: (prevStats.totalNotSubmitted || 0) - selectedOrders.length
            }));

            setSelectedOrders([]);

            const shouldReload = window.confirm(
                'Đẩy đơn thành công! Bạn có muốn tải lại dữ liệu để cập nhật trạng thái mới nhất không?'
            );
            if (shouldReload) fetchData();
        } catch (err) {
            console.error('Push orders error:', err);
            alert(err.response?.data?.message || err.message || 'Có lỗi khi đẩy đơn');
        } finally {
            setSubmitting(false);
        }
    };

    if (error) {
        return (
            <div className="h-screen bg-white flex items-center justify-center p-4">
                <div className="text-neutral-900 text-base font-medium">{error}</div>
            </div>
        );
    }

    if (!selectedShop && !showShopModal) {
        return (
            <div className="h-screen bg-white flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-3xl font-bold">
                        S
                    </div>
                    <div className="text-xl font-bold text-neutral-900 mt-2">
                        Vui lòng chọn shop để xem tracking
                    </div>
                    <div className="text-sm text-neutral-500 mb-2">
                        Bạn cần chọn một shop để bắt đầu theo dõi trạng thái đơn hàng
                    </div>
                    <button
                        onClick={() => setShowShopModal(true)}
                        className="px-6 py-3 rounded-xl bg-neutral-900 !text-white font-semibold hover:bg-neutral-800 hover:!text-white transition-colors"
                    >
                        Chọn shop
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-neutral-50 p-3 box-border">
            {/* Loading Overlay */}
            {loading && selectedShop && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-[2000]">
                    <div className="flex flex-col items-center gap-4 bg-white rounded-2xl px-8 py-7 shadow-xl border border-neutral-200">
                        <div className="w-10 h-10 border-[3px] border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
                        <div className="text-sm font-semibold text-neutral-900">
                            Đang tải dữ liệu đơn hàng...
                        </div>
                    </div>
                </div>
            )}

            {/* Shop Selection Modal */}
            {showShopModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[80vh] overflow-auto shadow-2xl border border-neutral-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-2xl font-bold text-neutral-900 m-0">Chọn Shop</h3>
                            <button
                                onClick={() => setShowShopModal(false)}
                                className="w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors flex items-center justify-center text-lg"
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
                                            onClick={() => setTempSelectedShop(shop)}
                                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-neutral-900 bg-neutral-900 text-white'
                                                    : 'border-neutral-200 bg-white hover:border-neutral-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                                                        isSelected
                                                            ? 'bg-white text-neutral-900'
                                                            : 'bg-neutral-900 text-white'
                                                    }`}
                                                >
                                                    {shop.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-base truncate">
                                                        {shop.name}
                                                    </div>
                                                    <div
                                                        className={`text-xs truncate ${
                                                            isSelected
                                                                ? 'text-neutral-300'
                                                                : 'text-neutral-500'
                                                        }`}
                                                    >
                                                        {shop.store} - {shop.merchant}
                                                    </div>
                                                </div>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        isSelected
                                                            ? 'bg-white/10 text-white'
                                                            : shop.status === 'Active'
                                                            ? 'bg-neutral-900 text-white'
                                                            : 'bg-neutral-200 text-neutral-600'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            shop.status === 'Active'
                                                                ? 'bg-green-400'
                                                                : 'bg-neutral-400'
                                                        }`}
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
                                    className="px-6 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 font-semibold hover:bg-neutral-100 transition-colors"
                                >
                                    Huỷ
                                </button>
                            ) : (
                                <div />
                            )}
                            <button
                                onClick={handleConfirmShop}
                                disabled={!tempSelectedShop || loadingShops}
                                className="px-6 py-3 rounded-xl bg-neutral-900 !text-white font-semibold hover:bg-neutral-800 hover:!text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-full flex flex-col gap-2 overflow-hidden">
                {/* Toolbar: title + stats + shop + limit + reload */}
                <div className="flex items-center gap-3 bg-white border border-neutral-200 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-2 pr-3 border-r border-neutral-200">
                        <div>
                            <h2 className="m-0 text-sm font-bold text-neutral-900 leading-tight">
                                Kiểm tra đơn hàng
                            </h2>
                            <p className="m-0 text-[11px] text-neutral-500 leading-tight">
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
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
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
                            onClick={fetchData}
                            disabled={!selectedShop || loading}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 !text-white font-semibold text-xs hover:bg-neutral-800 hover:!text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? '...' : 'Tải lại'}
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2">
                    <div className="relative flex-1 min-w-0">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm theo Shop Name, Shop ID hoặc Order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs bg-neutral-50 outline-none focus:bg-white focus:border-neutral-900 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Tracking</span>
                            <select
                                value={filterTracking}
                                onChange={(e) => setFilterTracking(e.target.value)}
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
                                value={filterAmazon}
                                onChange={(e) => setFilterAmazon(e.target.value)}
                                disabled={loading}
                                className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50"
                            >
                                <option value="all">Tất cả</option>
                                <option value="yes">Đã submit</option>
                                <option value="no">Chưa submit</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wide">Submit AMZ</span>
                            <input
                                type="date"
                                value={filterAmzDateFrom}
                                onChange={(e) => setFilterAmzDateFrom(e.target.value)}
                                disabled={loading}
                                className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50"
                            />
                            <span className="text-[10px] text-neutral-400">→</span>
                            <input
                                type="date"
                                value={filterAmzDateTo}
                                onChange={(e) => setFilterAmzDateTo(e.target.value)}
                                disabled={loading}
                                className="border-none outline-none bg-transparent text-xs text-neutral-900 font-semibold cursor-pointer disabled:opacity-50"
                            />
                            {(filterAmzDateFrom || filterAmzDateTo) && (
                                <button
                                    onClick={() => {
                                        setFilterAmzDateFrom('');
                                        setFilterAmzDateTo('');
                                    }}
                                    className="text-neutral-400 hover:text-neutral-900 text-xs font-bold px-1"
                                    title="Xoá lọc ngày"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleExportTxt}
                            disabled={exporting || filteredOrders.length === 0 || loading}
                            className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 font-semibold text-xs hover:bg-neutral-100 hover:border-neutral-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {exporting ? '...' : `Xuất TXT (${filteredOrders.filter((o) => o.orderId && o.tracking).length})`}
                        </button>

                        <button
                            onClick={handleExportExcel}
                            disabled={exportingExcel || filteredOrders.length === 0 || loading}
                            className="px-3 py-1.5 rounded-lg border border-green-600 bg-green-600 !text-white font-semibold text-xs hover:bg-green-700 hover:border-green-700 hover:!text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {exportingExcel ? '...' : `Xuất Excel (${filteredOrders.length})`}
                        </button>

                        <button
                            onClick={handleExportFakeTxt}
                            disabled={exportingFake || selectedOrders.length === 0 || loading}
                            className="px-3 py-1.5 rounded-lg border border-amber-500 bg-amber-500 !text-white font-semibold text-xs hover:bg-amber-600 hover:border-amber-600 hover:!text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Tạo file TXT với tracking giả cho các đơn đã chọn"
                        >
                            {exportingFake ? '...' : `Fake Tracking (${selectedOrders.length})`}
                        </button>

                        <button
                            onClick={handlePushOrders}
                            disabled={submitting || selectedOrders.length === 0 || loading}
                            className="px-3 py-1.5 rounded-lg bg-neutral-900 !text-white font-semibold text-xs hover:bg-neutral-800 hover:!text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting ? '...' : `Đẩy đơn (${selectedOrders.length})`}
                        </button>
                    </div>
                </div>

                {/* Table Card */}
                <div className="flex-1 min-h-0 flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-auto">
                        <table className="w-full border-separate border-spacing-0 text-xs">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 z-10 bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wide text-center px-2 py-2 border-b border-neutral-200 w-10">
                                        <input
                                            type="checkbox"
                                            checked={isAllFilteredSelected}
                                            onChange={handleSelectAllFiltered}
                                            disabled={
                                                loading ||
                                                filteredOrders.filter(
                                                    (o) => o.orderId && o.shopId && !o.submittedToAmazon
                                                ).length === 0
                                            }
                                            className="accent-neutral-900 cursor-pointer"
                                        />
                                    </th>
                                    {[
                                        'Order ID',
                                        'Trạng thái',
                                        'Ngày tạo',
                                        'Tracking',
                                        'Mã tracking',
                                        'AMZ',
                                        'Ngày submit AMZ',
                                        'SL',
                                        'Fulfillment',
                                        'Updated At'
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="sticky top-0 z-10 bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-wide text-left px-3 py-2 border-b border-neutral-200 whitespace-nowrap"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="12" className="text-center py-10 text-neutral-500">
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => {
                                        const selected = isOrderSelected(order);
                                        return (
                                            <tr
                                                key={getOrderKey(order)}
                                                className={`transition-colors ${
                                                    selected
                                                        ? 'bg-neutral-100'
                                                        : 'hover:bg-neutral-50'
                                                }`}
                                            >
                                                <td className="px-2 py-2 border-b border-neutral-100 text-center">
                                                    {order.submittedToAmazon ? (
                                                        <span className="text-neutral-300 font-bold">–</span>
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            checked={selected}
                                                            onChange={() => handleSelectOrder(order)}
                                                            disabled={!order.orderId || !order.shopId}
                                                            className="accent-neutral-900 cursor-pointer"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100 text-neutral-900 font-semibold whitespace-nowrap">
                                                    {order.orderId || '-'}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200 whitespace-nowrap">
                                                        {order.status || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100 text-neutral-700 whitespace-nowrap">
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                                                            order.hasTracking
                                                                ? 'bg-neutral-900 text-white'
                                                                : 'bg-white text-neutral-500 border border-neutral-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                order.hasTracking ? 'bg-green-400' : 'bg-neutral-400'
                                                            }`}
                                                        ></span>
                                                        {order.hasTracking ? 'Có' : 'Không'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100 text-neutral-700 font-mono whitespace-nowrap">
                                                    {order.tracking || 'N/A'}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100">
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
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100 text-neutral-700 whitespace-nowrap">
                                                    {order.createAtToAmz
                                                        ? new Date(order.createAtToAmz).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100 text-neutral-900 font-semibold">
                                                    {order.itemsCount || 0}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100 text-neutral-700 whitespace-nowrap">
                                                    {order.trackingInfo?.fulfillment || 'N/A'}
                                                </td>
                                                <td className="px-3 py-2 border-b border-neutral-100 text-neutral-700 whitespace-nowrap">
                                                    {order.trackingInfo?.updated_at
                                                        ? new Date(order.trackingInfo.updated_at).toLocaleString()
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="12" className="text-center py-12 text-neutral-500">
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
                            Hiển thị <strong className="text-neutral-900">{filteredOrders.length}</strong>
                        </span>
                        <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                        <span>
                            Đã chọn <strong className="text-neutral-900">{selectedOrders.length}</strong>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckOder;
