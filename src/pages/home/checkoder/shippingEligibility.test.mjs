import test from "node:test";
import assert from "node:assert/strict";
import {
  AMAZON_SUBMIT_TABLE_COLUMNS,
  AMAZON_SUBMIT_TABLE_COLUMN_WIDTHS,
  getAmazonSubmitStatus,
} from "./shippingEligibility.js";

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
});
