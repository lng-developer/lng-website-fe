import { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { Tabs } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import {
  buildEtsyDailyAggregate,
  buildLineSeries,
  buildRoiLineSeries,
  buildRoaLineSeries,
  buildEtsyShopTotals,
  pickTickValues,
  numberSafe,
} from './etsy.chartAdapters';

const money = (n) => {
  const v = numberSafe(n);
  if (!Number.isFinite(v)) return '$0';
  return v >= 0 ? `$${v.toFixed(1)}` : `-$${Math.abs(v).toFixed(1)}`;
};

function ChartCard({ title, children }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="text-slate-700 text-[13px] leading-4 font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}

export default function EtsySaleReportCharts({ days, normalized, loading }) {
  const tickValues = useMemo(() => pickTickValues(days, 10), [days]);

  const dailyAgg = useMemo(
    () => buildEtsyDailyAggregate({ normalized, days }),
    [normalized, days]
  );

  // Line chart: Revenue / Profit 2 / Offsite Ads theo ngày
  const trendSeries = useMemo(
    () =>
      buildLineSeries({
        days,
        dailyAgg,
        metrics: [
          { id: 'Revenue',     key: 'revenue'    },
          { id: 'Profit',      key: 'profit2'    },
          { id: 'Offsite Ads', key: 'offsiteAds' },
        ],
      }),
    [days, dailyAgg]
  );

  // Line chart: chi phí đang có trong Etsy report.
  const etsyFeeSeries = useMemo(
    () =>
      buildLineSeries({
        days,
        dailyAgg,
        metrics: [
          { id: 'Fee (21%)', key: 'fee' },
          { id: 'Tax', key: 'tax' },
        ],
      }),
    [days, dailyAgg]
  );

  // Cost breakdown stacked bar theo ngày
  const costStack = useMemo(() => {
    const safeDays = Array.isArray(days) ? days : [];
    return safeDays.map((d, i) => ({
      date:           d,
      'Base Cost':    +(dailyAgg?.baseCost?.[i]       || 0).toFixed(2),
      'Fee (21%)':    +(dailyAgg?.fee?.[i]            || 0).toFixed(2),
      'Offsite Ads':  +(dailyAgg?.offsiteAds?.[i]     || 0).toFixed(2),
      'Tax':          +(dailyAgg?.tax?.[i]             || 0).toFixed(2),
    }));
  }, [days, dailyAgg]);

  const roiSeries = useMemo(() => buildRoiLineSeries({ days, dailyAgg }), [days, dailyAgg]);
  const roaSeries = useMemo(() => buildRoaLineSeries({ days, dailyAgg }), [days, dailyAgg]);

  const shopTotals = useMemo(() => buildEtsyShopTotals(normalized), [normalized]);

  // Tabs so sánh shop
  const metricTabs = useMemo(
    () => [
      { key: 'profit',      label: 'Profit',      field: 'Profit',     format: 'money',   posColor: '#10b981' },
      { key: 'offsiteAds',  label: 'Offsite Ads', field: 'OffsiteAds', format: 'money',   posColor: '#f97316' },
      { key: 'revenue',     label: 'Revenue',     field: 'Revenue',    format: 'money',   posColor: '#3b82f6' },
    ],
    []
  );

  const formatSigned = (raw, format) => {
    if (raw == null) return 'N/A';
    if (format === 'percent') return `${Number(raw).toFixed(2)}%`;
    return money(raw);
  };

  const buildRankData = (field) => {
    const arr = (shopTotals || []).map((r) => {
      const raw = r?.[field];
      const rawNum = raw == null ? null : numberSafe(raw);
      return {
        seller:   r.seller,
        rawValue: rawNum,
        value:    rawNum == null ? 0 : Math.abs(rawNum),
      };
    });
    arr.sort((a, b) => {
      const av = a.rawValue == null ? -Infinity : a.rawValue;
      const bv = b.rawValue == null ? -Infinity : b.rawValue;
      return bv - av;
    });
    return arr;
  };

  const maxAbsValue = (data) => Math.max(0, ...(data || []).map((d) => numberSafe(d.value)));

  const lineColors = ({ id }) => {
    const map = {
      Revenue:          '#3b82f6',
      Profit:           '#10b981',
      'Offsite Ads':    '#f97316',
      Orders:           '#a855f7',
      'Fee (21%)':      '#06b6d4',
      Tax:              '#f59e0b',
    };
    return map[id] || '#64748b';
  };

  const costStackKeys   = ['Base Cost', 'Fee (21%)', 'Offsite Ads', 'Tax'];
  const costStackColors = ({ id }) => {
    const map = {
      'Base Cost':   '#3b82f6',
      'Fee (21%)':   '#06b6d4',
      'Offsite Ads': '#f97316',
      'Tax':         '#f59e0b',
    };
    return map[id] || '#64748b';
  };

  const hasDays = Array.isArray(days) && days.length > 0;
  const hasData = normalized && Object.keys(normalized).length > 0;

  if (loading) {
    return (
      <div className="px-3 py-3 flex flex-row items-center justify-center gap-2">
        <LoadingOutlined /> Loading ...
      </div>
    );
  }

  if (!hasDays || !hasData) {
    return (
      <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">
        No data to visualize.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-3">
      {/* ── Shop Comparison (bar) ── */}
      <div className="col-span-12">
        <ChartCard title="Seller Comparison">
          <div style={{ height: 400 }}>
            <Tabs
              defaultActiveKey="profit"
              items={metricTabs.map((t) => {
                const rankData  = buildRankData(t.field);
                const chartData = [...rankData].reverse();
                const maxV      = maxAbsValue(chartData);
                return {
                  key:   t.key,
                  label: <span className="font-medium">{t.label}</span>,
                  children: (
                    <div style={{ height: 340 }}>
                      <ResponsiveBar
                        data={chartData}
                        keys={['value']}
                        indexBy="seller"
                        layout="horizontal"
                        margin={{ top: 10, right: 20, bottom: 30, left: 150 }}
                        padding={0.25}
                        enableLabel={false}
                        minValue={0}
                        maxValue={maxV || 'auto'}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        enableGridY={false}
                        enableGridX={true}
                        colors={({ data }) => (numberSafe(data.rawValue) < 0 ? '#ef4444' : t.posColor)}
                        axisLeft={{ tickSize: 0, tickPadding: 10 }}
                        axisBottom={{
                          tickSize:    0,
                          tickPadding: 6,
                          format: (v) =>
                            t.format === 'percent' ? `${Number(v).toFixed(0)}%` : money(v),
                        }}
                        tooltip={({ indexValue, data }) => (
                          <div className="min-w-36 bg-white border border-slate-200 rounded px-3 py-2 text-xs shadow">
                            <div className="font-semibold text-slate-800">{String(indexValue)}</div>
                            <div className="mt-1 text-slate-900">{formatSigned(data.rawValue, t.format)}</div>
                          </div>
                        )}
                      />
                    </div>
                  ),
                };
              })}
            />
          </div>
        </ChartCard>
      </div>

      {/* ── Revenue / Profit / Offsite Ads trend ── */}
      <div className="col-span-12">
        <ChartCard title="Revenue / Profit 2 / Offsite Ads">
          <div style={{ height: 340 }}>
            <ResponsiveLine
              data={trendSeries}
              margin={{ top: 10, right: 20, bottom: 55, left: 70 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
              axisBottom={{
                tickValues,
                tickSize:       0,
                tickPadding:    6,
                legendOffset:   45,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize:       0,
                tickPadding:    9,
                legendOffset:   -55,
                legendPosition: 'middle',
                format:         (v) => money(v),
              }}
              legends={[{
                anchor:      'right',
                direction:   'column',
                itemHeight:  20,
                itemWidth:   100,
                toggleSerie: true,
                translateY:  -100,
              }]}
              enablePoints={true}
              enableGridX={false}
              enableGridY={true}
              enableSlices="x"
              sliceTooltip={({ slice }) => (
                <div className="bg-white border border-slate-200 rounded px-3 py-2 text-xs shadow">
                  <div className="text-center mb-3 font-medium">{slice.points[0].data.x}</div>
                  {slice.points
                    .slice()
                    .sort((a, b) => String(a.serieId).localeCompare(String(b.serieId)))
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                          <span className="inline-block" style={{ width: 10, height: 10, background: p.color, borderRadius: 2 }} />
                          <span className="text-slate-700 whitespace-nowrap">{String(p.id.split('.')[0])}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{money(p.data.y)}</span>
                      </div>
                    ))}
                </div>
              )}
              colors={lineColors}
              useMesh
            />
          </div>
        </ChartCard>
      </div>

      {/* ── Daily Cost Breakdown (stacked bar) ── */}
      <div className="col-span-12">
        <ChartCard title="Daily Cost Breakdown">
          <div style={{ height: 360 }}>
            <ResponsiveBar
              data={costStack}
              keys={costStackKeys}
              indexBy="date"
              margin={{ top: 10, right: 160, bottom: 70, left: 70 }}
              padding={0.2}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={costStackColors}
              enableLabel={false}
              axisBottom={{
                tickValues,
                tickSize:       0,
                tickPadding:    6,
                legendOffset:   60,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize:       0,
                tickPadding:    6,
                legendOffset:   -55,
                legendPosition: 'middle',
                format:         (v) => money(v),
              }}
              enableGridX={false}
              enableGridY={true}
              legends={[{
                dataFrom:    'keys',
                anchor:      'right',
                direction:   'column',
                itemHeight:  20,
                itemWidth:   120,
                translateX:  150,
                symbolSize:  12,
              }]}
              tooltip={({ id, value, indexValue }) => (
                <div className="bg-white border border-slate-200 rounded px-3 py-2 text-xs shadow">
                  <div className="font-semibold text-slate-800">{String(id)}</div>
                  <div className="text-slate-600">{String(indexValue)}</div>
                  <div className="mt-1 text-slate-900">{money(value)}</div>
                </div>
              )}
            />
          </div>
        </ChartCard>
      </div>

      {/* ── Etsy Fee Breakdown (line) ── */}
      <div className="col-span-12">
        <ChartCard title="Etsy Fee and Tax Trend">
          <div style={{ height: 300 }}>
            <ResponsiveLine
              data={etsyFeeSeries}
              margin={{ top: 10, right: 20, bottom: 55, left: 70 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
              axisBottom={{
                tickValues,
                tickSize:       0,
                tickPadding:    6,
                legendOffset:   45,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize:       0,
                tickPadding:    9,
                legendOffset:   -55,
                legendPosition: 'middle',
                format:         (v) => money(v),
              }}
              legends={[{
                anchor:      'right',
                direction:   'column',
                itemHeight:  20,
                itemWidth:   130,
                toggleSerie: true,
                translateY:  -80,
              }]}
              enablePoints={true}
              enableGridX={false}
              enableGridY={true}
              enableSlices="x"
              sliceTooltip={({ slice }) => (
                <div className="bg-white border border-slate-200 rounded px-3 py-2 text-xs shadow">
                  <div className="text-center mb-3 font-medium">{slice.points[0].data.x}</div>
                  {slice.points
                    .slice()
                    .sort((a, b) => String(a.serieId).localeCompare(String(b.serieId)))
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                          <span className="inline-block" style={{ width: 10, height: 10, background: p.color, borderRadius: 2 }} />
                          <span className="text-slate-700 whitespace-nowrap">{String(p.id.split('.')[0])}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{money(p.data.y)}</span>
                      </div>
                    ))}
                </div>
              )}
              colors={lineColors}
              useMesh
            />
          </div>
        </ChartCard>
      </div>

      {/* ── ROI & ROA trends ── */}
      <div className="col-span-6">
        <ChartCard title="ROI Trend (Profit / Offsite Ads × 100)">
          <div style={{ height: 300 }}>
            <ResponsiveLine
              data={roiSeries}
              colors="#10b981"
              margin={{ top: 10, right: 20, bottom: 55, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
              axisBottom={{
                tickValues,
                tickSize:       0,
                tickPadding:    6,
                legend:         'Date',
                legendOffset:   45,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize:       0,
                tickPadding:    6,
                legendOffset:   -45,
                legendPosition: 'middle',
                format:         (v) => `${Number(v).toFixed(0)}%`,
              }}
              enablePoints={true}
              enableGridX={false}
              enableGridY={true}
              useMesh
            />
          </div>
        </ChartCard>
      </div>

      <div className="col-span-6">
        <ChartCard title="ROA Trend (Revenue / Offsite Ads × 100)">
          <div style={{ height: 300 }}>
            <ResponsiveLine
              data={roaSeries}
              colors="#3b82f6"
              margin={{ top: 10, right: 20, bottom: 55, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
              axisBottom={{
                tickValues,
                tickSize:       0,
                tickPadding:    6,
                legend:         'Date',
                legendOffset:   45,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize:       0,
                tickPadding:    6,
                legendOffset:   -45,
                legendPosition: 'middle',
                format:         (v) => `${Number(v).toFixed(0)}%`,
              }}
              enablePoints={true}
              enableGridX={false}
              enableGridY={true}
              useMesh
            />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
