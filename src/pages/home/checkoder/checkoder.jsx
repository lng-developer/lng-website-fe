import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getAllShop } from '../../../apis/shop';

const CheckOder = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterTracking, setFilterTracking] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(20);
    
    // Shop selection states
    const [shops, setShops] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
    const [showShopModal, setShowShopModal] = useState(true);
    const [tempSelectedShop, setTempSelectedShop] = useState(null);
    const [loadingShops, setLoadingShops] = useState(false);

    const [selectedOrders, setSelectedOrders] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getShop();
    }, []);

    useEffect(() => {
        if (selectedShop && !showShopModal) {
            console.log('Selected shop changed, fetching data...');
            fetchData();
        }
    }, [selectedShop, limit]);

    const getShop = async () => {
        try {
            setLoadingShops(true);
            const res = await getAllShop();
            console.log("SHOP RES :", res);
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
            // Reset states khi chọn shop mới
            setOrders([]);
            setStats({});
            setSelectedOrders([]);
            setError(null);
            // Sẽ tự động call fetchData thông qua useEffect
        }
    };

    const handleChangeShop = () => {
        setShowShopModal(true);
        setTempSelectedShop(selectedShop);
        // Reset error khi mở modal chọn shop
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
            
            console.log('Fetching data for shop:', selectedShop.name, 'ID:', selectedShop._id);
            
            const res = await axios.get(
                `https://api.lngmerch.co/api/shipping-batch/check-orders-status?machineId=${encodeURIComponent(
                    selectedShop._id
                )}&limit=${limit}`
            );
            
            console.log("CHECK RES :", res);
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
        return orders.filter((order) => {
            const matchesTracking =
                filterTracking === 'all' ||
                (filterTracking === 'yes' ? order.hasTracking : !order.hasTracking);

            const matchesSearch =
                searchTerm === '' ||
                order.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.shopId?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesTracking && matchesSearch;
        });
    }, [orders, filterTracking, searchTerm]);

    const getOrderKey = (order) =>
        `${order.orderId || 'no-order-id'}__${order.shopId || 'no-shop-id'}`;

    const isOrderSelected = (order) => {
        return selectedOrders.some(
            (item) => item.orderId === order.orderId && item.shopId === order.shopId
        );
    };

    const handleSelectOrder = (order) => {
        if (!order.orderId || !order.shopId || order.submittedToAmazon) return;

        const payload = {
            orderId: order.orderId,
            shopId: order.shopId
        };

        setSelectedOrders((prev) => {
            const exists = prev.some(
                (item) => item.orderId === payload.orderId && item.shopId === payload.shopId
            );

            if (exists) {
                return prev.filter(
                    (item) =>
                        !(item.orderId === payload.orderId && item.shopId === payload.shopId)
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
            .map((order) => ({
                orderId: order.orderId,
                shopId: order.shopId
            }));

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

            const response = await fetch(
                'https://api.lngmerch.co/api    /shipping-batch/create-from-orders',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        machineId: selectedShop._id,
                        orders: selectedOrders,
                        label: 'Manual Upload',
                        autoUpload: true
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Đẩy đơn thất bại');
            }

            alert(`Đẩy đơn thành công: ${selectedOrders.length} đơn`);
            setSelectedOrders([]);
            fetchData();
        } catch (err) {
            console.error('Push orders error:', err);
            alert(err.message || 'Có lỗi khi đẩy đơn');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && selectedShop) {
        return (
            <div style={styles.page}>
                <div style={styles.centerBox}>Đang tải dữ liệu đơn hàng...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.page}>
                <div style={{ ...styles.centerBox, color: '#dc2626' }}>{error}</div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* Shop Selection Modal */}
            {showShopModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Chọn Shop</h3>
                        <p style={styles.modalSubtitle}>Vui lòng chọn shop để tiếp tục</p>
                        
                        {loadingShops ? (
                            <div style={styles.modalLoading}>Đang tải danh sách shop...</div>
                        ) : (
                            <div style={styles.shopList}>
                                {shops.map((shop) => (
                                    <div
                                        key={shop._id}
                                        onClick={() => setTempSelectedShop(shop)}
                                        style={{
                                            ...styles.shopItem,
                                            ...(tempSelectedShop?._id === shop._id ? styles.shopItemSelected : {})
                                        }}
                                    >
                                        <div style={styles.shopInfo}>
                                            <div style={styles.shopName}>{shop.name}</div>
                                            <div style={styles.shopStore}>{shop.store} - {shop.merchant}</div>
                                            <div style={styles.shopStatus}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: shop.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                                    color: shop.status === 'Active' ? '#166534' : '#991b1b'
                                                }}>
                                                    {shop.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div style={styles.modalActions}>
                            <button
                                onClick={handleConfirmShop}
                                disabled={!tempSelectedShop || loadingShops}
                                style={{
                                    ...styles.confirmButton,
                                    opacity: !tempSelectedShop || loadingShops ? 0.6 : 1,
                                    cursor: !tempSelectedShop || loadingShops ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.container}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Kiểm tra trạng thái đơn hàng</h2>
                        <p style={styles.subtitle}>
                            Theo dõi đơn hàng, trạng thái tracking và hiệu suất quét
                        </p>
                    </div>

                    <div style={styles.headerActions}>
                        <div style={styles.limitBox}>
                            <span style={styles.limitLabel}>Shop</span>
                            <span style={styles.shopDisplay}>
                                {selectedShop ? selectedShop.name : 'Chưa chọn'}
                            </span>
                            <button onClick={handleChangeShop} style={styles.changeShopButton}>
                                Đổi
                            </button>
                        </div>

                        <div style={styles.limitBox}>
                            <span style={styles.limitLabel}>Limit</span>
                            <input
                                type="number"
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                min="1"
                                max="1000"
                                style={styles.limitInput}
                            />
                        </div>

                        <button 
                            onClick={fetchData} 
                            disabled={!selectedShop || loading}
                            style={{
                                ...styles.primaryButton,
                                opacity: !selectedShop || loading ? 0.6 : 1,
                                cursor: !selectedShop || loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Đang tải...' : 'Tải lại'}
                        </button>
                    </div>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>Tổng quét</div>
                        <div style={styles.statValue}>{stats.totalScanned || 0}</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>Có tracking</div>
                        <div style={{ ...styles.statValue, color: '#16a34a' }}>
                            {stats.totalWithTracking || 0}
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>Không tracking</div>
                        <div style={{ ...styles.statValue, color: '#dc2626' }}>
                            {stats.totalWithoutTracking || 0}
                        </div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>Đã submit</div>
                        <div style={styles.statValue}>{stats.totalSubmitted || 0}</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>Chưa submit</div>
                        <div style={styles.statValue}>{stats.totalNotSubmitted || 0}</div>
                    </div>
                </div>

                <div style={styles.filterBar}>
                    <input
                        type="text"
                        placeholder="Tìm theo Shop Name, Shop ID hoặc Order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />

                    <div style={styles.filterButtons}>
                        <button
                            onClick={() => setFilterTracking('all')}
                            disabled={loading}
                            style={{
                                ...styles.filterButton,
                                ...(filterTracking === 'all' ? styles.filterButtonActive : {}),
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setFilterTracking('yes')}
                            disabled={loading}
                            style={{
                                ...styles.filterButton,
                                ...(filterTracking === 'yes' ? styles.filterButtonActive : {}),
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Có tracking
                        </button>
                        <button
                            onClick={() => setFilterTracking('no')}
                            disabled={loading}
                            style={{
                                ...styles.filterButton,
                                ...(filterTracking === 'no' ? styles.filterButtonActive : {}),
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Không tracking
                        </button>

                        <button
                            onClick={handlePushOrders}
                            disabled={submitting || selectedOrders.length === 0 || loading}
                            style={{
                                ...styles.pushButton,
                                opacity: submitting || selectedOrders.length === 0 || loading ? 0.6 : 1,
                                cursor:
                                    submitting || selectedOrders.length === 0 || loading
                                        ? 'not-allowed'
                                        : 'pointer'
                            }}
                        >
                            {submitting
                                ? 'Đang đẩy...'
                                : `Đẩy đơn (${selectedOrders.length})`}
                        </button>
                    </div>
                </div>

                <div style={styles.tableCard}>
                    <div style={styles.tableInfo}>
                        <span>
                            Shop: <strong>{selectedShop ? selectedShop.name : '-'}</strong> | Hiển thị{' '}
                            <strong>{filteredOrders.length}</strong> đơn hàng | Đã chọn{' '}
                            <strong>{selectedOrders.length}</strong>
                        </span>
                    </div>

                    <div style={styles.tableScroll}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.thCheckbox}>
                                        <input
                                            type="checkbox"
                                            checked={isAllFilteredSelected}
                                            onChange={handleSelectAllFiltered}
                                            disabled={loading || filteredOrders.filter(order => order.orderId && order.shopId && !order.submittedToAmazon).length === 0}
                                        />
                                    </th>
                                    <th style={styles.th}>Order ID</th>
                                    <th style={styles.th}>Tên Shop</th>
                                    <th style={styles.th}>Shop ID</th>
                                    <th style={styles.th}>Trạng thái</th>
                                    <th style={styles.th}>Ngày tạo</th>
                                    <th style={styles.th}>Tracking</th>
                                    <th style={styles.th}>Mã tracking</th>
                                    <th style={styles.th}>Up to AMZ</th>
                                    <th style={styles.th}>Số lượng</th>
                                    <th style={styles.th}>Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="11" style={styles.emptyCell}>
                                            Đang tải dữ liệu...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <tr key={getOrderKey(order)} style={styles.tr}>
                                            <td style={styles.tdCheckbox}>
                                                {order.submittedToAmazon ? (
                                                    <span style={styles.disabledCheckbox}>-</span>
                                                ) : (
                                                    <input
                                                        type="checkbox"
                                                        checked={isOrderSelected(order)}
                                                        onChange={() => handleSelectOrder(order)}
                                                        disabled={!order.orderId || !order.shopId}
                                                    />
                                                )}
                                            </td>
                                            <td style={styles.tdStrong}>{order.orderId || '-'}</td>
                                            <td style={styles.td}>{order.shopName || '-'}</td>
                                            <td style={styles.td}>{order.shopId || '-'}</td>
                                            <td style={styles.td}>
                                                <span style={styles.statusBadge}>
                                                    {order.status || '-'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {order.createdAt
                                                    ? new Date(order.createdAt).toLocaleString()
                                                    : '-'}
                                            </td>
                                            <td style={styles.td}>
                                                <span
                                                    style={{
                                                        ...styles.trackingBadge,
                                                        backgroundColor: order.hasTracking
                                                            ? '#dcfce7'
                                                            : '#fee2e2',
                                                        color: order.hasTracking
                                                            ? '#166534'
                                                            : '#991b1b'
                                                    }}
                                                >
                                                    {order.hasTracking ? 'Có' : 'Không'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{order.tracking || 'N/A'}</td>
                                            <td style={styles.td}>
                                                <span
                                                    style={{
                                                        ...styles.trackingBadge,
                                                        backgroundColor: order.submittedToAmazon
                                                            ? '#dcfce7'
                                                            : '#fee2e2',
                                                        color: order.submittedToAmazon
                                                            ? '#166534'
                                                            : '#991b1b'
                                                    }}
                                                >
                                                    {order.submittedToAmazon ? 'Có' : 'Không'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{order.itemsCount || 0}</td>
                                            <td style={styles.td}>
                                                ${Number(order.totalAmount || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" style={styles.emptyCell}>
                                            {selectedShop ? 'Không có dữ liệu phù hợp' : 'Vui lòng chọn shop để xem dữ liệu'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: {
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
        padding: '16px',
        boxSizing: 'border-box'
    },
    container: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        background: '#ffffffcc',
        backdropFilter: 'blur(8px)',
        border: '1px solid #e5e7eb',
        borderRadius: '20px',
        padding: '20px 24px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)'
    },
    title: {
        margin: 0,
        fontSize: '28px',
        fontWeight: 700,
        color: '#0f172a'
    },
    subtitle: {
        margin: '6px 0 0',
        fontSize: '14px',
        color: '#64748b'
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
    },
    limitBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '8px 12px'
    },
    limitLabel: {
        fontSize: '14px',
        color: '#334155',
        fontWeight: 600,
        whiteSpace: 'nowrap'
    },
    limitInput: {
        width: '80px',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: '14px',
        color: '#0f172a'
    },
    primaryButton: {
        border: 'none',
        borderRadius: '12px',
        padding: '11px 18px',
        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)'
    },
    pushButton: {
        border: 'none',
        borderRadius: '12px',
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        color: '#fff',
        fontWeight: 700,
        boxShadow: '0 8px 20px rgba(22, 163, 74, 0.25)'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: '8px'
    },
    statCard: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
    },
    statLabel: {
        fontSize: '11px',
        color: '#64748b',
        marginBottom: '4px',
        fontWeight: 500
    },
    statValue: {
        fontSize: '20px',
        fontWeight: 700,
        color: '#0f172a'
    },
    filterBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '18px',
        padding: '14px 16px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        border: '1px solid #dbeafe',
        outline: 'none',
        borderRadius: '12px',
        padding: '12px 14px',
        fontSize: '14px',
        background: '#f8fbff'
    },
    filterButtons: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    filterButton: {
        border: '1px solid #dbeafe',
        background: '#fff',
        color: '#334155',
        borderRadius: '12px',
        padding: '10px 14px',
        fontWeight: 600,
        cursor: 'pointer'
    },
    filterButtonActive: {
        background: '#2563eb',
        color: '#fff',
        border: '1px solid #2563eb'
    },
    tableCard: {
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden'
    },
    tableInfo: {
        padding: '14px 18px',
        borderBottom: '1px solid #f1f5f9',
        color: '#475569',
        fontSize: '14px'
    },
    tableScroll: {
        flex: 1,
        minHeight: 0,
        overflow: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0
    },
    th: {
        position: 'sticky',
        top: 0,
        zIndex: 2,
        background: '#f8fafc',
        color: '#334155',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: 700,
        padding: '14px 16px',
        borderBottom: '1px solid #e2e8f0',
        whiteSpace: 'nowrap'
    },
    thCheckbox: {
        position: 'sticky',
        top: 0,
        zIndex: 2,
        background: '#f8fafc',
        color: '#334155',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 700,
        padding: '14px 12px',
        borderBottom: '1px solid #e2e8f0',
        width: '56px'
    },
    tr: {
        transition: 'all 0.2s ease'
    },
    td: {
        padding: '14px 16px',
        borderBottom: '1px solid #f1f5f9',
        color: '#334155',
        fontSize: '14px',
        verticalAlign: 'top'
    },
    tdStrong: {
        padding: '14px 16px',
        borderBottom: '1px solid #f1f5f9',
        color: '#0f172a',
        fontSize: '14px',
        fontWeight: 700,
        verticalAlign: 'top'
    },
    tdCheckbox: {
        padding: '14px 12px',
        borderBottom: '1px solid #f1f5f9',
        textAlign: 'center',
        verticalAlign: 'top'
    },
    statusBadge: {
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: '999px',
        background: '#eff6ff',
        color: '#1d4ed8',
        fontSize: '12px',
        fontWeight: 700
    },
    trackingBadge: {
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700
    },
    emptyCell: {
        textAlign: 'center',
        padding: '40px 16px',
        color: '#64748b'
    },
    centerBox: {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        color: '#334155'
    },
    // Modal styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modalContent: {
        background: '#fff',
        borderRadius: '20px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
    },
    modalTitle: {
        margin: '0 0 8px 0',
        fontSize: '24px',
        fontWeight: 700,
        color: '#0f172a'
    },
    modalSubtitle: {
        margin: '0 0 20px 0',
        fontSize: '14px',
        color: '#64748b'
    },
    modalLoading: {
        textAlign: 'center',
        padding: '40px',
        color: '#64748b'
    },
    shopList: {
        display: 'grid',
        gap: '12px',
        marginBottom: '24px',
        maxHeight: '400px',
        overflow: 'auto'
    },
    shopItem: {
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: '#fff'
    },
    shopItemSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff'
    },
    shopInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    shopName: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#0f172a'
    },
    shopStore: {
        fontSize: '14px',
        color: '#64748b'
    },
    shopStatus: {
        marginTop: '4px'
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
    },
    confirmButton: {
        border: 'none',
        borderRadius: '12px',
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)'
    },
    shopDisplay: {
        fontSize: '14px',
        color: '#0f172a',
        fontWeight: 600,
        minWidth: '120px'
    },
    changeShopButton: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '4px 8px',
        background: '#fff',
        color: '#334155',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer'
    },
    disabledCheckbox: {
        color: '#9ca3af',
        fontSize: '14px',
        fontWeight: 600
    }
};

export default CheckOder;