import { useOutletContext } from 'react-router-dom';
import { dataColors } from '../../utils/dataColors';
import DateRangePicker from '../../components/DateRangePicker';
import SelectFilter from '../../components/SelectFilter';
import { Table } from 'antd';
import { LuBoxes } from 'react-icons/lu';
import { FaSackDollar, FaArrowTrendUp, FaMoneyBillWave } from 'react-icons/fa6';
import { eachDayOfInterval, format, subDays } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { getAllReport } from '../../apis/report';
import { toast } from 'sonner';
import { defaultFrom, defaultTo } from '../../utils/fomatDate';

const today = new Date();

// helpers
const numberSafe = (v) => (Number.isFinite(v) ? Number(v) : 0);
const sum = (arr = []) => arr.reduce((a, b) => a + numberSafe(b), 0);
const $ = (n) => (n >= 0 ? `$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`);
const roiColor = (v) => (v > 0 ? dataColors.success : v < 0 ? dataColors.cancelled : 'default');
const fitToLen = (arr = [], len) => {
  if (arr.length === len) return arr;
  const clipped = arr.slice(0, len);
  if (clipped.length < len) return [...clipped, ...Array(len - clipped.length).fill(0)];
  return clipped;
};

const SaleReport = () => {
  const { collapsed } = useOutletContext();
  const [reportBySeller, setReportBySeller] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
  });
  const [days, setDays] = useState([]);

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
      const response = await getAllReport(params);
      if (response.status === 200) {
        setReportBySeller(response.data?.data);
        setDays(response.data?.date);
      } else {
        toast.error(response.data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  // 7 ngày mặc định

  const dayKeys = days.map((d) => d.replace(/-/g, '_'));

  // Chuẩn hoá theo số cột ngày
  const normalized = useMemo(() => {
    const len = dayKeys.length;
    const out = {};
    Object.entries(reportBySeller || {}).forEach(([seller, r]) => {
      out[seller] = {
        ...r,
        fee: fitToLen(r.fee, len),
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

  // Build data cho bảng
  const dataSource = useMemo(() => {
    const rows = [];

    Object.entries(normalized).forEach(([seller, r]) => {
      const profit1 = r.profit1 ?? r.revenue.map((v, i) => +(numberSafe(v) - numberSafe(r.baseCost[i]) - numberSafe(r.fee[i])).toFixed(2));

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

      const roiArr = r.revenue.map((_, i) => {
        const denom = numberSafe(r.ads[i]) + numberSafe(r.baseCost[i]);
        return denom ? +((numberSafe(profit1[i]) / denom) * 100).toFixed(2) : 0;
      });

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

      const totalROI = totals.baseCost + totals.ads > 0 ? +(((totals.profit1 || 0) / (totals.baseCost + totals.ads)) * 100).toFixed(2) : 0;

      const group = [
        { type: 'Total Items', values: r.items, totalVal: totals.items },
        { type: 'Revenue', values: r.revenue, money: true, totalVal: totals.revenue },
        { type: 'Base cost', values: r.baseCost, money: true, totalVal: totals.baseCost },
        { type: 'Ads spend', values: r.ads, money: true, totalVal: totals.ads },
        { type: 'Fee', values: r.fee, money: true, totalVal: totals.fee },
        { type: 'Profit 1', values: profit1, money: true, totalVal: totals.profit1 },
        { type: 'ROI', values: roiArr, percent: true, totalVal: totalROI },
        { type: 'Operation Cost', values: r.opCost, money: true, totalVal: totals.opCost },
        { type: 'Refund', values: r.refund, money: true, totalVal: totals.refund },
        { type: 'Profit 2', values: profit2, money: true, totalVal: totals.profit2 },
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
        };

        dayKeys.forEach((k, i) => (record[k] = numberSafe(row.values[i])));
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
        if (row._percent) {
          return (
            <span className="font-medium" style={{ color: roiColor(val) }}>
              {Number(val).toFixed(2)}%
            </span>
          );
        }
        if (row._money) return <span className="font-medium">{$(Number(val))}</span>;
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
        const v = Number(val) || 0;
        if (row._percent) {
          return v === 0 ? (
            '-'
          ) : (
            <span className="font-medium" style={{ color: roiColor(v) }}>
              {v.toFixed(2)}%
            </span>
          );
        }
        if (row._money) return <span className="font-medium">{$(v)}</span>;
        return <span className="font-medium">{v}</span>;
      },
    })),
  ];

  // KPIs tổng trên đầu (cộng theo totals của từng seller)
  const kpis = useMemo(() => {
    const totals = Object.values(normalized)
      .map((r) => r.totals)
      .filter(Boolean);
    const get = (key) => (totals.length ? totals.reduce((a, t) => a + numberSafe(t?.[key]), 0) : 0);

    const totalItems = get('items');
    const totalRevenue = get('revenue');
    const totalBase = get('baseCost');
    const totalAds = get('ads');
    const totalProfit1 = get('profit1');
    const totalProfit2 = get('profit2');
    const roi = totalBase + totalAds > 0 ? +((totalProfit1 / (totalBase + totalAds)) * 100).toFixed(2) : 0;

    return { totalItems, totalRevenue, roi, totalProfit2 };
  }, [normalized]);

  useEffect(() => {
    fetchAllReport(filters);
  }, [filters]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Sale Report
          </h1>
          <div className="flex justify-center items-center">
            <DateRangePicker
              mode="range"
              showOutsideDays
              modifiersClassNames={{ selected: 'my-selected', range_middle: 'my-range-middle' }}
              modifiersStyles={{ range_middle: { backgroundColor: '#f3f4f6', fontWeight: 'normal' } }}
              updateFilter={updateFilter}
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
                <span className="text-xl font-bold" style={{ color: dataColors.pending }}>
                  {kpis.roi}%
                </span>
              </div>
              <FaArrowTrendUp size={25} color={dataColors.pending} />
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
            <div className="flex gap-2 items-center ">
              <SelectFilter title="Report By Seller" ListData={Object.keys(reportBySeller)} />
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
    </div>
  );
};

export default SaleReport;
