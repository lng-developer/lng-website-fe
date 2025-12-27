import { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import {
  buildDailyAggregate,
  buildLineSeries,
  buildRoiLineSeries,
  buildCostStackByDay,
  buildSellerTotals,
  pickTickValues,
  numberSafe,
} from './saleReport.chartAdapters';

const money = (n) => {
  const v = numberSafe(n);
  if (!Number.isFinite(v)) return '$0';
  return v >= 0 ? `$${v}` : `-$${Math.abs(v).toFixed(1)}`;
};

function ChartCard({ title, children }) {
  // Dùng style card giống các khối “white + border” đang có trên trang
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="text-slate-700 text-[13px] leading-4 font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}

export default function SaleReportCharts({ days, normalized, sellerFilter, loading }) {
  const tickValues = useMemo(() => pickTickValues(days, 10), [days]);

  const dailyAgg = useMemo(() => buildDailyAggregate({ normalized, days, sellerFilter }), [normalized, days, sellerFilter]);

  const trendSeries = useMemo(
    () =>
      buildLineSeries({
        days,
        dailyAgg,
        metrics: [
          { id: 'Revenue', key: 'revenue' },
          { id: 'Profit', key: 'profit2' },
          { id: 'Ads', key: 'ads' },
        ],
      }),
    [days, dailyAgg]
  );

  const gridYValuesChart1 = useMemo(() => {
    let gridStep = 500;
    const ys = trendSeries.flatMap((s) => s.data.map((p) => Number(p.y) || 0));
    const min = Math.min(...ys);
    const max = Math.max(...ys);

    const start = Math.floor(min / gridStep) * gridStep;
    const end = Math.ceil(max / gridStep) * gridStep;

    const arr = [];
    for (let v = start; v <= end; v += gridStep) arr.push(v);
    return arr;
  }, [trendSeries]);
  const roiSeries = useMemo(() => buildRoiLineSeries({ days, dailyAgg }), [days, dailyAgg]);

  const costStack = useMemo(() => buildCostStackByDay({ days, dailyAgg }), [days, dailyAgg]);

  const sellerTotals = useMemo(() => buildSellerTotals(normalized), [normalized]);

  const hasDays = Array.isArray(days) && days.length > 0;
  const hasData = normalized && Object.keys(normalized).length > 0;

  if (loading) {
    return <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">Loading charts...</div>;
  }

  if (!hasDays || !hasData) {
    return <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">No data to visualize.</div>;
  }

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12">
        <ChartCard title="Revenue / Profit 2 / Ads">
          <div style={{ height: 340 }}>
            <ResponsiveLine
              data={trendSeries}
              margin={{ top: 10, right: 20, bottom: 55, left: 70 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
              gridYValues={gridYValuesChart1}
              axisBottom={{
                tickValues,
                tickSize: 0,
                tickPadding: 6,
                // tickRotation: -30,
                // legend: 'Date',
                legendOffset: 45,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 9,
                tickValues: gridYValuesChart1,
                // legend: 'USD',
                legendOffset: -55,
                legendPosition: 'middle',
                format: (v) => {
                  money(v);
                },
              }}
              legends={[
                {
                  anchor: 'right',
                  direction: 'column',
                  itemHeight: 20,
                  itemWidth: 80,
                  toggleSerie: true,
                  translateY: -100,
                },
              ]}
              enablePoints={true}
              enableGridX={false}
              enableGridY={true}
              enableSlices="x"
              sliceTooltip={({ slice }) => (
                <div className="bg-white border border-slate-200 rounded px-3 py-2 text-xs shadow">
                  <div className=" text-center mb-3 font-medium">{slice.points[0].data.x}</div>
                  {slice.points
                    // (tuỳ chọn) sắp xếp theo tên series cho ổn định
                    .slice()
                    .sort((a, b) => String(a.serieId).localeCompare(String(b.serieId)))
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block"
                            style={{
                              width: 10,
                              height: 10,
                              background: p.color,
                              borderRadius: 2,
                            }}
                          />

                          <span className="text-slate-700 whitespace-nowrap">{String(p.id.split('.')[0])}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{Number(p.data.y).toFixed(0)}</span>
                      </div>
                    ))}
                </div>
              )}
              colors={({ id }) => {
                const map = {
                  Revenue: '#3b82f6',
                  Profit: '#10b981',
                  Ads: '#f97316',
                  Orders: '#a855f7',
                  'ROI (%)': '#ef4444',
                };
                return map[id] || '#64748b';
              }}
              useMesh
            />
          </div>
        </ChartCard>
      </div>

      <div className="col-span-12">
        <ChartCard title="Daily Cost Breakdown">
          <div style={{ height: 360 }}>
            <ResponsiveBar
              data={costStack}
              keys={['baseCost', 'fee', 'ads']}
              colors={({ id }) => {
                const map = {
                  baseCost: '#3b82f6',
                  fee: '#10b981',
                  ads: '#f97316',
                  refund: '#a855f7',
                  discount: '#f97316',
                };
                return map[id] || '#64748b';
              }}
              indexBy="date"
              margin={{ top: 10, right: 20, bottom: 70, left: 70 }}
              padding={0.2}
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              axisBottom={{
                tickValues,
                tickSize: 0,
                tickPadding: 6,
                // tickRotation: -30,
                legendOffset: 60,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 6,

                legendOffset: -55,
                legendPosition: 'middle',
                format: (v) => money(v),
              }}
              // enableLabel={false}
              enableGridX={false}
              enableGridY={true}
              enableSlices="x"
              legends={[
                {
                  anchor: 'right',
                  direction: 'column',
                  itemHeight: 20,
                  itemWidth: 80,
                  toggleSerie: true,
                  translateY: -100,
                },
              ]}
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
      <div className="col-span-6">
        <ChartCard title="Seller Comparison (Totals: Revenue / Profit2 / Ads)">
          <div style={{ height: 300 }}>
            <ResponsiveBar
              data={sellerTotals}
              keys={['Profit', 'Ads']}
              colors={({ id }) => {
                const map = {
                  Revenue: '#3b82f6',
                  Profit: '#10b981',
                  Ads: '#f97316',
                  Orders: '#a855f7',
                  'ROI (%)': '#ef4444',
                };
                return map[id] || '#64748b';
              }}
              indexBy="seller"
              margin={{ top: 10, right: 20, bottom: 70, left: 50 }}
              padding={0.25}
              groupMode="grouped"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              axisBottom={{
                tickSize: 0,
                tickPadding: 6,
                tickRotation: -25,
                // legend: 'Seller',
                legendOffset: 60,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 6,
                // legend: 'USD',
                legendOffset: -55,
                legendPosition: 'middle',
                format: (v) => money(v),
              }}
              enableLabel={false}
              // tooltip={({ id, value, indexValue, data }) => (
              //   <div className="bg-white border border-slate-200 rounded px-3 py-2 text-xs shadow">
              //     <div className="font-semibold text-slate-800">{String(indexValue)}</div>
              //     <div className="text-slate-600">{String(id)}</div>
              //     <div className="mt-1 text-slate-900">{money(value)}</div>
              //     <div className="mt-1 text-slate-600">ROI: {data?.roi == null ? 'N/A' : `${Number(data.roi).toFixed(2)}%`}</div>
              //   </div>
              // )}
              legends={[
                {
                  anchor: 'right',
                  direction: 'column',
                  itemHeight: 20,
                  itemWidth: 80,
                  toggleSerie: true,
                  translateY: -100,
                },
              ]}
            />
          </div>
        </ChartCard>
      </div>
      <div className="col-span-6">
        <ChartCard title="ROI Trend (Profit2 / Ads * 100)">
          <div style={{ height: 300 }}>
            <ResponsiveLine
              data={roiSeries}
              margin={{ top: 10, right: 20, bottom: 55, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
              axisBottom={{
                tickValues,
                tickSize: 0,
                tickPadding: 6,
                // tickRotation: -30,
                legend: 'Date',
                legendOffset: 45,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 6,
                // legend: 'ROI (%)',
                legendOffset: -45,
                legendPosition: 'middle',
                format: (v) => `${Number(v).toFixed(0)}%`,
              }}
              enablePoints={false}
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
const SliceTooltip = ({ slice }) => {
  // const points = [...slice.points].sort((a, b) => String(a.serieId).localeCompare(String(b.serieId)));

  return (
    <div className="bg-white border border-slate-200 rounded px-3 py-2 text-xs shadow">
      {slice.points
        // (tuỳ chọn) sắp xếp theo tên series cho ổn định
        .slice()
        .sort((a, b) => String(a.serieId).localeCompare(String(b.serieId)))
        .map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-block"
                style={{
                  width: 10,
                  height: 10,
                  background: p.serieColor,
                  borderRadius: 2,
                }}
              />
              <span className="text-slate-700">{String(p.serieId)}</span>
            </div>
            <span className="font-semibold text-slate-900">{Number(p.data.y).toFixed(0)}</span>
          </div>
        ))}
    </div>
  );
};
