/**
 * EtsyOrderCost.jsx
 * ─────────────────────────────────────────────────────────────
 * Trang hiển thị chi phí từng đơn hàng Etsy.
 * UI layer thuần túy – toàn bộ logic nằm trong useEtsyOrderCost.
 * ─────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Descriptions, Image, Input, Modal, Pagination, Table, Tooltip, Tag, Select } from 'antd';
import { FaBox, FaDollarSign, FaUser, FaRedo, FaPercentage, FaEtsy } from 'react-icons/fa';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { BiSolidFileExport } from 'react-icons/bi';
import { MdOutlineRefresh } from 'react-icons/md';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import DateRangePicker from '../../../components/DateRangePicker';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import { useEtsyOrderCost } from './hooks/useEtsyOrderCost';
import { getEtsyOrderCostDetails } from './etsyOrderCostMapper';

const num = (v) => (Number.isFinite(+v) ? +v : 0);
const fmtMoney = (v) => {
  const n = num(v);
  return n >= 0 ? `$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`;
};
const fmtNum = (n) =>
  typeof n === 'number'
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n;
const TABLE_BOTTOM_SAFE_AREA = 64;

// ── Status badge ─────────────────────────────────────────────
const statusColor = { completed: 'green', shipped: 'blue', processing: 'orange', New: 'cyan' };
const StatusBadge = ({ status }) => (
  <Tag color={statusColor[status] || 'default'} style={{ fontSize: 11 }}>
    {status?.toUpperCase()}
  </Tag>
);

// ── KPI Card ──────────────────────────────────────────────────
const IconWrap = ({ bg, children }) => (
  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>{children}</div>
);

const Card = ({ item }) => {
  const isProfit = item.key === 'profit';
  const valNum   = num(item.value);
  let display;
  if (item.prefix === '$') {
    display = isProfit ? fmtMoney(valNum) : `$${fmtNum(valNum)}`;
  } else {
    display = item.key === 'orders' ? valNum : fmtNum(valNum);
  }
  const color =
    isProfit
      ? valNum > 0 ? dataColors.success : valNum < 0 ? dataColors.cancelled : '#64748b'
      : undefined;

  return (
    <div className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <IconWrap bg={item.iconBg}>{item.icon}</IconWrap>
        <div className="text-slate-600 text-[13px] leading-4 font-medium">{item.label}</div>
      </div>
      <div className="text-right tabular-nums font-semibold" style={{ color: color || '#1e293b' }}>
        {display}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
const EtsyOrderCost = () => {
  const { collapsed } = useOutletContext();
  const [tableHeight, setTableHeight] = useState(0);
  const [selectedCostOrder, setSelectedCostOrder] = useState(null);
  const tableContainerRef = useRef(null);

  const {
    pagedOrders,
    filteredStats,
    totalCount,
    loading,
    filters,
    updateFilter,
    debouncedSearch,
    shopOptions,
    statusOptions,
    currentPage,
    pageSize,
    handlePageChange,
    expandedRowKeys,
    allExpanded,
    handleExpand,
    toggleAllExpanded,
    refresh,
  } = useEtsyOrderCost();

  // ── Copy helper ───────────────────────────────────────────
  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.info('Copied to clipboard');
    } catch {
      toast.error('Failed to copy!');
    }
  }, []);

  // ── KPI items ─────────────────────────────────────────────
  const s = filteredStats || {};
  const kpiItems = [
    { key: 'orders',          label: 'Orders',          value: num(s.orders),          icon: <FaBox className="text-white" />,        iconBg: 'bg-slate-600' },
    { key: 'revenue',         label: 'Revenue',         value: num(s.revenue),         prefix: '$', icon: <FaDollarSign className="text-white" />,  iconBg: 'bg-emerald-500' },
    { key: 'profit',          label: 'Profit',          value: num(s.profit),          prefix: '$', icon: <FaUser className="text-white" />,         iconBg: 'bg-blue-500' },
    { key: 'baseCost',        label: 'Base Cost',       value: num(s.baseCost),        prefix: '$', icon: <FaDollarSign className="text-white" />,  iconBg: 'bg-amber-500' },
   // { key: 'listingFee',      label: 'Listing Fee',     value: num(s.listingFee),      prefix: '$', icon: <FaPercentage className="text-white" />,  iconBg: 'bg-fuchsia-500' },
    { key: 'fee',             label: 'Fee (21%)',      value: num(s.fee),             prefix: '$', icon: <FaPercentage className="text-white" />,  iconBg: 'bg-orange-500' },
    { key: 'offsiteAds',      label: 'Offsite Ads',     value: num(s.offsiteAds),      prefix: '$', icon: <FaDollarSign className="text-white" />,  iconBg: 'bg-rose-500' },
    { key: 'refund',          label: 'Refund',          value: num(s.refund),          prefix: '$', icon: <FaRedo className="text-white" />,         iconBg: 'bg-violet-500' },
  ];

  // ── Table columns (parent row) ────────────────────────────
  const columns = [
    {
      title: <span style={{ color: dataColors.title }}>Order ID</span>,
      dataIndex: 'orderId',
      key: 'orderId',
      align: 'center',
      width: 130,
    },
    {
      title: <span style={{ color: dataColors.title }}>Order Date</span>,
      dataIndex: 'orderDateCell',
      key: 'orderDate',
      align: 'center',
      width: 170,
    },
    {
      title: <span style={{ color: dataColors.title }}>Shop</span>,
      dataIndex: 'shopName',
      key: 'shopName',
      align: 'center',
      width: 130,
      render: (text) => <StatusComponent title={text} color={dataColors.pending} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Buyer</span>,
      dataIndex: 'buyerName',
      key: 'buyerName',
      align: 'center',
      width: 140,
    },
    {
      title: <span style={{ color: dataColors.title }}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 110,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Revenue</span>,
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      width: 100,
    },
    {
      title: <span style={{ color: dataColors.title }}>Base Cost</span>,
      dataIndex: 'baseCost',
      key: 'baseCost',
      align: 'right',
      width: 100,
    },
    // {
    //   title: <span style={{ color: dataColors.title }}>Listing Fee</span>,
    //   dataIndex: 'listingFeeCell',
    //   key: 'listingFee',
    //   align: 'right',
    //   width: 100,
    // },
    // {
    //   title: <span style={{ color: dataColors.title }}>Txn Fee</span>,
    //   dataIndex: 'transactionFeeCell',
    //   key: 'transactionFee',
    //   align: 'right',
    //   width: 90,
    // },
    // {
    //   title: <span style={{ color: dataColors.title }}>Pay Fee</span>,
    //   dataIndex: 'paymentFeeCell',
    //   key: 'paymentFee',
    //   align: 'right',
    //   width: 90,
    // },
    // {
    //   title: <span style={{ color: dataColors.title }}>Tax</span>,
    //   dataIndex: 'taxCell',
    //   key: 'tax',
    //   align: 'right',
    //   width: 80,
    // },
    // {
    //   title: <span style={{ color: dataColors.title }}>Offsite Ads</span>,
    //   dataIndex: 'offsiteAdsCell',
    //   key: 'offsiteAds',
    //   align: 'right',
    //   width: 100,
    // },
    // {
    //   title: <span style={{ color: dataColors.title }}>Discount</span>,
    //   dataIndex: 'discountCell',
    //   key: 'discount',
    //   align: 'right',
    //   width: 90,
    // },
    // {
    //   title: <span style={{ color: dataColors.title }}>Refund</span>,
    //   dataIndex: 'refundCell',
    //   key: 'refund',
    //   align: 'right',
    //   width: 80,
    // },
    {
      title: <span style={{ color: dataColors.title }}>Fee (21%)</span>,
      dataIndex: 'feeCell',
      key: 'fee',
      align: 'right',
      width: 80,
    },
    {
      title: <span style={{ color: dataColors.title }}>Profit</span>,
      dataIndex: 'profitCell',
      key: 'profit',
      align: 'right',
      width: 100,
      fixed: 'right',
    },
    {
      title: <span style={{ color: dataColors.title }}>Actions</span>,
      dataIndex: 'actions',
      key: 'actions',
      align: 'center',
      width: 100,
      fixed: 'right',
    },
  ];

  // ── Sub-table columns (items) ─────────────────────────────
  const subColumns = [
    {
      title: <span style={{ color: dataColors.title }}>Image</span>,
      dataIndex: 'imageCell',
      key: 'image',
      width: 120,
    },
    {
      title: <span style={{ color: dataColors.title }}>Listing Title</span>,
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: <span style={{ color: dataColors.title }}>SKU</span>,
      dataIndex: 'sku',
      key: 'sku',
      render: (v) => <StatusComponent title={v} color={dataColors.asin} />,
    },
    {
      title: <span style={{ color: dataColors.title }}>Quantity</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: <span style={{ color: dataColors.title }}>Unit Price</span>,
      dataIndex: 'priceCell',
      key: 'price',
      align: 'right',
    },
    {
      title: <span style={{ color: dataColors.title }}>Unit Base Cost</span>,
      dataIndex: 'baseCostCell',
      key: 'baseCost',
      align: 'right',
    },
  ];

  // ── Map raw orders → table rows ───────────────────────────
  const tableData = pagedOrders.map((o) => ({
    key:                o.orderId,
    orderId: (
      <button className="cursor-pointer" onClick={() => handleCopy(o.orderId)}>
        <StatusComponent title={o.orderId} color={dataColors.asin} />
      </button>
    ),
    orderDateCell: (
      <div>
        <span className="font-medium whitespace-nowrap mr-1">{o.orderDateFmt}</span>
      </div>
    ),
    shopName:    o.shopName,
    buyerName:   o.buyerName,
    status:      o.status,
    revenue:     <span className="font-medium">{fmtMoney(o.revenue)}</span>,
    baseCost:    <span className="font-medium">{fmtMoney(o.baseCost)}</span>,
    listingFeeCell:      <span className="font-medium">{fmtMoney(o.listingFee)}</span>,
    transactionFeeCell:  <span className="font-medium">{fmtMoney(o.transactionFee)}</span>,
    paymentFeeCell:      <span className="font-medium">{fmtMoney(o.paymentFee)}</span>,
    taxCell:             <span className="font-medium">{fmtMoney(o.tax)}</span>,
    offsiteAdsCell:      <span className="font-medium">{o.offsiteAds > 0 ? fmtMoney(o.offsiteAds) : '-'}</span>,
    discountCell:        <span className="font-medium">{o.discount > 0 ? fmtMoney(o.discount) : '-'}</span>,
    refundCell:          <span className="font-medium">{o.refund > 0 ? fmtMoney(o.refund) : '-'}</span>,
    feeCell:             <span className="font-medium">{fmtMoney(o.fee)}</span>,
    profitCell: (
      <span
        className="font-semibold"
        style={{ color: o.profit < 0 ? dataColors.cancelled : dataColors.success }}
      >
        {fmtMoney(o.profit)}
      </span>
    ),
    actions: (
      <button
        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-[#f8fafc] px-3 text-xs font-medium text-slate-700 hover:bg-[#eef2f7] cursor-pointer"
        onClick={() => setSelectedCostOrder(o)}
      >
        Details
      </button>
    ),
    // sub-items
    subItems: o.items.map((item, idx) => ({
      key:       `${o.orderId}-${idx}`,
      imageCell: (
        <div
          className="w-[80px] h-[80px] rounded-lg overflow-hidden"
          style={{ boxShadow: 'rgba(9,30,66,.25) 0 4px 8px -2px, rgba(9,30,66,.08) 0 0 0 1px' }}
        >
          <Image
            height={80}
            width={80}
            src={item.imageUrl}
            preview={{ src: item.previewImageUrl || item.imageUrl }}
            className="rounded-lg object-cover"
          />
        </div>
      ),
      title:       item.title,
      sku:         item.sku,
      quantity:    item.quantity,
      priceCell:   <span className="font-medium">{fmtMoney(item.price)}</span>,
      baseCostCell:<span className="font-medium">{fmtMoney(item.baseCost)}</span>,
    })),
  }));

  // ── Expanded row render ───────────────────────────────────
  const expandedRowRender = (record) => (
    <Table
      columns={subColumns}
      dataSource={record.subItems}
      pagination={false}
      rowKey="key"
      style={{ padding: 10 }}
      size="small"
    />
  );

  const costDetails = selectedCostOrder ? getEtsyOrderCostDetails(selectedCostOrder) : [];
  const costDetailItems = costDetails.map((item) => ({
    key: item.key,
    label: item.label,
    children: (
      <span
        className="font-semibold tabular-nums"
        style={{
          color:
            item.key === 'profit'
              ? item.value < 0
                ? dataColors.cancelled
                : dataColors.success
              : '#1e293b',
        }}
      >
        {fmtMoney(item.value)}
      </span>
    ),
  }));

  // ── Export Excel ──────────────────────────────────────────
  const handleExport = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Etsy Order Cost', { properties: { defaultRowHeight: 18 } });

      const borderThin = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      const moneyFmt   = '$#,##0.00;[Red]-$#,##0.00';

      const headers = [
        'Order ID','Order Date','Shop','Buyer','Status',
        'Revenue','Base Cost','Listing Fee','Transaction Fee','Payment Fee',
        'Tax','Offsite Ads','Discount','Refund','Fee (21%)','Profit',
      ];
      const headerRow = ws.getRow(1);
      headers.forEach((h, i) => {
        const c = headerRow.getCell(i + 1);
        c.value = h; c.font = { bold: true };
        c.alignment = { horizontal: 'center' }; c.border = borderThin;
      });
      ws.getRow(1).height = 20;

      // Use full filtered list for export (not paged)
      pagedOrders.forEach((o, ri) => {
        const row = ws.getRow(ri + 2);
        const vals = [
          o.orderId, o.orderDateFmt, o.shopName, o.buyerName, o.status,
          o.revenue, o.baseCost, o.listingFee, o.transactionFee, o.paymentFee,
          o.tax, o.offsiteAds, o.discount, o.refund, o.fee, o.profit,
        ];
        vals.forEach((v, ci) => {
          const c = row.getCell(ci + 1);
          c.value = v; c.border = borderThin;
          c.alignment = { horizontal: ci < 5 ? 'center' : 'right' };
          if (ci >= 5) c.numFmt = moneyFmt;
          if (ci === 15 && typeof v === 'number') {
            c.font = { color: { argb: v >= 0 ? '008000' : 'FF0000' }, bold: true };
          }
        });
      });

      [18, 20, 14, 18, 12, 12, 12, 12, 16, 11, 11, 12, 11, 11, 10, 12].forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });

      const buf = await wb.xlsx.writeBuffer();
      const fn = `Etsy_Order_Cost_${filters.from?.slice(0, 10)}_to_${filters.to?.slice(0, 10)}.xlsx`;
      saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fn);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  // ── useEffect hooks ───────────────────────────────────────────
  useEffect(() => {
    // Tắt scroll của trang
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Bật lại scroll khi component unmount
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const tableTop = tableContainerRef.current?.getBoundingClientRect().top;
      if (typeof tableTop !== 'number') return;
      setTableHeight(Math.max(160, window.innerHeight - tableTop - TABLE_BOTTOM_SAFE_AREA));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>Etsy Orders Cost</h1>
            <Tag color="orange" style={{ marginLeft: 4 }}>
              <span className="flex items-center gap-1"><FaEtsy /> API Data</span>
            </Tag>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border bg-[#f1f5f9] h-10 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={handleExport}
            >
              <span style={{ color: 'black' }}>Export Report</span>
              <BiSolidFileExport size={15} style={{ color: 'black' }} />
            </button>
            <DateRangePicker
              mode="range"
              showOutsideDays
              modifiersClassNames={{ selected: 'my-selected', range_middle: 'my-range-middle' }}
              modifiersStyles={{ range_middle: { backgroundColor: '#f3f4f6', fontWeight: 'normal' } }}
              updateFilter={(v) => updateFilter({ from: v?.from, to: v?.to })}
            />
          </div>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpiItems.map((it) => <Card key={it.key} item={it} />)}
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              placeholder="Search by Order ID, Buyer, Shop…"
              onChange={(e) => debouncedSearch(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-64"
              allowClear
            />

            {/* Shop filter */}
            <Select
              allowClear
              placeholder="All Shops"
              style={{ width: 150, height: 40 }}
              options={shopOptions.map((s) => ({ label: s, value: s }))}
              onChange={(val) => updateFilter({ shopName: val || '' })}
            />

            {/* Status filter */}
            <Select
              allowClear
              placeholder="All Statuses"
              style={{ width: 150, height: 40 }}
              options={statusOptions.map((s) => ({ label: s, value: s }))}
              onChange={(val) => updateFilter({ status: val || '' })}
            />

            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => { refresh(); toast.success('Refreshed!'); }}
              >
                <MdOutlineRefresh size={20} />
              </button>
            </Tooltip>
          </div>

          <Pagination
            total={totalCount}
            showTotal={(t) => `Total ${t} orders`}
            pageSize={pageSize}
            current={currentPage}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={[10, 20, 50]}
            className="custom-pagination"
          />
        </div>

        {/* Table */}
        <div ref={tableContainerRef} className="mt-4">
          <Table
            className="no-indent-table no-backgroud-title"
            columns={columns}
            dataSource={tableData}
            expandable={{
              indentSize: 0,
              expandedRowRender,
              expandedRowKeys,
              onExpand: handleExpand,
              expandIcon: ({ expanded, onExpand, record }) => (
                <div
                  className="flex justify-center items-center h-full w-full cursor-pointer"
                  onClick={(e) => onExpand(record, e)}
                >
                  {expanded ? <IoIosArrowUp fontSize={15} /> : <IoIosArrowDown fontSize={15} />}
                </div>
              ),
              columnTitle: (
                <div
                  className="flex justify-center items-center h-full w-full cursor-pointer"
                  onClick={toggleAllExpanded}
                >
                  {allExpanded ? <IoIosArrowUp fontSize={15} /> : <IoIosArrowDown fontSize={15} />}
                </div>
              ),
            }}
            bordered
            pagination={false}
            loading={loading}
            rowKey="key"
            scroll={{ x: 'max-content', y: tableHeight }}
            sticky={{ offsetHeader: 0 }}
            tableLayout="auto"
          />
        </div>

        <Modal
          title={
            selectedCostOrder
              ? `Order Cost Details - ${selectedCostOrder.orderId}`
              : 'Order Cost Details'
          }
          open={Boolean(selectedCostOrder)}
          onCancel={() => setSelectedCostOrder(null)}
          footer={null}
          width={720}
        >
          {selectedCostOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-slate-500">Buyer: </span>
                  <span className="font-medium text-slate-800">{selectedCostOrder.buyerName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Shop: </span>
                  <span className="font-medium text-slate-800">{selectedCostOrder.shopName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Order Date: </span>
                  <span className="font-medium text-slate-800">{selectedCostOrder.orderDateFmt || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status: </span>
                  <StatusBadge status={selectedCostOrder.status} />
                </div>
              </div>

              <Descriptions
                bordered
                size="small"
                column={2}
                items={costDetailItems}
              />

              <Table
                size="small"
                pagination={false}
                rowKey="key"
                columns={[
                  {
                    title: 'SKU',
                    dataIndex: 'sku',
                    key: 'sku',
                  },
                  {
                    title: 'Qty',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    align: 'center',
                    width: 70,
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'price',
                    key: 'price',
                    align: 'right',
                    width: 110,
                    render: (value) => fmtMoney(value),
                  },
                  {
                    title: 'Unit Base Cost',
                    dataIndex: 'baseCost',
                    key: 'baseCost',
                    align: 'right',
                    width: 130,
                    render: (value) => fmtMoney(value),
                  },
                ]}
                dataSource={(selectedCostOrder.items || []).map((item, idx) => ({
                  key: `${selectedCostOrder.orderId}-cost-${idx}`,
                  ...item,
                }))}
              />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default EtsyOrderCost;
