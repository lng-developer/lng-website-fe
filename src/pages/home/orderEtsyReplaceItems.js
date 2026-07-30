export const getEtsyReplaceItemId = (item) =>
  item?.transactionId ?? item?.transaction_id ?? item?.orderItemId ?? item?.order_item_id ?? item?._id ?? item?.id ?? '';

export const buildReplaceItemRows = (items = []) =>
  items.map((item, index) => {
    const itemId = getEtsyReplaceItemId(item);
    const normalizedItemId = itemId ? String(itemId) : '';

    return {
      key: normalizedItemId || `replace-item-${index}`,
      orderItemId: normalizedItemId,
      transactionId: normalizedItemId,
      baseImageUrl: item?.baseImageUrl || item?.baseImage?.imageUrl || '',
      sku: item?.sku,
      mapped_sku: item?.mapped_sku,
      quantity: item?.quantity,
    };
  });
