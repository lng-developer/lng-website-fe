# Shopify Cancel Order API For FE

## Endpoint

```http
POST /api/shopify/orders/:orderId/cancel
```

Example:

```http
POST /api/shopify/orders/7684999446665/cancel
```

`orderId` is the Shopify numeric order ID stored in `shopifyOrderId`.

## Request Body

```json
{
  "reason": "CUSTOMER",
  "notifyCustomer": false,
  "restock": false,
  "refundOriginalPayment": false,
  "staffNote": "Cancelled from LNG portal"
}
```

Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `reason` | string | No | Shopify cancel reason. Defaults to `OTHER`. |
| `notifyCustomer` | boolean | No | Whether Shopify sends a cancellation notification to the customer. Defaults to `false`. |
| `restock` | boolean | No | Whether Shopify restocks inventory. Defaults to `false`. |
| `refundOriginalPayment` | boolean | No | Whether Shopify refunds through the original payment method. Defaults to `false`. |
| `staffNote` | string | No | Internal note sent to Shopify. Max 255 chars. |
| `force` | boolean | No | Allows cancelling an order that is already `Shipped` or `fulfilled`. Defaults to `false`. |

Allowed `reason` values:

```txt
CUSTOMER
DECLINED
FRAUD
INVENTORY
STAFF
OTHER
```

Recommended default for FE:

```json
{
  "reason": "CUSTOMER",
  "notifyCustomer": false,
  "restock": false,
  "refundOriginalPayment": false,
  "staffNote": "Cancelled from LNG portal"
}
```

## Success Response

```json
{
  "ok": true,
  "cancelled": true,
  "shopifyOrderId": "7684999446665",
  "job": {
    "id": "gid://shopify/Job/5b563e09-ad3d-4f27-9cde-21e3fdfcd93d",
    "done": false
  }
}
```

Notes:

- `cancelled: true` means Shopify accepted the cancel request.
- `job.done: false` means Shopify is processing the cancellation asynchronously.
- FE should refresh the order list/detail after success.
- Local order status is updated to `Cancelled` after the API succeeds.

## Already Cancelled Response

```json
{
  "ok": true,
  "cancelled": true,
  "alreadyCancelled": true,
  "shopifyOrderId": "7684999446665"
}
```

FE can treat this as a successful final state.

## Common Error Responses

### Order Not Found

```json
{
  "ok": false,
  "message": "Shopify order not found"
}
```

HTTP status: `404`

### Order Already Shipped

```json
{
  "ok": false,
  "message": "Shopify order is already shipped. Pass force=true to cancel on Shopify anyway.",
  "processStatus": "Shipped",
  "fulfillmentStatus": "fulfilled"
}
```

HTTP status: `400`

FE should show a confirmation dialog before retrying with:

```json
{
  "force": true,
  "reason": "CUSTOMER",
  "notifyCustomer": false,
  "restock": false,
  "refundOriginalPayment": false,
  "staffNote": "Force cancel from LNG portal"
}
```

### Shopify Permission Error

```json
{
  "ok": false,
  "message": "Access denied for orderCancel field. Required access: `write_orders` access scope or `write_marketplace_orders` access scope.",
  "code": "SHOPIFY_GRAPHQL_ERRORS"
}
```

HTTP status: `502`

Backend/shop setup needs Shopify scope `write_orders`, then the app must be re-authorized.

### Shopify Rejects Cancel

```json
{
  "ok": false,
  "message": "Shopify error message",
  "code": "SHOPIFY_ORDER_CANCEL_FAILED",
  "shopifyErrors": []
}
```

HTTP status: `502`

Show the `message` to the user.

## Suggested FE Flow

1. Show a Cancel button for Shopify orders that are not `Cancelled`.
2. On click, open confirm modal.
3. Default options:
   - `reason = CUSTOMER`
   - `notifyCustomer = false`
   - `restock = false`
   - `refundOriginalPayment = false`
4. Call `POST /api/shopify/orders/:orderId/cancel`.
5. If success, show success toast and refresh order data.
6. If error is "already shipped", show stronger confirm and retry with `force: true` only after user confirms.
7. If permission error appears, show admin/setup message.

## Important Notes

- Cancellation on Shopify cannot be reversed.
- Do not default `refundOriginalPayment` to `true`.
- Do not default `notifyCustomer` to `true` unless CS explicitly wants Shopify to email the buyer.
- For POD/custom orders, keep `restock` as `false` by default.
