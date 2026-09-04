export const getSubItemSellerLabel = (seller) =>
  seller?.full_name || seller?.sellerCode || 'No data';
