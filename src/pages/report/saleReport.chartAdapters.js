// saleReport.chartAdapters.js
export const numberSafe = (v) => (Number.isFinite(+v) ? +v : 0);
export const sum = (arr = []) => (Array.isArray(arr) ? arr.reduce((a, b) => a + numberSafe(b), 0) : 0);
const initArr = (len, fill = 0) => Array.from({ length: len }, () => fill);

export function buildProfitArrays(r, len) {
  const revenue = Array.isArray(r?.revenue) ? r.revenue : initArr(len, 0);
  const baseCost = Array.isArray(r?.baseCost) ? r.baseCost : initArr(len, 0);
  const fee = Array.isArray(r?.fee) ? r.fee : initArr(len, 0);
  const ads = Array.isArray(r?.ads) ? r.ads : initArr(len, 0);
  const opCost = Array.isArray(r?.opCost) ? r.opCost : initArr(len, 0);
  const refund = Array.isArray(r?.refund) ? r.refund : initArr(len, 0);
  const discount = Array.isArray(r?.itemPromotionDiscount) ? r.itemPromotionDiscount : initArr(len, 0);

  const profit1 =
    Array.isArray(r?.profit1) && r.profit1.length === len
      ? r.profit1
      : revenue.map(
          (rv, i) =>
            numberSafe(rv) -
            numberSafe(baseCost[i]) -
            numberSafe(fee[i]) -
            numberSafe(refund[i]) -
            Math.abs(numberSafe(discount[i]))
        );

  const profit2 =
    Array.isArray(r?.profit2) && r.profit2.length === len
      ? r.profit2
      : profit1.map((p1, i) => numberSafe(p1) - numberSafe(ads[i]) - numberSafe(opCost[i]));

  const roi = ads.map((ad, i) => {
    const a = numberSafe(ad);
    if (a <= 0) return null;
    return +((numberSafe(profit2[i]) / a) * 100).toFixed(2);
  });

  return { profit1, profit2, roi };
}

export function pickEntries(normalized, sellerFilter) {
  const entries = Object.entries(normalized || {});
  if (!sellerFilter) return entries;
  return entries.filter(([seller]) => seller === sellerFilter);
}

export function buildDailyAggregate({ normalized, days, sellerFilter }) {
  const len = Array.isArray(days) ? days.length : 0;

  const agg = {
    items: initArr(len, 0),
    revenue: initArr(len, 0),
    baseCost: initArr(len, 0),
    ads: initArr(len, 0),
    fee: initArr(len, 0),
    opCost: initArr(len, 0),
    refund: initArr(len, 0),
    discount: initArr(len, 0),
    profit1: initArr(len, 0),
    profit2: initArr(len, 0),
    roi: initArr(len, null),
    roa: initArr(len, null),
  };

  const selected = pickEntries(normalized, sellerFilter);

  selected.forEach(([, r]) => {
    const items = Array.isArray(r?.items) ? r.items : initArr(len, 0);
    const revenue = Array.isArray(r?.revenue) ? r.revenue : initArr(len, 0);
    const baseCost = Array.isArray(r?.baseCost) ? r.baseCost : initArr(len, 0);
    const ads = Array.isArray(r?.ads) ? r.ads : initArr(len, 0);
    const fee = Array.isArray(r?.fee) ? r.fee : initArr(len, 0);
    const opCost = Array.isArray(r?.opCost) ? r.opCost : initArr(len, 0);
    const refund = Array.isArray(r?.refund) ? r.refund : initArr(len, 0);
    const discount = Array.isArray(r?.itemPromotionDiscount) ? r.itemPromotionDiscount : initArr(len, 0);

    const { profit1, profit2 } = buildProfitArrays(r, len);

    for (let i = 0; i < len; i++) {
      agg.items[i] += numberSafe(items[i]);
      agg.revenue[i] += numberSafe(revenue[i]);
      agg.baseCost[i] += numberSafe(baseCost[i]);
      agg.ads[i] += numberSafe(ads[i]);
      agg.fee[i] += numberSafe(fee[i]);
      agg.opCost[i] += numberSafe(opCost[i]);
      agg.refund[i] += numberSafe(refund[i]);
      agg.discount[i] += numberSafe(discount[i]);
      agg.profit1[i] += numberSafe(profit1[i]);
      agg.profit2[i] += numberSafe(profit2[i]);
    }
  });

  for (let i = 0; i < len; i++) {
    const a = numberSafe(agg.ads[i]);
    agg.roi[i] = a > 0 ? +((numberSafe(agg.profit2[i]) / a) * 100).toFixed(2) : null;
    agg.roa[i] = a > 0 ? +((numberSafe(agg.revenue[i]) / a) * 100).toFixed(2) : null;
  }

  return agg;
}

