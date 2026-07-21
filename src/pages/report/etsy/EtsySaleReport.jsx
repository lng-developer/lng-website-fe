import { useOutletContext } from 'react-router-dom';
import { dataColors } from '../../../utils/dataColors';
import DateRangePicker from '../../../components/DateRangePicker';
import { Segmented, Table, Tooltip, Tag } from 'antd';
import { LuBoxes } from 'react-icons/lu';
import { FaMoneyBillWave } from 'react-icons/fa6';
import { BiSolidFileExport } from 'react-icons/bi';
import { FaDolly, FaEtsy } from 'react-icons/fa';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { defaultFrom, defaultTo } from '../../../utils/fomatDate';
import { getAllSellers } from '../../../apis/user';
import { useAuth } from '../../../context/AuthContext';
import SelectSeller from '../../../components/SelectSeller';
import ExcelJS from 'exceljs';
import { MdOutlineRefresh } from 'react-icons/md';
import { FaDollarSign, FaUser, FaPercentage } from 'react-icons/fa';
import { TableOutlined, BarChartOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import { getAllTeam } from '../../../apis/teams';
import EtsySaleReportCharts from './EtsySaleReportCharts';
import { reportForSaler } from '../../../apis/report';

// ---------- helpers ----------
const numberSafe = (v) => (Number.isFinite(+v) ? +v : 0);
const sum = (arr = []) => arr.reduce((a, b) => a + numberSafe(b), 0);
const $ = (n) => (n >= 0 ? `$${Number(n).toFixed(2)}` : `-$${Math.abs(Number(n)).toFixed(2)}`);
const roiColor = (percent) => (percent >= 60 ? dataColors.success : dataColors.cancelled);
const fitToLen = (arr = [], len) => {
  const safe = Array.isArray(arr) ? arr : [];
  if (safe.length === len) return safe;
  const clipped = safe.slice(0, len);
  if (clipped.length < len) return [...clipped, ...Array(len - clipped.length).fill(0)];
  return clipped;
};

const sumArraysByIndex = (arrs = [], len = 0) => {
  const out = Array(len).fill(0);
  for (const a of arrs) {
    const safe = Array.isArray(a) ? a : [];
    for (let i = 0; i < len; i++) out[i] += numberSafe(safe[i]);
  }
  return out.map((n) => +Number(n).toFixed(2));
};

const buildAggregateReport = (normalizedObj = {}, dayLen = 0) => {
  const entries = Object.values(normalizedObj || {});
  if (!entries.length) return {};
  const agg = {
    fee: sumArraysByIndex(entries.map((r) => r.fee), dayLen),
    offsiteAds: sumArraysByIndex(entries.map((r) => r.offsiteAds), dayLen),
    tax: sumArraysByIndex(entries.map((r) => r.tax), dayLen),
    shippingTax: sumArraysByIndex(entries.map((r) => r.shippingTax), dayLen),
    opCost: sumArraysByIndex(entries.map((r) => r.opCost), dayLen),
    refund: sumArraysByIndex(entries.map((r) => r.refund), dayLen),
    items: sumArraysByIndex(entries.map((r) => r.items), dayLen),
    revenue: sumArraysByIndex(entries.map((r) => r.revenue), dayLen),
    baseCost: sumArraysByIndex(entries.map((r) => r.baseCost), dayLen),
    discount: sumArraysByIndex(entries.map((r) => r.discount), dayLen),
  };
  const totals = entries.map((r) => r.totals).filter(Boolean);
  const get = (key) => (totals.length ? totals.reduce((a, t) => a + numberSafe(t?.[key]), 0) : 0);
  agg.totals = {
    items: get('items') || sum(agg.items),
    revenue: get('revenue') || sum(agg.revenue),
    baseCost: get('baseCost') || sum(agg.baseCost),
    fee: get('fee') || sum(agg.fee),
    offsiteAds: get('offsiteAds') || sum(agg.offsiteAds),
    tax: get('tax') || sum(agg.tax),
    shippingTax: get('shippingTax') || sum(agg.shippingTax),
    opCost: get('opCost') || sum(agg.opCost),
    refund: get('refund') || sum(agg.refund),
    discount: get('discount') || sum(agg.discount),
    profit1: get('profit1') || 0,
    profit2: get('profit2') || 0,
  };
  return agg;
};



// ============================================================
// MOCK DATA  –  sẽ được thay bằng API khi sẵn sàng
// ============================================================
const generateMockDays = (from, to) => {
  const days = [];
  const start = new Date(from);
  const end = new Date(to);
  const diffDays = Math.min(Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1, 14);
  for (let i = 0; i < diffDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
};

const rand = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);

const generateMockSellerData = (days) => {
  const len = days.length;
  const arr = (min, max) => Array.from({ length: len }, () => rand(min, max));

  const items = arr(3, 20).map(Math.round);
  const revenue = arr(120, 600);
  const baseCost = revenue.map((r) => +(r * rand(0.25, 0.40)).toFixed(2));
  const listingFee = arr(0.4, 1.2);
  const transactionFee = revenue.map((r) => +(r * 0.065).toFixed(2));
  const paymentFee = revenue.map((r) => +(r * 0.03).toFixed(2));
  const offsiteAds = revenue.map((r) => +(r * rand(0.01, 0.05)).toFixed(2));
  const tax = revenue.map((r) => +(r * 0.10).toFixed(2));
  const opCost = arr(5, 25);
  const refund = arr(0, 30);
  const discount = arr(0, 15);

  const profit1 = revenue.map((v, i) =>
    +(v - baseCost[i] - listingFee[i] - transactionFee[i] - paymentFee[i]).toFixed(2)
  );
  const profit2 = profit1.map((p, i) =>
    +(p - offsiteAds[i] - tax[i] - opCost[i] - refund[i]).toFixed(2)
  );

  return {
    items, revenue, baseCost, listingFee, transactionFee, paymentFee,
    offsiteAds, tax, opCost, refund, discount, profit1, profit2,
    totals: {
      items: sum(items),
      revenue: +sum(revenue).toFixed(2),
      baseCost: +sum(baseCost).toFixed(2),
      listingFee: +sum(listingFee).toFixed(2),
      transactionFee: +sum(transactionFee).toFixed(2),
      paymentFee: +sum(paymentFee).toFixed(2),
      offsiteAds: +sum(offsiteAds).toFixed(2),
      tax: +sum(tax).toFixed(2),
      opCost: +sum(opCost).toFixed(2),
      refund: +sum(refund).toFixed(2),
      discount: +sum(discount).toFixed(2),
      profit1: +sum(profit1).toFixed(2),
      profit2: +sum(profit2).toFixed(2),
    },
  };
};

const buildMockReport = (from, to) => {
  const days = generateMockDays(from || defaultFrom, to || defaultTo);
  const reportBySeller = {};
  ['Etsy Shop A', 'Etsy Shop B', 'Etsy Shop C'].forEach((s) => {
    reportBySeller[s] = generateMockSellerData(days);
  });
  return { days, reportBySeller };
};
// ============================================================

const EtsySaleReport = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();
  const [reportBySeller, setReportBySeller] = useState({});
  const [loading, setLoading] = useState(false);
  const [tableHeight, setTableHeight] = useState(0);
  const [days, setDays] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectSeller, setSelectSeller] = useState();
  const [selectTeam, setSelectTeam] = useState();
  const [viewMode, setViewMode] = useState('table');
  const [reportScope, setReportScope] = useState('seller');

  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
    seller: '',
    team: '',
  });

  const updateFilter = (newValues) =>
    setFilters((prev) => ({ ...prev, ...newValues }));

  const handleChangeScope = (val) => {
    setReportScope(val);
    if (val === 'total') {
      setSelectSeller(undefined);
      updateFilter({ seller: '' });
    }
  };

  const fetchReport = async (params) => {
    setLoading(true);
    try {
      const fromISO = new Date(params?.from || defaultFrom).toISOString();
      const toISO = new Date(params?.to || defaultTo).toISOString();
      const res = await reportForSaler(fromISO, toISO);
      
      if (res.status === 200 && res.data) {
        const apiData = res.data;
        // Map API data structure to component structure
        const mappedData = {};
        
        Object.entries(apiData.data || {}).forEach(([seller, sellerData]) => {
          mappedData[seller] = {
            items: sellerData.items || [],
            revenue: sellerData.revenue || [],
            baseCost: sellerData.baseCost || [],
            fee: sellerData.fee || [],
            offsiteAds: sellerData.ads || [],
            tax: sellerData.itemTax || [],
            shippingTax: sellerData.shippingTax || [],
            opCost: sellerData.opCost || [],
            refund: sellerData.refund || [],
            discount: sellerData.itemPromotionDiscount || [],
            profit1: sellerData.profit1 || [],
            profit2: sellerData.profit2 || [],
            totals: sellerData.totals || {},
          };
        });
        
        setDays(apiData.date || []);
        setReportBySeller(mappedData);
      } else {
        toast.error('Failed to fetch report data');
      }
    } catch (error) {
      console.error('Fetch report error:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const dayKeys = days.map((d) => d.replace(/-/g, '_'));

  const normalized = useMemo(() => {
    const len = dayKeys.length;
    const out = {};
    Object.entries(reportBySeller || {}).forEach(([seller, r]) => {
      out[seller] = {
        ...r,
        items: fitToLen(r.items, len),
        revenue: fitToLen(r.revenue, len),
        baseCost: fitToLen(r.baseCost, len),
        fee: fitToLen(r.fee, len),
        offsiteAds: fitToLen(r.offsiteAds, len),
        tax: fitToLen(r.tax, len),
        shippingTax: fitToLen(r.shippingTax, len),
        opCost: fitToLen(r.opCost, len),
        refund: fitToLen(r.refund, len),
        discount: fitToLen(r.discount, len),
        profit1: r.profit1 ? fitToLen(r.profit1, len) : undefined,
        profit2: r.profit2 ? fitToLen(r.profit2, len) : undefined,
      };
    });
    return out;
  }, [reportBySeller, dayKeys.length]);

  const normalizedView = useMemo(() => {
    const len = dayKeys.length;
    if (reportScope === 'total') {
      const agg = buildAggregateReport(normalized, len);
      return Object.keys(agg).length ? { 'All Shops': agg } : {};
    }
    return normalized;
  }, [normalized, dayKeys.length, reportScope]);

  // ----- build data cho bảng -----
  const dataSource = useMemo(() => {
    const rows = [];
    Object.entries(normalizedView).forEach(([seller, r]) => {
      const profit1 = r.profit1 ?? r.revenue.map((v, i) =>
        +(numberSafe(v) - numberSafe(r.baseCost[i]) - numberSafe(r.fee[i]) - numberSafe(r.tax[i]) - numberSafe(r.discount[i])).toFixed(2)
      );
      const profit2 = r.profit2 ?? profit1.map((p, i) =>
        +(numberSafe(p) - numberSafe(r.offsiteAds[i]) - numberSafe(r.opCost[i]) - numberSafe(r.refund[i])).toFixed(2)
      );
      const roiArr = (r.offsiteAds || []).map((ad, i) =>
        numberSafe(ad) > 0 ? +((numberSafe(profit2[i]) / numberSafe(ad)) * 100).toFixed(2) : null
      );
      const totals = {
        items: r.totals?.items ?? sum(r.items),
        revenue: r.totals?.revenue ?? sum(r.revenue),
        baseCost: r.totals?.baseCost ?? sum(r.baseCost),
        fee: r.totals?.fee ?? sum(r.fee),
        offsiteAds: r.totals?.offsiteAds ?? sum(r.offsiteAds),
        tax: r.totals?.tax ?? sum(r.tax),
        shippingTax: r.totals?.shippingTax ?? sum(r.shippingTax),
        opCost: r.totals?.opCost ?? sum(r.opCost),
        refund: r.totals?.refund ?? sum(r.refund),
        discount: r.totals?.discount ?? sum(r.discount || []),
        profit1: r.totals?.profit1 ?? sum(profit1),
        profit2: r.totals?.profit2 ?? sum(profit2),
      };
      const totalROI = totals.offsiteAds > 0
        ? +(((totals.profit2 || 0) / totals.offsiteAds) * 100).toFixed(2)
        : null;

      const group = [
        { type: 'Total Order Items', values: r.items, money: false, totalVal: totals.items },
        { type: 'Revenue', values: r.revenue, money: true, totalVal: totals.revenue },
        { type: 'Base Cost', values: r.baseCost, money: true, totalVal: totals.baseCost },
      //   { type: 'Fee', values: r.fee, money: true, totalVal: totals.fee },
      //   { type: 'Tax', values: r.tax, money: true, totalVal: totals.tax },
     //    { type: 'Shipping Tax', values: r.shippingTax || [], money: true, totalVal: totals.shippingTax },
         { type: 'Discount', values: r.discount || [], money: true, totalVal: totals.discount },
        { type: 'Ads', values: r.offsiteAds, money: true, totalVal: totals.offsiteAds },
        { type: 'Profit 1', values: profit1, money: true, totalVal: totals.profit1, signAware: true },
        { type: 'Operation Cost', values: r.opCost, money: true, totalVal: totals.opCost },
        { type: 'Refund', values: r.refund, money: true, totalVal: totals.refund },
        { type: 'Profit 2', values: profit2, money: true, totalVal: totals.profit2, signAware: true },
        { type: 'ROI', values: roiArr, percent: true, totalVal: totalROI },
      ];

      group.forEach((row, idx) => {
        const isFirst = idx === 0;
        const record = {
          key: `${seller}-${row.type}`,
          seller,
          type: <span className="font-medium">{row.type}</span>,
          total: row.totalVal,
          _rowSpan: isFirst ? group.length : 0,
          _groupStart: isFirst && rows.length > 0,
          _money: row.money,
          _percent: row.percent,
          _signAware: row.signAware || false,
        };
        dayKeys.forEach((k, i) => (record[k] = row.values[i]));
        rows.push(record);
      });
    });
    return rows;
  }, [normalizedView, dayKeys]);

  const sepStyle = (row) => (row._groupStart ? { borderTop: '1px solid #e5e9eeff' } : undefined);

  const renderCell = (val, row) => {
    if (row._percent) {
      if (val === null || val === undefined) return <span>-</span>;
      return <span className="font-medium" style={{ color: roiColor(Number(val)) }}>{Number(val).toFixed(2)}%</span>;
    }
    if (row._money) {
      const n = Number(val) || 0;
      const color = row._signAware
        ? n > 0 ? dataColors.success : n < 0 ? dataColors.cancelled : '#475569'
        : undefined;
      return <span className="font-medium" style={{ color }}>{$(n)}</span>;
    }
    return <span className="font-medium">{Number(val)}</span>;
  };

  const columns = [
    {
      title: <span className="font-medium" style={{ color: dataColors.title }}>Shop</span>,
      dataIndex: 'seller',
      align: 'center',
      fixed: 'left',
      width: 150,
      render: (val, row) => ({
        children: <div style={{ fontWeight: 600 }}>{val}</div>,
        props: { rowSpan: row._rowSpan, style: sepStyle(row) },
      }),
    },
    {
      title: <span className="font-medium" style={{ color: dataColors.title }}>Type</span>,
      dataIndex: 'type',
      width: 140,
      fixed: 'left',
      onCell: (row) => ({ style: sepStyle(row) }),
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>,
    },
    {
      title: <span className="font-medium" style={{ color: dataColors.title }}>Total</span>,
      dataIndex: 'total',
      width: 120,
      align: 'right',
      fixed: 'left',
      onHeaderCell: () => ({ style: { borderRight: '2px solid #e5e9eeff' } }),
      onCell: (row) => ({ style: { borderRight: '2px solid #e5e9eeff', ...sepStyle(row) } }),
      render: renderCell,
    },
    ...days.map((d, idx) => ({
      title: <span className="font-medium" style={{ color: dataColors.title }}>{d}</span>,
      dataIndex: dayKeys[idx],
      align: 'right',
      width: 120,
      onCell: (row) => ({ style: sepStyle(row) }),
      render: renderCell,
    })),
  ];

  // ----- KPIs -----
  const kpis = useMemo(() => {
    const entries = Object.values(normalizedView);
    const totals = entries.map((r) => r.totals).filter(Boolean);
    const get = (key) => (totals.length ? totals.reduce((a, t) => a + numberSafe(t?.[key]), 0) : 0);
    const getOffsiteAds = () =>
      entries.reduce((acc, r) => acc + numberSafe(r.totals?.offsiteAds ?? sum(r.offsiteAds)), 0);
    return [
      { key: 'order', label: 'Order Items', value: get('items'), icon: <LuBoxes className="text-white" />, iconBg: 'bg-slate-600' },
      { key: 'revenue', label: 'Revenue', value: get('revenue'), prefix: '$', icon: <FaMoneyBillWave className="text-white" />, iconBg: 'bg-emerald-500' },
      { key: 'baseCost', label: 'Base Cost', value: get('baseCost'), prefix: '$', icon: <FaDollarSign className="text-white" />, iconBg: 'bg-amber-500' },
      { key: 'fee', label: 'Fee', value: get('fee'), prefix: '$', icon: <FaDolly className="text-white" />, iconBg: 'bg-fuchsia-500' },
      { key: 'ads', label: 'Ads', value: getOffsiteAds(), prefix: '$', icon: <FaDollarSign className="text-white" />, iconBg: 'bg-blue-500' },
      { key: 'discount', label: 'Discount', value: get('discount'), prefix: '$', icon: <FaPercentage className="text-white" />, iconBg: 'bg-orange-500' },
      { key: 'refund', label: 'Refund', value: get('refund'), prefix: '$', icon: <FaDollarSign className="text-white" />, iconBg: 'bg-red-500' },
      { key: 'profit', label: 'Profit', value: get('profit2'), prefix: '$', icon: <FaUser className="text-white" />, iconBg: 'bg-emerald-500' },
    ];
  }, [normalizedView]);

  const formatNumber = (n) =>
    typeof n === 'number' ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n;
  const formatMoneySigned = (n) =>
    Number(n) >= 0 ? `$${formatNumber(Number(n))}` : `-$${formatNumber(Math.abs(Number(n)))}`;

  const IconWrap = ({ bg, children }) => (
    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>{children}</div>
  );

  const Card = ({ item }) => {
    const isProfit = item.key === 'profit';
    const isMoney = item.prefix === '$';
    const valNum = typeof item.value === 'number' ? item.value : Number(item.value) || 0;
    const display = isMoney
      ? isProfit ? formatMoneySigned(valNum) : `$${formatNumber(valNum)}`
      : item.label === 'Order Items' ? valNum : formatNumber(valNum);
    const color = isProfit
      ? valNum > 0 ? dataColors.success : valNum < 0 ? dataColors.cancelled : '#64748b'
      : item.key === 'revenue' ? dataColors.success : undefined;
    return (
      <div className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3">
          <IconWrap bg={item.iconBg}>{item.icon}</IconWrap>
          <div className="text-slate-600 text-[13px] leading-4 font-medium">{item.label}</div>
        </div>
        <div className="text-right tabular-nums font-semibold" style={{ color }}>{display}</div>
      </div>
    );
  };

  const fetchAllSellers = async () => {
    if (user?.role === 'Admin') {
      try {
        const res = await getAllSellers();
        if (res.status === 200) {
          setSellers(res.data?.map((item) => ({ label: item?.full_name, value: item?._id })));
        } else toast.error(res.data?.message || 'Fetch error');
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Unexpected error');
      }
    }
  };

  // ====== EXPORT EXCEL ======
  const handleExportExcel = async () => {
    try {
      const entries = Object.entries(normalizedView);
      const sumArr = (a = []) => a.reduce((x, y) => x + (Number.isFinite(+y) ? +y : 0), 0);
      const getTotal = (k) => entries.reduce((acc, [, r]) => acc + numberSafe(r.totals?.[k]), 0);

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Etsy Sale Report', {
        properties: { defaultRowHeight: 18 },
        views: [{ state: 'frozen', xSplit: 0, ySplit: 14 }],
      });

      const borderThin = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      const fillOrange = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F56400' } };
      const fillBlue = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9EEF8' } };
      const moneyFmt = '$#,##0.00;[Red]-$#,##0.00';

      const set = (addr, v, opts = {}) => {
        const c = ws.getCell(addr);
        c.value = v;
        if (opts.bold) c.font = { ...(c.font || {}), bold: true };
        if (opts.italic) c.font = { ...(c.font || {}), italic: true };
        if (opts.size) c.font = { ...(c.font || {}), size: opts.size };
        if (opts.color) c.font = { ...(c.font || {}), color: { argb: opts.color } };
        if (opts.align) c.alignment = { ...(c.alignment || {}), ...opts.align };
        if (opts.fill) c.fill = opts.fill;
        if (opts.border) c.border = opts.border;
        if (opts.numFmt) c.numFmt = opts.numFmt;
        return c;
      };

      set('B1', 'CÔNG TY TNHH LAN NHI GROUP', { bold: true });
      ws.mergeCells('B2', 'I2');
      set('B2', 'BÁO CÁO DOANH THU ETSY', {
        bold: true, size: 18, align: { horizontal: 'center' },
        fill: fillOrange, border: borderThin, color: 'FFFFFF',
      });
      ws.mergeCells('B3', 'I3');
      const fromStr = (filters.from || '').slice(0, 10).split('-').reverse().join('/');
      const toStr = (filters.to || '').slice(0, 10).split('-').reverse().join('/');
      set('B3', `Từ ngày ${fromStr} đến ngày ${toStr}`, { italic: true, color: '0033CC', align: { horizontal: 'center' } });
      set('J3', `Tổng đơn: ${getTotal('items')}`, { bold: true, align: { horizontal: 'right' } });

      ws.mergeCells('B5', 'I5');
      set('B5', 'Chi phí', { bold: true, align: { horizontal: 'center' }, fill: fillBlue, border: borderThin });
      [
        ['B6', 'Base Cost', 'baseCost'],
        ['B7', 'Fee', 'fee'],
        ['B8', 'Offsite Ads', 'offsiteAds'],
        ['B9', 'Tax', 'tax'],
        ['B10', 'Shipping Tax', 'shippingTax'],
        ['B11', 'Discount', 'discount'],
        ['B12', 'Refund', 'refund'],
      ].forEach(([addr, label, key]) => {
        set(addr, label, { border: borderThin });
        set(`I${addr.slice(1)}`, getTotal(key), { border: borderThin, numFmt: moneyFmt, align: { horizontal: 'right' } });
      });

      ws.mergeCells('B14', 'I14');
      set('B14', 'Thu nhập', { bold: true, align: { horizontal: 'center' }, fill: fillBlue, border: borderThin });
      set('B15', 'Doanh thu', { border: borderThin });
      set('I15', getTotal('revenue'), { border: borderThin, numFmt: moneyFmt, align: { horizontal: 'right' } });
      set('B16', 'Lợi nhuận', { border: borderThin });
      set('I16', getTotal('profit2'), { border: borderThin, numFmt: moneyFmt, align: { horizontal: 'right' } });

      const startRow = 18;
      const col = { seller: 2, type: 3, total: 4, firstDay: 5 };
      const headerRow = ws.getRow(startRow);
      ['Shop', 'Type', 'Total', ...days].forEach((h, i) => {
        const cell = headerRow.getCell(col.seller + i);
        cell.value = h; cell.font = { bold: true };
        cell.alignment = { horizontal: 'center' }; cell.border = borderThin;
      });
      ws.getColumn(col.seller).width = 18;
      ws.getColumn(col.type).width = 18;
      ws.getColumn(col.total).width = 14;
      days.forEach((_, i) => (ws.getColumn(col.firstDay + i).width = 12));

      let rIdx = startRow + 1;
      entries.forEach(([seller, r], sIdx) => {
        const profit1 = Array.isArray(r.profit1) && r.profit1.length ? r.profit1 :
          r.revenue.map((v, i) => +(numberSafe(v) - numberSafe(r.baseCost[i]) - numberSafe(r.listingFee[i]) - numberSafe(r.transactionFee[i]) - numberSafe(r.paymentFee[i])).toFixed(2));
        const profit2 = Array.isArray(r.profit2) && r.profit2.length ? r.profit2 :
          profit1.map((p, i) => +(numberSafe(p) - numberSafe(r.offsiteAds[i]) - numberSafe(r.tax[i]) - numberSafe(r.opCost[i]) - numberSafe(r.refund[i])).toFixed(2));

        const group = [
          { label: 'Total Order Items', values: r.items, total: r.totals?.items, money: false },
          { label: 'Revenue', values: r.revenue, total: r.totals?.revenue, money: true },
          { label: 'Base Cost', values: r.baseCost, total: r.totals?.baseCost, money: true },
          { label: 'Fee', values: r.fee, total: r.totals?.fee, money: true },
          { label: 'Tax', values: r.tax, total: r.totals?.tax, money: true },
          { label: 'Shipping Tax', values: r.shippingTax || [], total: r.totals?.shippingTax || sumArr(r.shippingTax || []), money: true },
          { label: 'Discount', values: r.discount || [], total: sumArr(r.discount || []), money: true },
          { label: 'Offsite Ads', values: r.offsiteAds, total: r.totals?.offsiteAds, money: true },
          { label: 'Profit 1', values: profit1, total: r.totals?.profit1, money: true, signAware: true },
          { label: 'Operation Cost', values: r.opCost, total: r.totals?.opCost, money: true },
          { label: 'Refund', values: r.refund, total: r.totals?.refund, money: true },
          { label: 'Profit 2', values: profit2, total: r.totals?.profit2, money: true, signAware: true },
          {
            label: 'ROI', percent: true,
            values: (r.offsiteAds || []).map((ad, i) => numberSafe(ad) > 0 ? numberSafe(profit2[i]) / numberSafe(ad) : null),
            total: r.totals?.offsiteAds > 0 ? r.totals?.profit2 / r.totals?.offsiteAds : null,
          },
        ];

        if (group.length > 1) ws.mergeCells(rIdx, col.seller, rIdx + group.length - 1, col.seller);
        group.forEach((rowObj, idx) => {
          const row = ws.getRow(rIdx);
          if (idx === 0) {
            const cS = row.getCell(col.seller);
            cS.value = seller; cS.font = { bold: true }; cS.border = borderThin;
          }
          const cT = row.getCell(col.type);
          cT.value = rowObj.label; cT.border = borderThin;

          const cTotal = row.getCell(col.total);
          cTotal.value = rowObj.total ?? (rowObj.percent ? null : 0);
          cTotal.alignment = { horizontal: 'right' }; cTotal.border = borderThin;
          if (rowObj.money) cTotal.numFmt = moneyFmt;
          if (rowObj.percent) cTotal.numFmt = '0.00%';
          if (rowObj.signAware && typeof cTotal.value === 'number')
            cTotal.font = { color: { argb: cTotal.value >= 0 ? '008000' : 'FF0000' }, bold: true };

          days.forEach((_, i) => {
            const c = row.getCell(col.firstDay + i);
            const v = rowObj.values?.[i];
            c.value = rowObj.percent ? (v == null ? null : Number(v)) : Number(v || 0);
            c.alignment = { horizontal: 'right' }; c.border = borderThin;
            if (rowObj.money) c.numFmt = moneyFmt;
            if (rowObj.percent) c.numFmt = '0.00%';
            if (rowObj.signAware && typeof c.value === 'number')
              c.font = { color: { argb: c.value >= 0 ? '008000' : 'FF0000' }, bold: true };
          });
          rIdx++;
        });

        if (sIdx < entries.length - 1) { ws.getRow(rIdx).height = 6; rIdx++; }
      });

      const buf = await wb.xlsx.writeBuffer();
      const filename = `Etsy_Sale_Report_${filters.from?.slice(0, 10)}_to_${filters.to?.slice(0, 10)}.xlsx`;
      saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
    } catch (err) {
      console.error(err);
      toast.error('Export Excel failed');
    }
  };

  const fetchAllTeams = async () => {
    try {
      const res = await getAllTeam();
      if (res.status === 200) {
        setTeams(res.data?.data?.map((item) => ({ label: item?.name, value: item?._id })));
      } else toast.error(res.data?.message || 'Fetch error');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unexpected error');
    }
  };



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
      const headerHeight = 240;
      const availableHeight = window.innerHeight - headerHeight - 20;
      setTableHeight(availableHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAllTeams();
  }, []);
  useEffect(() => { fetchAllSellers(); }, []);
  useEffect(() => {
    fetchReport(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.seller, filters.team]);

  return (
    <div className="overflow-hidden">
      {/* ── Header bar ── */}
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>Etsy Sale Report</h1>
          </div>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={handleExportExcel}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>Export Report</span>
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

      <div className="mt-[60px] px-8 py-4 h-full">
        {/* KPI Cards */}
        <div className="w-full">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {kpis.map((it) => <Card key={it.key} item={it} />)}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2 items-center">
            {reportScope === 'seller' && (
              <SelectSeller
                title="Report By Shop"
                ListData={sellers}
                value={selectSeller}
                onChange={(val) => { setSelectSeller(val); updateFilter({ seller: val }); }}
              />
            )}
            <SelectSeller
              title="Team"
              ListData={teams}
              value={selectTeam}
              onChange={(val) => { updateFilter({ team: val }); setSelectTeam(val); }}
            />
            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => { fetchReport(filters); toast.success('Refresh success!'); }}
              >
                <MdOutlineRefresh size={20} />
              </button>
            </Tooltip>
            {user?.role === 'Admin' && (
              <Segmented
                size="middle"
                shape="round"
                options={[
                  { value: 'table', icon: <TableOutlined /> },
                  { value: 'chart', icon: <BarChartOutlined /> },
                ]}
                onChange={(value) => setViewMode(value)}
              />
            )}
          </div>
          <Segmented
            size="middle"
            shape="round"
            value={reportScope}
            options={[
              { label: 'Report By Shop', value: 'seller' },
              { label: 'Total Report', value: 'total' },
            ]}
            onChange={handleChangeScope}
          />
        </div>

        {/* Table / Charts */}
        <div className="mt-4">
          {viewMode === 'table' ? (
            <Table
              columns={columns}
              dataSource={dataSource}
              rowKey="key"
              bordered
              pagination={false}
              scroll={{ x: 'max-content', y: tableHeight }}
              loading={loading}
              sticky={{ offsetHeader: 0 }}
              tableLayout="auto"
            />
          ) : (
            <EtsySaleReportCharts
              days={days}
              normalized={normalizedView}
              sellerFilter={reportScope === 'total' ? '' : filters.seller}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EtsySaleReport;
