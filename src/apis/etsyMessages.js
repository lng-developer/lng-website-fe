import instance from '.';

export const fetchEtsyMessages = ({ shopId, page = 1, limit = 20, unread, status, q } = {}) =>
  instance.get('/etsy-messages', {
    params: {
      shopId,
      page,
      limit,
      unread,
      status,
      q,
    },
  });

export const fetchEtsyMessageDetail = ({ shopId, threadId }) =>
  instance.get(`/etsy-messages/${threadId}`, {
    params: { shopId },
  });

export const markEtsyMessageRead = ({ shopId, threadId, unread = false }) =>
  instance.patch(`/etsy-messages/${threadId}/read`, {
    shopId,
    unread,
  });
