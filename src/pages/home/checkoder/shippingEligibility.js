const BLOCK_DETAILS = {
  MISSING_TRACKING: "Thiếu mã tracking",
  MISSING_CARRIER: "Thiếu hãng vận chuyển",
  MISSING_ACTUAL_SHIP_DATE: "Chưa có thời điểm carrier nhận hàng",
  FUTURE_ACTUAL_SHIP_DATE: "Carrier nhận hàng ở thời điểm tương lai",
  SPLIT_SHIPMENT: "Nhiều mã tracking / tách kiện",
  SPLIT_OR_UNTRACKED_ITEM: "Nhiều mã tracking hoặc item chưa có tracking",
  BUYER_CANCELLATION: "Khách yêu cầu hủy đơn",
  ORDER_NOT_ELIGIBLE: "Đơn đã hủy hoặc hoàn tiền",
  MISSING_SHIP_BY: "Thiếu Ship By từ Amazon",
  SHIP_DATE_AFTER_SHIP_BY: "Carrier nhận hàng sau Ship By",
  AMAZON_CONFIRMATION_EXISTS: "Đơn đã có tiến trình xác nhận Amazon",
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
  const confirmationState = order.amazonConfirmation?.state;
  if (confirmationState === "confirmed") {
    return { state: "submitted", label: "Đã xác nhận Amazon", detail: "Amazon Processing Report đã xác nhận" };
  }
  if (confirmationState === "submitted") {
    return { state: "submitted", label: "Chờ Amazon xử lý", detail: "Đã gửi file, đang chờ Processing Report" };
  }
  if (confirmationState === "needs_review" || confirmationState === "failed") {
    return { state: "blocked", label: "Cần xử lý", detail: "Amazon cần kiểm tra lại Processing Report" };
  }
  if (order.submittedToAmazon) {
    return { state: "submitted", label: "Đã gửi Amazon", detail: "Đơn này đã được gửi trước đó" };
  }

  if (order.eligibility?.readyForReview ?? order.bulkConfirmEligible) {
    return { state: "ready", label: "Sẵn sàng gửi", detail: "Đủ dữ liệu gửi Amazon" };
  }

  const reason = order.eligibility?.reasons?.[0] || order.bulkBlockReason;

  return {
    state: "blocked",
    label: "Chưa thể gửi",
    detail: BLOCK_DETAILS[reason] || "Chưa đủ dữ liệu gửi Amazon",
  };
}
