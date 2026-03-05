// etsy.chartAdapters.js  –  Etsy-specific chart data adapters
// Etsy fields: listingFee, transactionFee, paymentFee, offsiteAds, tax, opCost, refund, discount

export const numberSafe = (v) => (Number.isFinite(+v) ? +v : 0);
export const sum = (arr = []) => (Array.isArray(arr) ? arr.reduce((a, b) => a + numberSafe(b), 0) : 0);
const initArr = (len, fill = 0) => Array.from({ length: len }, () => fill);

/**
 * Tính profit1, profit2, roi từ dữ liệu một seller Etsy.
 * profit1 = revenue - baseCost - listingFee - transactionFee - paymentFee
 * profit2 = profit1 - offsiteAds - tax - opCost - refund
 */
export function buildEtsyProfitArrays(r, len) {
  const revenue        = Array.isArray(r?.revenue)        ? r.revenue        : initArr(len, 0);
  const baseCost       = Array.isArray(r?.baseCost)       ? r.baseCost       : initArr(len, 0);
  const listingFee     = Array.isArray(r?.listingFee)     ? r.listingFee     : initArr(len, 0);
  const transactionFee = Array.isArray(r?.transactionFee) ? r.transactionFee : initArr(len, 0);
  const paymentFee     = Array.isArray(r?.paymentFee)     ? r.paymentFee     : initArr(len, 0);
  const offsiteAds     = Array.isArray(r?.offsiteAds)     ? r.offsiteAds     : initArr(len, 0);
  const tax            = Array.isArray(r?.tax)            ? r.tax            : initArr(len, 0);
  const opCost         = Array.isArray(r?.opCost)         ? r.opCost         : initArr(len, 0);
  const refund         = Array.isArray(r?.refund)         ? r.refund         : initArr(len, 0);

  const profit1 =
    Array.isArray(r?.profit1) && r.profit1.length === len
      ? r.profit1
      : revenue.map((rv, i) =>
          numberSafe(rv) -
          numberSafe(baseCost[i]) -
          numberSafe(listingFee[i]) -
          numberSafe(transactionFee[i]) -
          numberSafe(paymentFee[i])
        );

  const profit2 =
    Array.isArray(r?.profit2) && r.profit2.length === len
      ? r.profit2
      : profit1.map((p1, i) =>
          numberSafe(p1) -
          numberSafe(offsiteAds[i]) -
          numberSafe(tax[i]) -
          numberSafe(opCost[i]) -
          numberSafe(refund[i])
        );

  const roi = offsiteAds.map((ad, i) => {
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

/**
 * Tổng hợp dữ liệu theo ngày qua tất cả các shop được chọn.
 */
export function buildEtsyDailyAggregate({ normalized, days, sellerFilter }) {
  const len = Array.isArray(days) ? days.length : 0;

  const agg = {
    items:          initArr(len, 0),
    revenue:        initArr(len, 0),
    baseCost:       initArr(len, 0),
    listingFee:     initArr(len, 0),
    transactionFee: initArr(len, 0),
    paymentFee:     initArr(len, 0),
    offsiteAds:     initArr(len, 0),
    tax:            initArr(len, 0),
    opCost:         initArr(len, 0),
    refund:         initArr(len, 0),
    discount:       initArr(len, 0),
    profit1:        initArr(len, 0),
    profit2:        initArr(len, 0),
    roi:            initArr(len, null),
    roa:            initArr(len, null),
  };

  const selected = pickEntries(normalized, sellerFilter);

  selected.forEach(([, r]) => {
    const items          = Array.isArray(r?.items)          ? r.items          : initArr(len, 0);
    const revenue        = Array.isArray(r?.revenue)        ? r.revenue        : initArr(len, 0);
    const baseCost       = Array.isArray(r?.baseCost)       ? r.baseCost       : initArr(len, 0);
    const listingFee     = Array.isArray(r?.listingFee)     ? r.listingFee     : initArr(len, 0);
    const transactionFee = Array.isArray(r?.transactionFee) ? r.transactionFee : initArr(len, 0);
    const paymentFee     = Array.isArray(r?.paymentFee)     ? r.paymentFee     : initArr(len, 0);
    const offsiteAds     = Array.isArray(r?.offsiteAds)     ? r.offsiteAds     : initArr(len, 0);
    const tax            = Array.isArray(r?.tax)            ? r.tax            : initArr(len, 0);
    const opCost         = Array.isArray(r?.opCost)         ? r.opCost         : initArr(len, 0);
    const refund         = Array.isArray(r?.refund)         ? r.refund         : initArr(len, 0);
    const discount       = Array.isArray(r?.discount)       ? r.discount       : initArr(len, 0);

    const { profit1, profit2 } = buildEtsyProfitArrays(r, len);

    for (let i = 0; i < len; i++) {
      agg.items[i]          += numberSafe(items[i]);
      agg.revenue[i]        += numberSafe(revenue[i]);
      agg.baseCost[i]       += numberSafe(baseCost[i]);
      agg.listingFee[i]     += numberSafe(listingFee[i]);
      agg.transactionFee[i] += numberSafe(transactionFee[i]);
      agg.paymentFee[i]     += numberSafe(paymentFee[i]);
      agg.offsiteAds[i]     += numberSafe(offsiteAds[i]);
      agg.tax[i]            += numberSafe(tax[i]);
      agg.opCost[i]         += numberSafe(opCost[i]);
      agg.refund[i]         += numberSafe(refund[i]);
      agg.discount[i]       += numberSafe(discount[i]);
      agg.profit1[i]        += numberSafe(profit1[i]);
      agg.profit2[i]        += numberSafe(profit2[i]);
    }
  });

  // ROI & ROA tổng mỗi ngày (dùng offsiteAds thay cho ads)
  for (let i = 0; i < len; i++) {
    const a = numberSafe(agg.offsiteAds[i]);
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
  return [{ id, data: safeDays.map((d, i) => ({ x: d, y: dailyAgg?.roi?.[i] ?? null })) }];
}

export function buildRoaLineSeries({ days, dailyAgg, id = 'ROA (%)' }) {
  const safeDays = Array.isArray(days) ? days : [];
  return [{ id, data: safeDays.map((d, i) => ({ x: d, y: dailyAgg?.roa?.[i] ?? null })) }];
}

/**
 * Tổng hợp dữ liệu từng shop để vẽ biểu đồ so sánh seller.
 */
export function buildEtsyShopTotals(normalized) {
  const entries = Object.entries(normalized || {});
  return entries.map(([seller, r]) => {
    const len = Math.max(
      r?.items?.length || 0,
      r?.revenue?.length || 0,
      r?.baseCost?.length || 0,
      r?.offsiteAds?.length || 0,
      r?.opCost?.length || 0,
      r?.refund?.length || 0
    );

    const { profit1, profit2 } = buildEtsyProfitArrays(r, len);

    const Orders      = numberSafe(r?.totals?.items      ?? sum(r?.items));
    const Revenue     = numberSafe(r?.totals?.revenue    ?? sum(r?.revenue));
    const OffsiteAds  = numberSafe(r?.totals?.offsiteAds ?? sum(r?.offsiteAds));
    const profit_2    = numberSafe(r?.totals?.profit2    ?? sum(profit2));

    const roi = OffsiteAds > 0 ? +((profit_2 / OffsiteAds) * 100).toFixed(2) : null;
    const roa = OffsiteAds > 0 ? +((Revenue / OffsiteAds) * 100).toFixed(2) : null;

    return {
      seller,
      Orders,
      Revenue,
      OffsiteAds,
      profit1: numberSafe(r?.totals?.profit1 ?? sum(profit1)),
      Profit: profit_2,
      roi,
      roa,
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
