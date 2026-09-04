const BLOCKED_ORDER_STATUSES = new Set(['Shipped', 'Cancelled', 'Canceled', 'Fulfilled']);

const normalizeProviderKey = (value = '') => {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return '';
  if (text.includes('merchize')) return 'merchize';
  if (text.includes('grabink')) return 'grabink';
  if (text.includes('merchfox')) return 'merchfox';
  if (text.includes('printway')) return 'printway';
  if (text.includes('mangotee')) return 'mangotee';
  if (text.includes('lenful')) return 'lenful';
  if (text.includes('pgprint')) return 'pgprint';
  if (text.includes('luxury')) return 'luxurypro';
  if (text.includes('onos')) return 'onos';
  if (text.includes('lng')) return 'lng';
  if (text.includes('ss88')) return 'ss88';
  return text;
};

const getSubmissionError = (provider, submission) => {
  if (!submission || submission.sent === true) return null;
  const response = submission.last_response || submission.response || {};
  const error = response.error || response.message || submission.error || submission.message || '';
  if (!error) return null;
  return {
    provider: normalizeProviderKey(provider),
    error,
    attemptCount: submission.attempt_count || submission.attemptCount || 0,
    at: response.at || submission.sent_at || submission.updatedAt || null,
  };
};

export const hasFulfillmentFile = (fulfillmentFile) =>
  Object.values(fulfillmentFile || {}).some((value) => Boolean(String(value || '').trim()));

const allItemsComplete = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  return (
    items.length > 0 &&
    items.every((item) => String(item?.scale_status || '').toLowerCase() === 'complete')
  );
};

const isBlockedOrder = (order) => BLOCKED_ORDER_STATUSES.has(String(order?.status || '').trim());

export const getRetryEtsySendDisabledReason = (order) => {
  if (isBlockedOrder(order)) return 'Order already shipped/fulfilled/cancelled';
  if (!['ready', 'failed'].includes(String(order?.scale_overall_status || '').toLowerCase())) {
    return 'Status is not Ready/Failed';
  }
  if (!allItemsComplete(order)) return 'Some items are not Complete';
  return '';
};

export const canRetryEtsySend = (order) => !getRetryEtsySendDisabledReason(order);

export const getReopenEtsyQcDisabledReason = (order) => {
  const overall = String(order?.scale_overall_status || '').toLowerCase();
  const items = Array.isArray(order?.items) ? order.items : [];
  if (isBlockedOrder(order)) return 'Order already shipped/fulfilled/cancelled';
  if (!['failed', 'ready'].includes(overall)) return 'Status is not Failed/Ready';
  if (!allItemsComplete(order)) return 'Some items are not Complete';
  if (!items.every((item) => hasFulfillmentFile(item?.fulfillment_file))) return 'Missing scale file';
  return '';
};

export const canReopenEtsyQc = (order) => !getReopenEtsyQcDisabledReason(order);

export const getEtsyFailureInfo = (order) => {
  const direct =
    order?.failure ||
    order?.vendor_failure ||
    order?.vendorFailure ||
    order?.last_failure ||
    order?.lastFailure ||
    null;
  if (direct) {
    return {
      provider: normalizeProviderKey(direct.provider || direct.vendor || direct.vendorKey || ''),
      error: direct.error || direct.message || direct.reason || '',
      attemptCount: direct.attempt_count || direct.attemptCount || 0,
      at: direct.at || direct.updatedAt || null,
    };
  }

  for (const [provider, submission] of Object.entries(order?.vendor_submissions || {})) {
    const info = getSubmissionError(provider, submission);
    if (info) return info;
  }

  const grabinkInfo = getSubmissionError('grabink', order?.grabink_submission);
  if (grabinkInfo) return grabinkInfo;

  const inferredProvider = normalizeProviderKey(
    order?.items?.find((item) => item?.cost_center?.vendorProductDisplayName)?.cost_center?.vendorProductDisplayName
  );

  return {
    provider: inferredProvider,
    error: '',
    attemptCount: 0,
    at: null,
  };
};
