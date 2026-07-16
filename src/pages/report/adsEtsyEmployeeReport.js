const toNumber = (value) => Number(value || 0);

export const getEmployeeReportRows = (summary) => (Array.isArray(summary?.items) ? summary.items : []);

export const getEmployeeReportTotals = (summary) => {
  const totals = getEmployeeReportRows(summary).reduce(
    (acc, item) => {
      const totals = item?.totals || {};
      acc.rows += toNumber(totals.rows);
      acc.spend += toNumber(totals.spend);
      acc.views += toNumber(totals.views);
      acc.clicks += toNumber(totals.clicks);
      acc.orders += toNumber(totals.orders);
      acc.revenue += toNumber(totals.revenue);
      return acc;
    },
    { rows: 0, spend: 0, views: 0, clicks: 0, orders: 0, revenue: 0, roas: 0 }
  );

  totals.roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  return totals;
};

export const getEmployeeDetailSku = (detail) => {
  if (detail?.sku) return String(detail.sku);
  if (Array.isArray(detail?.skus)) return detail.skus.filter(Boolean).join(', ');
  return detail?.skus ? String(detail.skus) : '';
};

export const getEmployeeDetailRowKey = (record, index) =>
  `${record?.day || ''}-${record?.shopId || ''}-${record?.listingId || ''}-${record?.sku || ''}-${index}`;