export function buildLineSeries({ days, dailyAgg, metrics }) {
  const safeDays = Array.isArray(days) ? days : [];
  return (metrics || []).map((m) => ({
    id: m.id,
    data: safeDays.map((d, i) => ({ x: d, y: dailyAgg?.[m.key]?.[i] ?? 0 })),
  }));
}

export function buildRoiLineSeries({ days, dailyAgg, id = 'ROI (%)' }) {
  const safeDays = Array.isArray(days) ? days : [];
  return [
    {
      id,
      data: safeDays.map((d, i) => ({ x: d, y: dailyAgg?.roi?.[i] ?? null })),
    },
  ];
}

export function buildRoaLineSeries({ days, dailyAgg, id = 'ROA (%)' }) {
  const safeDays = Array.isArray(days) ? days : [];
  return [
    {
      id,
      data: safeDays.map((d, i) => ({ x: d, y: dailyAgg?.roa?.[i] ?? null })),
    },
  ];
}

export function buildCostStackByDay({ days, dailyAgg }) {
  const safeDays = Array.isArray(days) ? days : [];
  return safeDays.map((d, i) => ({
    date: d,
    baseCost: dailyAgg?.baseCost?.[i].toFixed(2) ?? 0,
    fee: dailyAgg?.fee?.[i].toFixed(2) ?? 0,
    ads: dailyAgg?.ads?.[i].toFixed(2) ?? 0,
    opCost: dailyAgg?.opCost?.[i] ?? 0,
    refund: dailyAgg?.refund?.[i] ?? 0,
    discount: dailyAgg?.discount?.[i] ?? 0,
  }));
}

export function buildSellerTotals(normalized) {
  const entries = Object.entries(normalized || {});
  return entries.map(([seller, r]) => {
    const len = Math.max(
      r?.items?.length || 0,
      r?.revenue?.length || 0,
      r?.baseCost?.length || 0,
      r?.fee?.length || 0,
      r?.ads?.length || 0,
      r?.opCost?.length || 0,
      r?.refund?.length || 0
    );

    const { profit1, profit2 } = buildProfitArrays(r, len);

    const Orders = numberSafe(r?.totals?.items ?? sum(r?.items));
    const Revenue = numberSafe(r?.totals?.revenue ?? sum(r?.revenue));
    const Ads = numberSafe(r?.totals?.ads ?? sum(r?.ads));
    const profit_2 = numberSafe(r?.totals?.profit2 ?? sum(profit2));

    const roi = Ads > 0 ? +((profit_2 / Ads) * 100).toFixed(2) : null;
    const roa = Ads > 0 ? +((Revenue / Ads) * 100).toFixed(2) : null; // NEW

    return {
      seller,
      Orders,
      Revenue,
      Ads,
      profit1: numberSafe(r?.totals?.profit1 ?? sum(profit1)),
      Profit: profit_2,
      roi,
      roa, // NEW
    };
  });
}


export function pickTickValues(days, maxTicks = 10) {
  const safeDays = Array.isArray(days) ? days : [];
  const len = safeDays.length;
  if (len <= maxTicks) return safeDays;
  const step = Math.ceil(len / maxTicks);
  return safeDays.filter((_, i) => i % step === 0);
}
