import test from "node:test";
import assert from "node:assert/strict";
import {
  AMAZON_SUBMIT_TABLE_COLUMNS,
  AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS,
  getAmazonReviewSummary,
  getAmazonSubmitStatus,
} from "./shippingEligibility.js";
import * as shippingEligibility from "./shippingEligibility.js";

test("keeps only the fields needed to send tracking to Amazon", () => {
  assert.deepEqual(AMAZON_SUBMIT_TABLE_COLUMNS, [
    "Gửi AMZ",
    "Order ID",
    "Vendor / Fulfillment",
    "Tracking & hãng vận chuyển",
    "Carrier nhận hàng lúc",
    "Ship by",
    "Trạng thái gửi Amazon",
  ]);
});

test("allocates the table width to the longest shipping fields", () => {
  assert.deepEqual(AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS, [
    "w-[180px]",
    "w-[190px]",
    "w-[180px]",
    "w-[340px]",
    "w-[220px]",
    "w-[150px]",
    "w-[220px]",
  ]);
});

test("explains every blocking reason instead of hiding the checkbox", () => {
  assert.deepEqual(
    getAmazonSubmitStatus({ bulkConfirmEligible: false, bulkBlockReason: "MISSING_ACTUAL_SHIP_DATE" }),
    { state: "blocked", label: "Chưa thể gửi", detail: "Chưa có thời điểm carrier nhận hàng" }
  );
  assert.deepEqual(
    getAmazonSubmitStatus({ bulkConfirmEligible: false, bulkBlockReason: "MISSING_CARRIER" }),
    { state: "blocked", label: "Chưa thể gửi", detail: "Thiếu hãng vận chuyển" }
  );
  assert.deepEqual(
    getAmazonSubmitStatus({ bulkConfirmEligible: true }),
    { state: "ready", label: "Sẵn sàng gửi", detail: "Đủ dữ liệu gửi Amazon" }
  );
  assert.deepEqual(
    getAmazonSubmitStatus({ submittedToAmazon: true }),
    { state: "submitted", label: "Đã gửi Amazon", detail: "Đơn này đã được gửi trước đó" }
  );
  assert.deepEqual(
    getAmazonSubmitStatus({ amazonConfirmation: { state: "confirmed" } }),
    { state: "submitted", label: "Đã xác nhận Amazon", detail: "Amazon Processing Report đã xác nhận" }
  );
  assert.deepEqual(
    getAmazonSubmitStatus({ amazonConfirmation: { state: "submitted" } }),
    { state: "submitted", label: "Chờ Amazon xử lý", detail: "Đã gửi file, đang chờ Processing Report" }
  );
  assert.deepEqual(
    getAmazonSubmitStatus({ eligibility: { readyForReview: false, reasons: ["SHIP_DATE_AFTER_SHIP_BY"] } }),
    { state: "blocked", label: "Chưa thể gửi", detail: "Carrier nhận hàng sau Ship By" }
  );
});

test("derives one immutable review date from the batch carrier dates", () => {
  assert.equal(typeof shippingEligibility.getAmazonReviewShipDate, "function");
  assert.equal(shippingEligibility.getAmazonReviewShipDate({
    orders: [{ shipDate: "2026-09-24" }, { shipDate: "2026-09-24" }],
  }), "2026-09-24");
  assert.equal(shippingEligibility.getAmazonReviewShipDate({
    orders: [{ shipDate: "2026-09-24" }, { shipDate: "2026-09-25" }],
  }), "");
});

test("summarizes review batches without treating an invalid carrier date as ready", () => {
  assert.deepEqual(getAmazonReviewSummary([
    { totalReal: 2, orders: [{ shipDate: "2026-09-24" }, { shipDate: "2026-09-24" }] },
    { totalReal: 1, orders: [{ shipDate: "2026-09-24" }, { shipDate: "2026-09-25" }] },
  ]), {
    batchCount: 2,
    totalOrders: 3,
    invalidBatchCount: 1,
  });
});

test("uses the backend TSV preview rows instead of recreating Amazon fields in the modal", () => {
  assert.equal(typeof shippingEligibility.getAmazonUploadPreview, "function");
  assert.deepEqual(shippingEligibility.getAmazonUploadPreview([{
    batchId: "batch-1",
    uploadPreview: {
      headers: ["order-id", "order-item-id", "tracking-number", "ship-date"],
      rows: [{
        "order-id": "112-0319169-1534648",
        "order-item-id": "",
        "tracking-number": "9234690339407902297338",
        "ship-date": "2026-09-24",
      }],
    },
  }]), {
    headers: ["order-id", "order-item-id", "tracking-number", "ship-date"],
    rows: [{
      batchId: "batch-1",
      "order-id": "112-0319169-1534648",
      "order-item-id": "",
      "tracking-number": "9234690339407902297338",
      "ship-date": "2026-09-24",
    }],
  });
});
