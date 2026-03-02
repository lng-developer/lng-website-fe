import { useOutletContext } from 'react-router-dom';
import { dataColors } from '../../utils/dataColors';
import DateRangePicker from '../../components/DateRangePicker';
import { Segmented, Table, Tooltip } from 'antd';
import { LuBoxes, LuImport } from 'react-icons/lu';
import { FaMoneyBillWave } from 'react-icons/fa6';
import { BiSolidFileExport } from 'react-icons/bi';
import { FaDolly } from 'react-icons/fa6';
import { useEffect, useMemo, useState } from 'react';
import { getAllReport } from '../../apis/report';
import { toast } from 'sonner';
import { defaultFrom, defaultTo } from '../../utils/fomatDate';
import ModalReport from './ModalReport';
import ModalAds from './ModalAds';
import { getAllSellers } from '../../apis/user';
import { useAuth } from '../../context/AuthContext';
import SelectSeller from '../../components/SelectSeller';
import ExcelJS from 'exceljs';
import { MdOutlineRefresh } from 'react-icons/md';
import { FaDollarSign, FaUser, FaPercentage, FaBuysellads } from 'react-icons/fa';
import { TableOutlined, BarChartOutlined } from '@ant-design/icons';

import { saveAs } from 'file-saver';

import SaleReportCharts from './SaleReportCharts';
import ModalRefund from './ModalRefund';
import { getAllTeam } from '../../apis/teams';

// ---------- helpers ----------
const numberSafe = (v) => (Number.isFinite(+v) ? +v : 0);
const sum = (arr = []) => arr.reduce((a, b) => a + numberSafe(b), 0);
const $ = (n) => (n >= 0 ? `$${Number(n).toFixed(2)}` : `-$${Math.abs(Number(n)).toFixed(2)}`);
// ROI threshold 60%
const roiColor = (percent) => (percent >= 60 ? dataColors.success : dataColors.cancelled);
const fitToLen = (arr = [], len) => {
  const safe = Array.isArray(arr) ? arr : [];
  if (safe.length === len) return safe;
  const clipped = safe.slice(0, len);
  if (clipped.length < len) return [...clipped, ...Array(len - clipped.length).fill(0)];
  return clipped;
};

// ---------- NEW helpers: aggregate report ----------
const sumArraysByIndex = (arrs = [], len = 0) => {
  const out = Array(len).fill(0);
  for (const a of arrs) {
    const safe = Array.isArray(a) ? a : [];
    for (let i = 0; i < len; i++) out[i] += numberSafe(safe[i]);
  }
  return out.map((n) => +Number(n).toFixed(2));
};

// gộp tất cả seller thành 1 object report duy nhất (giữ format giống backend)
const buildAggregateReport = (normalizedObj = {}, dayLen = 0) => {
  const entries = Object.values(normalizedObj || {});
  if (!entries.length) return {};

  const agg = {
    fee: sumArraysByIndex(
      entries.map((r) => r.fee),
      dayLen
    ),
    itemTax: sumArraysByIndex(
      entries.map((r) => r.itemTax),
      dayLen
    ),
    shippingTax: sumArraysByIndex(
      entries.map((r) => r.shippingTax),
      dayLen
    ),
    itemPromotionDiscount: sumArraysByIndex(
      entries.map((r) => r.itemPromotionDiscount),
      dayLen
    ),
    opCost: sumArraysByIndex(
      entries.map((r) => r.opCost),
      dayLen
    ),
    refund: sumArraysByIndex(
      entries.map((r) => r.refund),
      dayLen
    ),
    items: sumArraysByIndex(
      entries.map((r) => r.items),
      dayLen
    ),
    revenue: sumArraysByIndex(
      entries.map((r) => r.revenue),
      dayLen
    ),
    baseCost: sumArraysByIndex(
      entries.map((r) => r.baseCost),
      dayLen
    ),
    ads: sumArraysByIndex(
      entries.map((r) => r.ads),
      dayLen
    ),
  };

  const hasProfit1 = entries.some((r) => Array.isArray(r.profit1));
  const hasProfit2 = entries.some((r) => Array.isArray(r.profit2));
  if (hasProfit1)
    agg.profit1 = sumArraysByIndex(
      entries.map((r) => r.profit1 || []),
      dayLen
    );
  if (hasProfit2)
    agg.profit2 = sumArraysByIndex(
      entries.map((r) => r.profit2 || []),
      dayLen
    );

  const totals = entries.map((r) => r.totals).filter(Boolean);
  const get = (key) => (totals.length ? totals.reduce((a, t) => a + numberSafe(t?.[key]), 0) : 0);

  agg.totals = {
    items: get('items') || sum(agg.items),
    revenue: get('revenue') || sum(agg.revenue),
    baseCost: get('baseCost') || sum(agg.baseCost),
    ads: get('ads') || sum(agg.ads),
    fee: get('fee') || sum(agg.fee),
    opCost: get('opCost') || sum(agg.opCost),
    refund: get('refund') || sum(agg.refund),
    profit1: get('profit1') || 0,
    profit2: get('profit2') || 0,
    itemPromotionDiscount: get('itemPromotionDiscount') || sum(agg.itemPromotionDiscount),
  };

  return agg;
};

