import { useOutletContext } from 'react-router-dom';
import { dataColors } from '../../utils/dataColors';
import DateRangePicker from '../../components/DateRangePicker';
import { Table } from 'antd';
import { LuBoxes } from 'react-icons/lu';
import { FaSackDollar, FaArrowTrendUp, FaMoneyBillWave, FaArrowTrendDown } from 'react-icons/fa6';
import { LuImport } from 'react-icons/lu';
import { useEffect, useMemo, useState } from 'react';
import { getAllReport } from '../../apis/report';
import { toast } from 'sonner';
import { defaultFrom, defaultTo } from '../../utils/fomatDate';
import ModalReport from './ModalReport';
import ModalAds from './ModalAds';
import { getAllSellers } from '../../apis/user';
import { useAuth } from '../../context/AuthContext';
import SelectSeller from '../../components/SelectSeller';

// ---------- helpers ----------
const numberSafe = (v) => (Number.isFinite(+v) ? +v : 0);
const sum = (arr = []) => arr.reduce((a, b) => a + numberSafe(b), 0);
const $ = (n) => (n >= 0 ? `$${Number(n).toFixed(2)}` : `-$${Math.abs(Number(n)).toFixed(2)}`);
// ROI threshold 60%
const roiColor = (percent) => (percent >= 60 ? dataColors.success : dataColors.cancelled);
const roiIcon = (percent) =>
  percent >= 60 ? <FaArrowTrendUp size={25} color={dataColors.success} /> : <FaArrowTrendDown size={25} color={dataColors.cancelled} />;
const fitToLen = (arr = [], len) => {
  if (arr.length === len) return arr;
  const clipped = arr.slice(0, len);
  if (clipped.length < len) return [...clipped, ...Array(len - clipped.length).fill(0)];
  return clipped;
};

const SaleReport = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();
  const [reportBySeller, setReportBySeller] = useState({});
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState([]);
  const [openModalImportReport, setOpenModalImportReport] = useState(false);
  const [openModalImportAds, setOpenModalImportAds] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [selectSeller, setSelectSeller] = useState();
  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
    seller: '', // '' = all
  });
  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
      page: newValues.page || Object.prototype.hasOwnProperty.call(newValues, 'page') ? newValues.page : 1,
    }));
  };

  const fetchAllReport = async (params) => {
    setLoading(true);
    try {
      const res = await getAllReport(params); // backend phải nhận {from,to,seller}
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
        opCost: fitToLen(r.opCost, len), // lấy từ import
        refund: fitToLen(r.refund, len),
        items: fitToLen(r.items, len),
        revenue: fitToLen(r.revenue, len),
        baseCost: fitToLen(r.baseCost, len),
        ads: fitToLen(r.ads, len), // lấy từ import
        profit1: r.profit1 ? fitToLen(r.profit1, len) : undefined,
        profit2: r.profit2 ? fitToLen(r.profit2, len) : undefined,
      };
    });
    return out;
  }, [reportBySeller, dayKeys.length]);

  // ----- build data cho bảng -----
  const dataSource = useMemo(() => {
    const rows = [];

    Object.entries(normalized).forEach(([seller, r]) => {
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
      };

      // 2) ROI tổng: dùng totals.profit2 / totals.ads
      const totalROI = totals.ads > 0 ? +(((totals.profit2 || 0) / totals.ads) * 100).toFixed(2) : null;

      // 👉 ROI chuyển xuống cuối nhóm
      const group = [
        { type: 'Total Items', values: r.items, totalVal: totals.items },
        { type: 'Revenue', values: r.revenue, money: true, totalVal: totals.revenue },
        { type: 'Base cost', values: r.baseCost, money: true, totalVal: totals.baseCost },
        { type: 'Ads spend', values: r.ads, money: true, totalVal: totals.ads },
        { type: 'Fee', values: r.fee, money: true, totalVal: totals.fee },
        // hai hàng Profit có bật signAware để tô màu theo âm/dương
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
  }, [normalized, dayKeys]);

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
        // ROI total có thể null nếu Ads tổng = 0
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
        // ROI theo ngày
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
          const color = row._signAware ? (v > 0 ? dataColors.success : v < 0 ? dataColors.cancelled : '#475569') : undefined;
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
    const totals = Object.values(normalized)
      .map((r) => r.totals)
      .filter(Boolean);
    const get = (key) => (totals.length ? totals.reduce((a, t) => a + numberSafe(t?.[key]), 0) : 0);

    const totalItems = get('items');
    const totalRevenue = get('revenue');
    const totalAds = get('ads');
    const totalProfit2 = get('profit2');

    // KPI ROI = Profit2 / Ads
    const roiNum = totalAds > 0 ? +((totalProfit2 / totalAds) * 100).toFixed(2) : 0;

    return { totalItems, totalRevenue, roiNum, totalProfit2 };
  }, [normalized]);

  const fetchAllSellers = async () => {
    if (user?.role === 'Admin') {
      try {
        const res = await getAllSellers();
        if (res.status === 200) {
          const result = res.data?.map((item) => {
            return {
              label: item?.full_name,
              value: item?._id,
            };
          });
          setSellers(result);
        } else {
          toast.error(res.data?.message || 'Fetch error');
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Unexpected error');
      }
    }
  };

  useEffect(() => {
    fetchAllSellers();
  }, []);

  // ----- fetch & filter -----
  useEffect(() => {
    fetchAllReport(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.seller]);

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
        <div className="flex justify-between items-center">
          <div className="w-[24%] border border-[#e2e8f0] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Total Items</div>
                <span className="text-xl font-bold" style={{ color: dataColors.process }}>
                  {kpis.totalItems}
                </span>
              </div>
              <LuBoxes size={25} color={dataColors.process} />
            </div>
          </div>

          <div className="w-[24%] border border-[#e2e8f0] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Revenue</div>
                <span className="text-xl font-bold" style={{ color: dataColors.success }}>
                  {$(+kpis.totalRevenue)}
                </span>
              </div>
              <FaSackDollar size={25} color={dataColors.success} />
            </div>
          </div>

          <div className="w-[24%] border border-[#e2e8f0] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">ROI</div>
                <span className="text-xl font-bold" style={{ color: roiColor(kpis.roiNum) }}>
                  {kpis.roiNum}%
                </span>
              </div>
              {roiIcon(kpis.roiNum)}
            </div>
          </div>

          <div className="w-[24%] border border-[#e2e8f0] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Profit</div>
                <span className="text-xl font-bold" style={{ color: dataColors.success }}>
                  {$(+kpis.totalProfit2)}
                </span>
              </div>
              <FaMoneyBillWave size={25} color={dataColors.success} />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <div className="flex gap-2 items-center">
              <SelectSeller
                title="Report By Seller"
                ListData={sellers}
                value={selectSeller}
                onChange={(val) => {
                  setSelectSeller(val);
                  updateFilter({ seller: val });
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="key"
            bordered
            pagination={false}
            scroll={{ x: 'max-content' }}
            loading={loading}
          />
        </div>
      </div>

      <ModalReport
        isModalOpen={openModalImportReport}
        setIsModalOpen={setOpenModalImportReport}
        fetchAllReport={fetchAllReport}
        filters={filters}
      />
      <ModalAds isModalOpen={openModalImportAds} setIsModalOpen={setOpenModalImportAds} fetchAllReport={fetchAllReport} filters={filters} />
    </div>
  );
};

export default SaleReport;
