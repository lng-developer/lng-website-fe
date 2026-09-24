const BLOCK_DETAILS = {
  MISSING_TRACKING: "Thiếu mã tracking",
  MISSING_CARRIER: "Thiếu hãng vận chuyển",
  MISSING_ACTUAL_SHIP_DATE: "Chưa có thời điểm carrier nhận hàng",
  SPLIT_SHIPMENT: "Nhiều mã tracking / tách kiện",
  BUYER_CANCELLATION: "Khách yêu cầu hủy đơn",
  ORDER_NOT_ELIGIBLE: "Đơn đã hủy hoặc hoàn tiền",
};

export const AMAZON_SUBMIT_TABLE_COLUMNS = [
  "Gửi AMZ",
  "Order ID",
  "Vendor / Fulfillment",
  "Tracking & hãng vận chuyển",
  "Carrier nhận hàng lúc",
  "Ship by",
  "Trạng thái gửi Amazon",
];

export const AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS = [
  "w-[180px]",
  "w-[190px]",
  "w-[180px]",
  "w-[340px]",
  "w-[220px]",
  "w-[150px]",
  "w-[220px]",
];

export function getAmazonSubmitStatus(order = {}) {
  if (order.submittedToAmazon) {
    return { state: "submitted", label: "Đã gửi Amazon", detail: "Đơn này đã được gửi trước đó" };
  }

  if (order.bulkConfirmEligible) {
    return { state: "ready", label: "Sẵn sàng gửi", detail: "Đủ dữ liệu gửi Amazon" };
  }

  return {
    state: "blocked",
    label: "Chưa thể gửi",
    detail: BLOCK_DETAILS[order.bulkBlockReason] || "Chưa đủ dữ liệu gửi Amazon",
  };
}