const SaleReport = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();
  const [reportBySeller, setReportBySeller] = useState({});
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState([]);
  const [openModalImportReport, setOpenModalImportReport] = useState(false);
  const [openModalImportAds, setOpenModalImportAds] = useState(false);
  const [openModalImportRefund, setOpenModalImportRefund] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectSeller, setSelectSeller] = useState();
  const [selectTeam, setSelectTeam] = useState();

  // NEW: toggle view
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'

  // NEW: tab report scope
  const [reportScope, setReportScope] = useState('seller'); // 'seller' | 'total'

  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
    seller: '',
    team: '',
  });

  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: newValues.page || Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : 1,
    }));
  };

  const handleChangeScope = (val) => {
    setReportScope(val);

    // Total Report => clear seller filter để tránh hiểu nhầm
    if (val === 'total') {
      setSelectSeller(undefined);
      updateFilter({ seller: '' });
    }
  };

  const fetchAllReport = async (params) => {
    setLoading(true);
    try {
      const res = await getAllReport(params); // backend nhận {from,to,seller,team}
      if (res.status === 200) {
        setReportBySeller(res.data?.data || {});
        setDays(res.data?.date || []);
      } else {
        toast.error(res.data?.message || 'Fetch error');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const dayKeys = days.map((d) => d.replace(/-/g, '_'));

  // ----- chuẩn hoá độ dài mảng theo số cột ngày -----
  const normalized = useMemo(() => {
    const len = dayKeys.length;
    const out = {};
    Object.entries(reportBySeller || {}).forEach(([seller, r]) => {
      out[seller] = {
        ...r,
        fee: fitToLen(r.fee, len),
        itemTax: fitToLen(r.itemTax, len),
        shippingTax: fitToLen(r.shippingTax, len),
        itemPromotionDiscount: fitToLen(r.itemPromotionDiscount, len),
        opCost: fitToLen(r.opCost, len),
        refund: fitToLen(r.refund, len),
        items: fitToLen(r.items, len),
        revenue: fitToLen(r.revenue, len),
        baseCost: fitToLen(r.baseCost, len),
        ads: fitToLen(r.ads, len),
        profit1: r.profit1 ? fitToLen(r.profit1, len) : undefined,
        profit2: r.profit2 ? fitToLen(r.profit2, len) : undefined,
      };
    });
    return out;
  }, [reportBySeller, dayKeys.length]);

  // NEW: dữ liệu hiển thị theo tab (Seller / Total)
  const normalizedView = useMemo(() => {
    const len = dayKeys.length;
    if (reportScope === 'total') {
      const agg = buildAggregateReport(normalized, len);
      return Object.keys(agg).length ? { 'All Sellers': agg } : {};
    }
    return normalized;
  }, [normalized, dayKeys.length, reportScope]);

  // ----- build data cho bảng -----
  const dataSource = useMemo(() => {
    const rows = [];

    Object.entries(normalizedView).forEach(([seller, r]) => {
      const taxArr = r.revenue.map((_, i) => +(numberSafe(r.itemTax?.[i]) + numberSafe(r.shippingTax?.[i])).toFixed(2));

      // Profit1 = revenue - baseCost - fee
      const profit1 = r.profit1 ?? r.revenue.map((v, i) => +(numberSafe(v) - numberSafe(r.baseCost[i]) - numberSafe(r.fee[i])).toFixed(2));

      // Profit2 = Profit1 - ads - opCost - refund
      const profit2 =
        r.profit2 ??
        r.revenue.map(
          (v, i) =>
            +(
              numberSafe(v) -
              numberSafe(r.baseCost[i]) -
              numberSafe(r.fee[i]) -
              numberSafe(r.ads[i]) -
              numberSafe(r.opCost[i]) -
              numberSafe(r.refund[i])
            ).toFixed(2)
        );

      const roiArr = r.ads.map((ad, i) => (numberSafe(ad) > 0 ? +((numberSafe(profit2[i]) / numberSafe(ad)) * 100).toFixed(2) : null));

      const totals = {
        items: r.totals?.items ?? sum(r.items),
        revenue: r.totals?.revenue ?? sum(r.revenue),
        baseCost: r.totals?.baseCost ?? sum(r.baseCost),
        ads: r.totals?.ads ?? sum(r.ads),
        fee: r.totals?.fee ?? sum(r.fee),
        opCost: r.totals?.opCost ?? sum(r.opCost),
        refund: r.totals?.refund ?? sum(r.refund),
        profit1: r.totals?.profit1 ?? sum(profit1),
        profit2: r.totals?.profit2 ?? sum(profit2),
        itemPromotionDiscount: r.totals?.itemPromotionDiscount ?? sum(r.itemPromotionDiscount || []),
        tax: sum(taxArr),
      };

      // ROI tổng: dùng totals.profit2 / totals.ads
      const totalROI = totals.ads > 0 ? +(((totals.profit2 || 0) / totals.ads) * 100).toFixed(2) : null;

      // Nhóm dòng hiển thị theo seller
      const group = [
        { type: 'Total Order Items', values: r.items, money: false, totalVal: totals.items },
        { type: 'Revenue', values: r.revenue, money: true, totalVal: totals.revenue },
        { type: 'Base cost', values: r.baseCost, money: true, totalVal: totals.baseCost },
        { type: 'Ads spend', values: r.ads, money: true, totalVal: totals.ads },
        { type: 'Fee', values: r.fee, money: true, totalVal: totals.fee },
        { type: 'Tax', values: taxArr, money: true, totalVal: totals.tax },
        {
          type: 'Discount',
          values: r.itemPromotionDiscount || [],
          money: true,
          totalVal: totals.itemPromotionDiscount,
        },
        { type: 'Profit 1', values: profit1, money: true, totalVal: totals.profit1, signAware: true },
        { type: 'Operation Cost', values: r.opCost, money: true, totalVal: totals.opCost },
        { type: 'Refund', values: r.refund, money: true, totalVal: totals.refund },
        { type: 'Profit 2', values: profit2, money: true, totalVal: totals.profit2, signAware: true },
        { type: 'ROI', values: roiArr, percent: true, totalVal: totalROI }, // cuối cùng
      ];

      group.forEach((row, idx) => {
        const isFirstRowOfThisSeller = idx === 0;
        const addSeparator = isFirstRowOfThisSeller && rows.length > 0;

        const record = {
          key: `${seller}-${row.type}`,
          seller,
          type: <span className="font-medium">{row.type}</span>,
          total: row.totalVal,
          _rowSpan: isFirstRowOfThisSeller ? group.length : 0,
          _groupStart: addSeparator,
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

  const columns = [
    {
      title: (
        <span className="font-medium" style={{ color: dataColors.title }}>
          Seller
        </span>
      ),
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
      title: (
        <span className="font-medium" style={{ color: dataColors.title }}>
          Type
        </span>
      ),
      dataIndex: 'type',
      width: 120,
      fixed: 'left',
      onCell: (row) => ({ style: sepStyle(row) }),
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>,
    },
    {
      title: (
        <span className="font-medium" style={{ color: dataColors.title }}>
          Total
        </span>
      ),
      dataIndex: 'total',
      width: 120,
      align: 'right',
      fixed: 'left',
      onHeaderCell: () => ({ style: { borderRight: '2px solid #e5e9eeff' } }),
      onCell: (row) => ({ style: { borderRight: '2px solid #e5e9eeff', ...sepStyle(row) } }),
      render: (val, row) => {
        if (row._percent) {
          if (val === null || typeof val === 'undefined') return <span>-</span>;
          return (
            <span className="font-medium" style={{ color: roiColor(Number(val)) }}>
              {Number(val).toFixed(2)}%
            </span>
          );
        }
        if (row._money) {
          const n = Number(val) || 0;
          const color = row._signAware ? (n > 0 ? dataColors.success : n < 0 ? dataColors.cancelled : '#475569') : undefined;
          return (
            <span className="font-medium" style={{ color }}>
              {$(n)}
            </span>
          );
        }
        return <span className="font-medium">{Number(val)}</span>;
      },
    },
    ...days.map((d, idx) => ({
      title: (
        <span className="font-medium" style={{ color: dataColors.title }}>
          {d}
        </span>
      ),
      dataIndex: dayKeys[idx],
      align: 'right',
      width: 120,
      onCell: (row) => ({ style: sepStyle(row) }),
      render: (val, row) => {
        if (row._percent) {
          if (val === null || typeof val === 'undefined') return '-';
          const p = Number(val) || 0;
          return (
            <span className="font-medium" style={{ color: roiColor(p) }}>
              {p.toFixed(2)}%
            </span>
          );
        }
        const v = Number(val) || 0;
        if (row._money) {
          const color = row._signAware ? (v > 0 ? dataColors.success : v < 0 ? dataColors.cancelled : 'black') : undefined;
          return (
            <span className="font-medium" style={{ color }}>
              {$(v)}
            </span>
          );
        }
        return <span className="font-medium">{v}</span>;
      },
    })),
  ];

  // ----- KPIs tổng trên đầu -----
  const kpis = useMemo(() => {
    const entries = Object.values(normalizedView);
    const totals = entries.map((r) => r.totals).filter(Boolean);
    const get = (key) => (totals.length ? totals.reduce((a, t) => a + numberSafe(t?.[key]), 0) : 0);

    const totalItems = get('items');
    const totalRevenue = get('revenue');
    const totalAds = get('ads');
    const totalProfit2 = get('profit2');
    const baseCost = get('baseCost');
    const totalFee = get('fee');
    const totalTax = entries.reduce((acc, r) => acc + sum(r.itemTax || []) + sum(r.shippingTax || []), 0);

    const totalDiscount = entries.reduce((acc, r) => acc + sum(r.itemPromotionDiscount || []), 0);

    return [
      { key: 'order', label: 'Order Items', value: totalItems, icon: <LuBoxes className="text-white" />, iconBg: 'bg-slate-600' },
      {
        key: 'revenue',
        label: 'Revenue',
        value: totalRevenue,
        prefix: '$',
        icon: <FaMoneyBillWave className="text-white" />,
        iconBg: 'bg-emerald-500',
      },
      {
        key: 'ads',
        label: 'Ads Spend',
        value: totalAds,
        prefix: '$',
        icon: <FaBuysellads className="text-white" />,
        iconBg: 'bg-blue-500',
      },
      {
        key: 'vendor',
        label: 'Base Cost',
        value: baseCost,
        prefix: '$',
        icon: <FaDollarSign className="text-white" />,
        iconBg: 'bg-amber-500',
      },
      {
        key: 'diff',
        label: 'Discount',
        value: totalDiscount,
        prefix: '$',
        icon: <FaPercentage className="text-white" />,
        iconBg: 'bg-violet-500',
      },
      {
        key: 'fee',
        label: 'Amz Fee',
        value: totalFee,
        prefix: '$',
        icon: <FaDolly className="text-white" />,
        iconBg: 'bg-fuchsia-500',
      },
      { key: 'tax', label: 'Tax', value: totalTax, prefix: '$', icon: <FaPercentage className="text-white" />, iconBg: 'bg-orange-500' },
      {
        key: 'profit',
        label: 'Profit',
        value: totalProfit2,
        prefix: '$',
        icon: <FaUser className="text-white" />,
        iconBg: 'bg-emerald-500',
      },
    ];
  }, [normalizedView]);

  const formatNumber = (n) =>
    typeof n === 'number' ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n;

  // $79.10 hoặc -$79.10 (dấu trừ đứng TRƯỚC $)
  const formatMoneySigned = (n) => (Number(n) >= 0 ? `$${formatNumber(Number(n))}` : `-$${formatNumber(Math.abs(Number(n)))}`);

  const IconWrap = ({ bg, children }) => <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>{children}</div>;

  const Card = ({ item }) => {
    const isProfit = item.key === 'profit';
    const isMoney = item.prefix === '$';
    const valNum = typeof item.value === 'number' ? item.value : Number(item.value) || 0;

    let display;
    if (isMoney) {
      display = isProfit ? formatMoneySigned(valNum) : `$${formatNumber(valNum)}`;
    } else {
      display = item.label === 'Order Items' ? valNum : formatNumber(valNum);
    }

    const color = isProfit
      ? valNum > 0
        ? dataColors.success
        : valNum < 0
          ? dataColors.cancelled
          : '#64748b'
      : item.key === 'revenue'
        ? dataColors.success
        : undefined;

    return (
      <div className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3">
          <IconWrap bg={item.iconBg}>{item.icon}</IconWrap>
          <div className="text-slate-600 text-[13px] leading-4 font-medium">{item.label}</div>
        </div>
        <div className="text-right tabular-nums font-semibold" style={{ color }}>
          {display}
        </div>
      </div>
    );
  };

  const fetchAllSellers = async () => {
    if (user?.role === 'Admin') {
      try {
        const res = await getAllSellers();
        if (res.status === 200) {
          const result = res.data?.map((item) => ({
            label: item?.full_name,
            value: item?._id,
          }));
          setSellers(result);
        } else {
          toast.error(res.data?.message || 'Fetch error');
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Unexpected error');
      }
    }
  };

  // ====== EXPORT EXCEL (giữ nguyên logic hiện tại) ======
  const handleExportWeeklyExcel = async () => {
    try {
      const entries = Object.values(normalizedView);
      const sumArr = (a = []) => a.reduce((x, y) => x + (Number.isFinite(+y) ? +y : 0), 0);
      const getTotal = (k) => entries.reduce((acc, r) => acc + numberSafe(r.totals?.[k]), 0);

      const totalOrders = getTotal('items');
      const revenue = getTotal('revenue');
      const baseCost = getTotal('baseCost');
      const adsSpend = getTotal('ads');
      const feeTotal = getTotal('fee');
      const taxTotal = entries.reduce((acc, r) => acc + sumArr(r.itemTax || []) + sumArr(r.shippingTax || []), 0);
      const profitTotal = getTotal('profit2');

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Báo cáo tuần', {
        properties: { defaultRowHeight: 18 },
        views: [{ state: 'frozen', xSplit: 0, ySplit: 14 }],
      });

      const borderThin = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      const fillYellow = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } };
      const fillBlue = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9EEF8' } };
      const moneyFmt = '$#,##0.00;[Red]-$#,##0.00';
      const percentFmt = '0.00%';

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
      set('B2', 'BÁO CÁO DOANH THU TUẦN', { bold: true, size: 18, align: { horizontal: 'center' }, fill: fillYellow, border: borderThin });

      ws.mergeCells('B3', 'I3');
      const fromStr = (filters.from || '').slice(0, 10).split('-').reverse().join('/');
      const toStr = (filters.to || '').slice(0, 10).split('-').reverse().join('/');
      set('B3', `Từ ngày ${fromStr} đến ngày ${toStr}`, { italic: true, color: '0033CC', align: { horizontal: 'center' } });

      set('J3', `Tổng đơn: ${totalOrders}`, { bold: true, align: { horizontal: 'right' } });

      ws.mergeCells('B5', 'I5');
      set('B5', 'Chi phí tuần', { bold: true, align: { horizontal: 'center' }, fill: fillBlue, border: borderThin });

      [
        ['B6', 'Chi phí Vender', baseCost],
        ['B7', 'Chi phí quảng cáo', adsSpend],
        ['B8', 'Chi phí sàn (17%)', feeTotal],
        ['B9', 'Thuế', taxTotal],
      ].forEach(([addr, label, value]) => {
        set(addr, label, { border: borderThin });
        set(`I${addr.slice(1)}`, value, { border: borderThin, numFmt: moneyFmt, align: { horizontal: 'right' } });
      });

      ws.mergeCells('C6', 'H9');
      [
        'C6',
        'D6',
        'E6',
        'F6',
        'G6',
        'H6',
        'C7',
        'D7',
        'E7',
        'F7',
        'G7',
        'H7',
        'C8',
        'D8',
        'E8',
        'F8',
        'G8',
        'H8',
        'C9',
        'D9',
        'E9',
        'F9',
        'G9',
        'H9',
      ].forEach((a) => set(a, '', { border: borderThin }));

      ws.mergeCells('B11', 'I11');
      set('B11', 'Thu nhập tuần', { bold: true, align: { horizontal: 'center' }, fill: fillBlue, border: borderThin });

      set('B12', 'Doanh thu', { border: borderThin });
      set('I12', revenue, { border: borderThin, numFmt: moneyFmt, align: { horizontal: 'right' } });

      set('B13', 'Lợi nhuận', { border: borderThin });
      set('I13', profitTotal, { border: borderThin, numFmt: moneyFmt, align: { horizontal: 'right' } });

      ws.mergeCells('C12', 'H13');
      ['C12', 'D12', 'E12', 'F12', 'G12', 'H12', 'C13', 'D13', 'E13', 'F13', 'G13', 'H13'].forEach((a) =>
        set(a, '', { border: borderThin })
      );

      const startRow = 15;
      const col = { seller: 2, type: 3, total: 4, firstDay: 5 };
      const headerRow = ws.getRow(startRow);
      ['Seller', 'Type', 'Total', ...days].forEach((h, i) => {
        const cell = headerRow.getCell(col.seller + i);
        cell.value = h;
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center' };
        cell.border = borderThin;
      });
      ws.getColumn(col.seller).width = 18;
      ws.getColumn(col.type).width = 16;
      ws.getColumn(col.total).width = 14;
      days.forEach((_, i) => (ws.getColumn(col.firstDay + i).width = 12));

      let rIdx = startRow + 1;

      Object.entries(normalizedView).forEach(([seller, r], sIdx) => {
        const taxArr = (r.itemTax || []).map((_, i) => +(numberSafe(r.itemTax?.[i]) + numberSafe(r.shippingTax?.[i])).toFixed(2));
        const taxTotalSeller = sumArr(taxArr);
        const group = [
          { label: 'Total Orders', values: r.items || [], total: r.totals?.items, money: false },
          { label: 'Revenue', values: r.revenue || [], total: r.totals?.revenue, money: true },
          { label: 'Base cost', values: r.baseCost || [], total: r.totals?.baseCost, money: true },
          { label: 'Ads spend', values: r.ads || [], total: r.totals?.ads, money: true },
          { label: 'Fee', values: r.fee || [], total: r.totals?.fee, money: true },
          { label: 'Tax', values: taxArr, total: taxTotalSeller, money: true },
          {
            label: 'Discount',
            values: r.itemPromotionDiscount || [],
            total: sumArr(r.itemPromotionDiscount || []),
            money: true,
          },
          { label: 'Profit 1', values: r.profit1 || [], total: r.totals?.profit1, money: true, signAware: true },
          { label: 'Operation Cost', values: r.opCost || [], total: r.totals?.opCost, money: true },
          { label: 'Refund', values: r.refund || [], total: r.totals?.refund, money: true },
          { label: 'Profit 2', values: r.profit2 || [], total: r.totals?.profit2, money: true, signAware: true },
          {
            label: 'ROI',
            values: r.roi || [],
            total: r.totals?.roi ?? (r.totals?.ads > 0 ? r.totals?.profit2 / r.totals?.ads : null),
            percent: true,
          },
        ];

        const groupLen = group.length;
        if (groupLen > 1) ws.mergeCells(rIdx, col.seller, rIdx + groupLen - 1, col.seller);
        group.forEach((rowObj, idx) => {
          const row = ws.getRow(rIdx);

          if (idx === 0) {
            const cSeller = row.getCell(col.seller);
            cSeller.value = seller;
            cSeller.font = { bold: true };
            cSeller.border = borderThin;
          }

          const cType = row.getCell(col.type);
          cType.value = rowObj.label;
          cType.border = borderThin;

          const cTotal = row.getCell(col.total);
          cTotal.value = rowObj.total ?? (rowObj.percent ? null : 0);
          cTotal.alignment = { horizontal: 'right' };
          cTotal.border = borderThin;
          if (rowObj.money) cTotal.numFmt = moneyFmt;
          if (rowObj.percent) cTotal.numFmt = percentFmt;
          if (rowObj.signAware && typeof cTotal.value === 'number') {
            cTotal.font = { color: { argb: cTotal.value >= 0 ? '008000' : 'FF0000' }, bold: true };
          }

          days.forEach((_, i) => {
            const c = row.getCell(col.firstDay + i);
            const v = rowObj.values?.[i];
            c.value = rowObj.percent ? (v == null ? null : Number(v)) : Number(v || 0);
            c.alignment = { horizontal: 'right' };
            c.border = borderThin;
            if (rowObj.money) c.numFmt = moneyFmt;
            if (rowObj.percent) c.numFmt = percentFmt;
            if (rowObj.signAware && typeof c.value === 'number') {
              c.font = { color: { argb: c.value >= 0 ? '008000' : 'FF0000' }, bold: true };
            }
          });

          rIdx++;
        });

        if (sIdx < Object.keys(normalizedView).length - 1) {
          ws.getRow(rIdx).height = 6;
          rIdx++;
        }
      });

      const buf = await wb.xlsx.writeBuffer();
      const filename = `Bao_cao_doanh_thu_tuan_${filters.from?.slice(0, 10)}_to_${filters.to?.slice(0, 10)}.xlsx`;
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
        const result = res.data?.data?.map((item) => ({
          label: item?.name,
          value: item?._id,
        }));
        setTeams(result);
      } else {
        toast.error(res.data?.message || 'Fetch error');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unexpected error');
    }
  };

  useEffect(() => {
    fetchAllTeams();
  }, []);

  useEffect(() => {
    fetchAllSellers();
  }, []);

  // ----- fetch & filter -----
  useEffect(() => {
    fetchAllReport(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.seller, filters.team]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Sale Report
          </h1>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={handleExportWeeklyExcel}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Export Report
              </span>
              <div style={{ color: 'black' }}>
                <BiSolidFileExport size={15} />
              </div>
            </button>

            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setOpenModalImportRefund(true)}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Import Refund
              </span>
              <div style={{ color: 'black' }}>
                <LuImport size={15} />
              </div>
            </button>

            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setOpenModalImportReport(true)}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Import Report
              </span>
              <div style={{ color: 'black' }}>
                <LuImport size={15} />
              </div>
            </button>

            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => setOpenModalImportAds(true)}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Import Ads
              </span>
              <div style={{ color: 'black' }}>
                <LuImport size={15} />
              </div>
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
        <div className="flex items-center gap-4 w-full">
          <div className="w-full">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {kpis.map((it) => (
                <Card key={it.key || it.label} item={it} />
              ))}
            </div>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <div className="flex gap-2 items-center">
              {/* NEW: Tabs Seller/Total */}

              {/* Chỉ show select seller khi đang ở tab seller */}
              {reportScope === 'seller' && (
                <SelectSeller
                  title="Report By Seller"
                  ListData={sellers}
                  value={selectSeller}
                  onChange={(val) => {
                    setSelectSeller(val);
                    updateFilter({ seller: val });
                  }}
                />
              )}

              {/* Team vẫn cho chọn ở cả 2 tab.
                  - Seller tab: lọc theo team nhưng vẫn hiển thị từng seller trong team
                  - Total tab: tổng hợp team => All Sellers (team) */}
              <SelectSeller
                title="Team"
                ListData={teams}
                value={selectTeam}
                onChange={(val) => {
                  updateFilter({ team: val });
                  setSelectTeam(val);
                }}
              />

              <Tooltip title="Refresh">
                <button
                  className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                  onClick={() => {
                    fetchAllReport(filters);
                    toast.success('Refresh success!');
                  }}
                >
                  <MdOutlineRefresh size={20} />
                </button>
              </Tooltip>

              {/* Toggle Table / Charts */}
              {user?.role === 'Admin' && (
                <Segmented
                  size={'middle'}
                  shape="round"
                  options={[
                    { value: 'table', icon: <TableOutlined /> },
                    { value: 'chart', icon: <BarChartOutlined /> },
                  ]}
                  onChange={(value) => setViewMode(value)}
                />
              )}
            </div>
          </div>
          <Segmented
            size="middle"
            shape="round"
            value={reportScope}
            options={[
              { label: 'Report By Seller', value: 'seller' },
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
              scroll={{ x: 'max-content' }}
              loading={loading}
            />
          ) : (
            <SaleReportCharts
              days={days}
              normalized={normalizedView}
              sellerFilter={reportScope === 'total' ? '' : filters.seller}
              loading={loading}
            />
          )}
        </div>
      </div>

      <ModalReport
        isModalOpen={openModalImportReport}
        setIsModalOpen={setOpenModalImportReport}
        fetchAllReport={fetchAllReport}
        filters={filters}
      />
      <ModalRefund
        isModalOpen={openModalImportRefund}
        setIsModalOpen={setOpenModalImportRefund}
        fetchAllReport={fetchAllReport}
        filters={filters}
      />
      <ModalAds isModalOpen={openModalImportAds} setIsModalOpen={setOpenModalImportAds} fetchAllReport={fetchAllReport} filters={filters} />
    </div>
  );
};

export default SaleReport;
