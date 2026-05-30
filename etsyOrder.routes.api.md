# Etsy Order Routes API

File route: `src/routes/etsyOrder.routes.js`

Base path trong `server.js`:

```txt
/api/etsy
```

Controller chính: `src/controllers/etsyOrder.controller.js`

Model chính: `src/models/etsyOrder.model.js`

Middleware auth: `authenticateToken` từ `src/middlewares/auth.middleware.js`

## Tổng Quan Endpoint

| Method | Endpoint | Auth | Controller |
|---|---|---:|---|
| `POST` | `/api/etsy/import` | Không | `importOrders` |
| `GET` | `/api/etsy/statistic` | Không | `getEtsyOrderStatistics` |
| `GET` | `/api/etsy/scale/list` | Có | `getEtsyScaleList` |
| `GET` | `/api/etsy/scale/statistics` | Có | `getEtsyScaleStatistics` |
| `GET` | `/api/etsy/qc/list` | Có | `getEtsyQCList` |
| `GET` | `/api/etsy/qc/statistics` | Có | `getEtsyQCStatistics` |
| `PATCH` | `/api/etsy/sumbittedoetsy` | Không | `updateSumbittedoetsyStatus` |
| `PUT` | `/api/etsy/manual-mapping` | Có | `applyManualVendorMapping` |
| `POST` | `/api/etsy/:orderId/items/:transactionId/fulfillment-file` | Có | `uploadEtsyFulfillmentFileForItem` |
| `POST` | `/api/etsy/:orderId/items/:transactionId/scale/confirm` | Có | `confirmEtsyScaleForItem` |
| `PUT` | `/api/etsy/:orderId/items/:transactionId/cs-note` | Có | `updateEtsyCSNoteForItem` |
| `PUT` | `/api/etsy/:orderId/items/:transactionId/qc-note` | Có | `updateEtsyQCNoteForItem` |
| `PATCH` | `/api/etsy/:orderId/items/:transactionId/tracking` | Không | `updateEtsyOrderItemTracking` |
| `PUT` | `/api/etsy/:orderId/items/:transactionId/tracking` | Không | `updateEtsyOrderItemTracking` |
| `GET` | `/api/etsy/` | Không | `getListOrders` |
| `POST` | `/api/etsy/` | Không | `createOrder` |
| `POST` | `/api/etsy/compute-base-cost` | Không | `computeBaseCostForEtsyOrder` |

## Auth

Các route có auth yêu cầu header:

```http
Authorization: Bearer <jwt_token>
```

Middleware `authenticateToken` sẽ:

- Đọc token từ `Authorization`.
- Verify bằng `process.env.JWT_SECRET`.
- Lấy user id từ `decoded.userId`, `decoded.id` hoặc `decoded.sub`.
- Load user từ MongoDB.
- Gắn thông tin vào `req.user`.

Một số API Scale/QC có phân quyền theo role:

- User role `Seller` chỉ được xem hoặc cập nhật order của chính seller đó.
- User role `Customer Service` chỉ thấy order được assign cho chính user đó ở một số danh sách.
- Role `Admin`, `Customer Service`, `Design Leader` không bị giới hạn kiểu seller-only.

## 1. Import Etsy Orders

```http
POST /api/etsy/import
Content-Type: multipart/form-data
```

Auth: Không.

### Request

Form data:

| Field | Type | Required | Mô tả |
|---|---|---:|---|
| `shopId` | string ObjectId | Có | ID shop cần import vào |
| `files` | file[] | Có | Tối đa 2 file CSV |

Route dùng:

```js
upload.array("files", 2)
```

File upload được lưu tạm vào thư mục:

```txt
tmp_uploads
```

### Nhận Diện Loại File

Hàm `detectFileType(rows)`:

- Nếu header có `Transaction ID` thì là file item.
- Nếu header có `Buyer User ID` thì là file order.
- Còn lại là `unknown`.

### Logic Với File Order

Upsert `EtsyOrder` theo:

```js
{ orderId: row["Order ID"], shopId }
```

Các field được cập nhật:

- `saleDate`: từ `Sale Date`
- `shippedAt`: từ `Date Shipped`
- `currency`: từ `Currency`
- `paymentMethod`: từ `Payment Method`
- `buyer.userId`: từ `Buyer User ID`
- `buyer.fullName`: từ `Full Name`
- `shipping.address1`: từ `Street 1`
- `shipping.address2`: từ `Street 2`
- `shipping.city`: từ `Ship City`
- `shipping.state`: từ `Ship State`
- `shipping.zipcode`: từ `Ship Zipcode`
- `shipping.country`: từ `Ship Country`
- `totals.orderValue`: từ `Order Value`
- `totals.shipping`: từ `Shipping`
- `totals.salesTax`: từ `Sales Tax`, có logic tự tính lại nếu tax bằng 0
- `totals.orderTotal`: từ `Order Total`
- `totals.fee`: fee tự tính theo công thức trong controller
- `totals.cardProcessingFees`: từ `Card Processing Fees`
- `totals.orderNet`: từ `Order Net`
- `totals.discountAmount`: từ `Discount Amount`

### Logic Với File Item

Với mỗi item row:

- Tạo order nếu chưa tồn tại theo `{ orderId, shopId }`.
- Lookup `EtsyListing` bằng SKU để lấy `IMAGE1` làm `baseImage.imageUrl`.
- Upsert item theo `items.transactionId`.
- Nếu chưa có item thì push vào `items`.
- Parse variations từ chuỗi `Variations`, dạng `key: value, key2: value2`.
- Detect seller code từ SKU bằng phần trước dấu `-`.
- Fill seller nếu order chưa có seller.
- Update `numberOfItems`.
- Validate address với Smarty nếu shipping country là US hoặc United States.
- Tự tính lại Etsy base cost bằng `calculateEtsyCost(order)`.

### Response Thành Công

```json
{
  "message": "Etsy Order import completed (multi-shop + seller preserved)",
  "stats": {
    "ordersUpserted": 0,
    "itemsProcessed": 0,
    "itemsCreated": 0,
    "sellerLinked": 0,
    "ordersCostComputed": 0
  }
}
```

### Lỗi Có Thể Gặp

```json
{ "message": "Valid shopId is required" }
```

```json
{ "message": "No files uploaded" }
```

```json
{ "error": "..." }
```

## 2. List Etsy Orders

```http
GET /api/etsy/
```

Auth: Không.

### Query

| Query | Type | Default | Mô tả |
|---|---|---|---|
| `page` | number | `1` | Trang hiện tại |
| `limit` | number | `20` | Số record mỗi trang, tối đa 200 |
| `from` | date | | Lọc `saleDate >= from` |
| `to` | date | | Lọc `saleDate <= to` |
| `search` | string | | Search order/customer/item/seller/shipping |
| `userNull` | string | | Nếu `true`, lọc order chưa có seller |
| `shippingType` | string | | Lọc `shipping_type` |
| `shopName` | string | | Lọc theo tên shop regex |
| `teamId` | string | | Lọc shop thuộc team |
| `status` | string | | Lọc order status |
| `isNoCostCenter` | string | | Nếu `true`, lọc order chưa có base cost |
| `sortBy` | string | `saleDate` | Field sort hợp lệ |
| `sortOrder` | string | `desc` | `asc` hoặc `desc` |

Các query có khai báo nhưng chưa thấy được dùng trong logic hiện tại:

- `platform`
- `noPsd`
- `openCase`

### Field Sort Hợp Lệ

```txt
saleDate
createdAt
updatedAt
base_cost
numberOfItems
orderId
status
```

Nếu truyền field khác, API fallback về `saleDate`.

### Search Áp Dụng Trên

- `orderId`
- `buyer.fullName`
- `buyer.userId`
- `items.sku`
- `items.itemName`
- `items.transactionId`
- `seller.sellerCode`
- `shipping.city`
- `shipping.state`
- `shipping.country`

### Response

```json
{
  "data": [
    {
      "orderId": "ETSY-001",
      "customer_infor": {
        "name": "Customer Name",
        "address": "Street 1",
        "address_2": "Street 2",
        "city": "New York",
        "state": "NY",
        "zip_code": "10001",
        "country": "United States"
      },
      "status": "New",
      "purchase_date": "2026-05-30T00:00:00.000Z",
      "createdAt": "2026-05-30T00:00:00.000Z",
      "shopId": "665...",
      "shopName": "Shop Name",
      "shipping_type": "Standard",
      "items": [
        {
          "orderItemId": "TX-001",
          "sku": "J2512-CONFIG-DATE",
          "title": "Product name",
          "quantity": 1,
          "version3Data": [
            {
              "label": "Size",
              "value": "L"
            }
          ],
          "baseImageUrl": "https://...",
          "listingId": "123",
          "cost_center": {
            "vendorProductId": "666...",
            "vendorProductDisplayName": "Vendor - Product",
            "sizeValue": "L",
            "colorValue": "Black"
          },
          "tracking_info": {},
          "scale_status": "Need Scale"
        }
      ],
      "base_cost": 0,
      "sumbittedoetsy": false,
      "address_validation": null,
      "seller": {
        "_id": "667...",
        "full_name": "Seller Name",
        "email": "seller@example.com"
      },
      "numberOfItems": 1
    }
  ],
  "totalCount": 1,
  "totalPages": 1,
  "currentPage": 1
}
```

## 3. Create Etsy Order

```http
POST /api/etsy/
Content-Type: application/json
```

Auth: Không.

### Body Tối Thiểu

```json
{
  "orderId": "ETSY-001",
  "shopId": "665000000000000000000000",
  "items": [
    {
      "transactionId": "TX-001",
      "sku": "J2512-CONFIG-DATE",
      "listingId": "123",
      "itemName": "Product name",
      "quantity": 1,
      "unitPrice": 19.99,
      "itemTotal": 19.99,
      "variations": {
        "Size": "L",
        "Color": "Black"
      },
      "baseImage": {
        "imageUrl": "https://example.com/image.jpg"
      }
    }
  ]
}
```

### Body Đầy Đủ Có Thể Gửi

```json
{
  "orderId": "ETSY-001",
  "shopId": "665000000000000000000000",
  "saleDate": "2026-05-30",
  "paidAt": "2026-05-30",
  "shippedAt": null,
  "status": "New",
  "orderType": "online",
  "listingsType": "physical",
  "paymentType": "card",
  "paymentMethod": "Etsy Payments",
  "currency": "USD",
  "buyer": {
    "userId": "buyer123",
    "fullName": "Customer Name",
    "firstName": "Customer",
    "lastName": "Name",
    "display": "Customer Name"
  },
  "seller": {
    "sellerId": "667000000000000000000000",
    "sellerCode": "J2512"
  },
  "coupon": {
    "code": "SALE10",
    "details": "10% off"
  },
  "shipping": {
    "name": "Customer Name",
    "address1": "Street 1",
    "address2": "Apt 2",
    "city": "New York",
    "state": "NY",
    "zipcode": "10001",
    "country": "United States"
  },
  "shipping_type": "Standard",
  "totals": {
    "orderValue": 19.99,
    "shipping": 4.99,
    "salesTax": 0,
    "orderTotal": 24.98,
    "cardProcessingFees": 1,
    "orderNet": 23.98,
    "fee": 2,
    "discountAmount": 0
  },
  "numberOfItems": 1,
  "items": [
    {
      "transactionId": "TX-001",
      "sku": "J2512-CONFIG-DATE",
      "listingId": "123",
      "itemName": "Product name",
      "quantity": 1,
      "unitPrice": 19.99,
      "itemTotal": 19.99,
      "variationsRaw": "Size: L, Color: Black",
      "variations": {
        "Size": "L",
        "Color": "Black"
      },
      "cost_breakdown": null,
      "baseImage": {
        "imageUrl": "https://example.com/image.jpg",
        "width": 1000,
        "height": 1000
      }
    }
  ]
}
```

### Shipping Type Hợp Lệ

```txt
SecondDay
Ground
Overnight
Economy
Standard
Expedited
```

Nếu không hợp lệ, API dùng default `Standard`.

### Logic Khi Order Đã Tồn Tại

Nếu tìm thấy order theo:

```js
{ orderId: payload.orderId, shopId: payload.shopId }
```

API không tạo mới mà backfill:

- Thêm item mới nếu `transactionId` chưa tồn tại.
- Điền các field item còn thiếu như `sku`, `listingId`, `itemName`, `variationsRaw`.
- Điền `baseImage.imageUrl` nếu đang thiếu.
- Điền `variations` nếu đang rỗng.
- Điền `cost_breakdown` nếu đang null.
- Điền `seller.sellerCode` nếu đang thiếu.
- Tính lại `numberOfItems`.

### Response Khi Tạo Mới

Trả về document `EtsyOrder`.

### Response Khi Trùng Và Backfill

```json
{
  "ok": true,
  "duplicated": true,
  "backfilled": true,
  "orderId": "ETSY-001",
  "updatedItems": 1,
  "addedItems": 0,
  "skuBackfilled": 1,
  "listingIdBackfilled": 1
}
```

### Lỗi Có Thể Gặp

```json
{ "message": "orderId is required" }
```

```json
{ "message": "shopId is required and must be a valid ObjectId" }
```

```json
{ "message": "items[0].transactionId is required" }
```

```json
{ "message": "Duplicate transactionId in items: TX-001" }
```

## 4. Etsy Order Statistics

```http
GET /api/etsy/statistic
```

Auth: Không.

### Query

| Query | Type | Mô tả |
|---|---|---|
| `shopId` | ObjectId | Lọc theo shop |
| `sellerCode` | string | Regex theo `seller.sellerCode` |
| `sellerId` | ObjectId | Lọc theo `seller.sellerId` |
| `from` | date | Lọc `saleDate >= from` |
| `to` | date | Lọc `saleDate <= to` |
| `search` | string | Search order, buyer, sku, itemName, sellerCode |
| `shipping_type` | string | Lọc shipping type |

### Response

```json
{
  "all": 100,
  "new": 20,
  "noCostCenter": 5,
  "fulfilled": 30,
  "shipped": 40,
  "cancelled": 2,
  "refund": 0,
  "invalidAddress": 1
}
```

### Cách Tính Một Số Chỉ Số

- `all`: tổng order match filter.
- `new`: status là `New`, rỗng hoặc null.
- `noCostCenter`: `base_cost` không tồn tại, null hoặc bằng 0, đồng thời status không phải `Cancelled`.
- `fulfilled`: status `Fulfilled`.
- `shipped`: status `Shipped`.
- `cancelled`: status `Cancelled`.
- `refund`: status `Refund`.
- `invalidAddress`: `address_validation.isValid` bằng false.

## 5. Compute Base Cost

```http
POST /api/etsy/compute-base-cost
Content-Type: application/json
```

Auth: Không.

### Body

```json
{
  "orderId": "ETSY-001"
}
```

Hoặc nếu order chưa tồn tại trong DB:

```json
{
  "orderId": "ETSY-001",
  "orderData": {
    "shopId": "665000000000000000000000",
    "items": [
      {
        "transactionId": "TX-001",
        "sku": "J2512-CONFIG-DATE",
        "quantity": 1,
        "variations": {
          "Size": "L"
        }
      }
    ]
  }
}
```

### Logic

- Tìm `EtsyOrder` theo `orderId`.
- Nếu không có order:
  - Nếu không truyền `orderData`, trả `404`.
  - Nếu có `orderData`, tạo order mới.
  - Nếu `orderData` thiếu `shopId`, API cố tìm một shop active làm default.
- Nếu order không có item, trả `400`.
- Gọi `calculateEtsyCost(order)`.
- Cập nhật `base_cost`, `base_cost_computed_at`, `base_cost_shipping_groups`, và `items[].cost_breakdown` trong quá trình tính.

### Response

```json
{
  "platform": "etsy",
  "orderId": "ETSY-001",
  "base_cost": 12.34,
  "preferred_vendor_id": "666000000000000000000000",
  "shipping_group_breakdowns": [],
  "detail": []
}
```

### Lỗi Có Thể Gặp

```json
{ "message": "Missing orderId" }
```

```json
{
  "message": "Etsy order not found in DB. Provide 'orderData' object to auto-import."
}
```

```json
{ "message": "Order has no items" }
```

## 6. Update Submitted To Etsy Flag

```http
PATCH /api/etsy/sumbittedoetsy
Content-Type: application/json
```

Auth: Không.

Lưu ý: tên route và field trong code đang bị typo là `sumbittedoetsy`.

### Body

```json
{
  "orderId": "ETSY-001",
  "shopId": "665000000000000000000000",
  "sumbittedoetsy": true
}
```

API cũng chấp nhận alias:

- `oderid` thay cho `orderId`
- `submittedToEtsy` thay cho `sumbittedoetsy`
- `submitted_to_etsy` thay cho `sumbittedoetsy`

### Response

```json
{
  "ok": true,
  "orderId": "ETSY-001",
  "shopId": "665000000000000000000000",
  "sumbittedoetsy": true,
  "updatedAt": "2026-05-30T00:00:00.000Z"
}
```

### Lỗi Có Thể Gặp

```json
{ "ok": false, "message": "orderId is required" }
```

```json
{ "ok": false, "message": "shopId is required" }
```

```json
{ "ok": false, "message": "shopId must be a valid ObjectId" }
```

```json
{ "ok": false, "message": "sumbittedoetsy must be true or false" }
```

## 7. Update Item Tracking

```http
PATCH /api/etsy/:orderId/items/:transactionId/tracking
PUT /api/etsy/:orderId/items/:transactionId/tracking
Content-Type: application/json
```

Auth: Không.

### Params

| Param | Mô tả |
|---|---|
| `orderId` | Etsy order ID |
| `transactionId` | Item transaction ID |

### Body

Gửi ít nhất một trong các field:

```json
{
  "fulfillment": "USPS",
  "tracking": "9400000000000000000000",
  "status": "Shipping",
  "note": "Tracking uploaded"
}
```

### Status Hợp Lệ

```txt
New
In progress
Fulfilled
Shipping
Shipped
Canceled
Cancelled
```

### Logic

- Nếu `status` là `Canceled` hoặc `Cancelled`, item status sẽ thành `Canceled`.
- Nếu có `tracking` không rỗng, item status sẽ thành `Shipped`.
- Nếu không có tracking, dùng `status` được gửi lên.
- Luôn cập nhật `items.$.tracking_info.updated_at`.
- Sau khi cập nhật item, API tính lại order `status` dựa trên tất cả item.

### Logic Tính Order Status Từ Items

- Nếu tất cả item active đều `Shipped`, order là `Shipped`.
- Nếu có item `Shipping`, order là `Shipping`.
- Nếu có item `Fulfilled`, order là `Fulfilled`.
- Nếu có item `In progress`, order là `In progress`.
- Nếu toàn bộ item bị cancel, order là `Canceled`.
- Mặc định là `New`.

### Response

```json
{
  "ok": true,
  "orderId": "ETSY-001",
  "shopId": "665000000000000000000000",
  "transactionId": "TX-001",
  "orderStatus": "Shipped",
  "tracking_info": {
    "fulfillment": "USPS",
    "tracking": "9400000000000000000000",
    "status": "Shipped",
    "note": "Tracking uploaded",
    "updated_at": "2026-05-30T00:00:00.000Z"
  },
  "applied": {
    "fulfillment": "USPS",
    "tracking": "9400000000000000000000",
    "status": "Shipped",
    "note": "Tracking uploaded"
  }
}
```

### Lỗi Có Thể Gặp

```json
{ "ok": false, "message": "orderId is required" }
```

```json
{ "ok": false, "message": "transactionId is required" }
```

```json
{
  "ok": false,
  "message": "No updatable fields provided (fulfillment/tracking/status/note)"
}
```

```json
{
  "ok": false,
  "message": "Invalid status",
  "allowed": ["New", "In progress", "Fulfilled", "Shipping", "Shipped", "Canceled", "Cancelled"]
}
```

## 8. Etsy Scale List

```http
GET /api/etsy/scale/list
Authorization: Bearer <token>
```

Auth: Có.

### Query

| Query | Type | Default | Mô tả |
|---|---|---|---|
| `page` | number | `1` | Trang hiện tại |
| `perPage` | number/string | `10` | Số record mỗi trang, nhận `all` |
| `from` | date | | Chỉ áp dụng khi có cả `from` và `to`, lọc `createdAt` |
| `to` | date | | Chỉ áp dụng khi có cả `from` và `to`, lọc `createdAt` |
| `scale_status` | string | | Lọc status tổng |
| `search` | string | | Search order/item/buyer/seller |
| `shopName` | string | | Lọc theo tên shop |
| `cs_unassigned` | string | | Nếu `true`, lọc order chưa assign CS |
| `cs_assignee_id` | ObjectId | | Lọc theo CS assignee |
| `cs_assignment_status` | string | | Lọc trạng thái assignment |
| `sellerId` | ObjectId | | Lọc seller, không áp dụng cho seller-only user |

### Active Status Cho Scale

Nếu không truyền `scale_status`, API chỉ lấy:

```txt
Need Scale
Pending
Sent
QC Rejected
```

Nếu `scale_status=all`, API cũng lấy nhóm active trên.

Nếu `scale_status=Pending`, API chỉ giữ lại các item có `scale_status = Pending` trong response.

### Search Áp Dụng Trên

- `orderId`
- `items.sku`
- `items.transactionId`
- `items.itemName`
- `buyer.fullName`
- `buyer.display`
- `shipping.name`
- `sellerUser.full_name`
- `sellerUser.email`

### Response

```json
{
  "data": [
    {
      "orderId": "ETSY-001",
      "shopId": "665000000000000000000000",
      "shopName": "Shop Name",
      "status": "New",
      "saleDate": "2026-05-30T00:00:00.000Z",
      "createdAt": "2026-05-30T00:00:00.000Z",
      "shipping_type": "Standard",
      "customer_infor": {
        "email": "",
        "name": "Customer Name",
        "address": "Street 1",
        "address_2": "Street 2",
        "city": "New York",
        "state": "NY",
        "zip_code": "10001",
        "country": "United States",
        "phone_number": ""
      },
      "buyer": {},
      "shipping": {},
      "items": [
        {
          "orderItemId": "TX-001",
          "transactionId": "TX-001",
          "listingId": "123",
          "sku": "J2512-CONFIG-DATE",
          "title": "Product name",
          "itemName": "Product name",
          "quantity": 1,
          "variations": {
            "Size": "L"
          },
          "variationsRaw": "Size: L",
          "baseImageUrl": "https://...",
          "cost_center": {
            "vendorProductId": "666...",
            "sizeValue": "L",
            "colorValue": "Black",
            "vendorProductSKU": "SKU"
          },
          "tracking_info": {},
          "fulfillment_file": {},
          "scale_status": "Need Scale",
          "qc_note": "",
          "cs_note": ""
        }
      ],
      "base_cost": 0,
      "address_validation": null,
      "scale_overall_status": "Need Scale",
      "scaledBy": null,
      "cs_assignment_status": "Unassigned",
      "csAssignedAt": null,
      "cs_assignee": null,
      "seller": null
    }
  ],
  "totalCount": 1,
  "totalPages": 1,
  "currentPage": 1
}
```

## 9. Etsy QC List

```http
GET /api/etsy/qc/list
Authorization: Bearer <token>
```

Auth: Có.

Query giống `/api/etsy/scale/list`.

### Active Status Cho QC

Nếu không truyền `scale_status`, API chỉ lấy:

```txt
Pending
Sent
QC Rejected
Ready
Address Invalid
```

Sort theo:

```js
{ createdAt: -1 }
```

Response format giống `/scale/list`.

## 10. Etsy Scale Statistics

```http
GET /api/etsy/scale/statistics
Authorization: Bearer <token>
```

Auth: Có.

Query giống `/scale/list`.

### Response

```json
{
  "overall": {
    "totalOrders": 10,
    "counts": {
      "Need Scale": 2,
      "Pending": 3,
      "Ready": 0,
      "Sent": 1,
      "Failed": 0,
      "QC Rejected": 4,
      "Other": 0,
      "All": 10
    }
  },
  "breakdown": [],
  "timeseries": []
}
```

### Ghi Chú

`Pending` trong response ưu tiên dùng số order có ít nhất một pending item (`pendingAdj`) thay vì chỉ count theo `scale_overall_status = Pending`.

`All` được tính bằng:

```txt
Need Scale + Pending + Sent + QC Rejected
```

## 11. Etsy QC Statistics

```http
GET /api/etsy/qc/statistics
Authorization: Bearer <token>
```

Auth: Có.

Query giống `/qc/list`.

### Response

```json
{
  "overall": {
    "totalOrders": 8,
    "counts": {
      "Need Scale": 0,
      "Pending": 2,
      "Ready": 3,
      "Sent": 1,
      "Failed": 0,
      "QC Rejected": 1,
      "Address Invalid": 1,
      "Other": 0,
      "All": 8
    }
  }
}
```

`All` được tính bằng:

```txt
Pending + Sent + QC Rejected + Ready + Address Invalid
```

## 12. Upload Etsy Fulfillment File For Item

```http
POST /api/etsy/:orderId/items/:transactionId/fulfillment-file
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Auth: Có.

### Params

| Param | Mô tả |
|---|---|
| `orderId` | Etsy order ID |
| `transactionId` | Item transaction ID |

### Query Hoặc Body

Có thể truyền `shopId` để lookup order chính xác:

```txt
?shopId=665000000000000000000000
```

hoặc trong body multipart:

```txt
shopId=665000000000000000000000
```

### Form Data

| Field | Type | Required | Mô tả |
|---|---|---:|---|
| `files` | file[] | Có | File fulfillment cần upload |
| `meta` | JSON string | Có | Mảng metadata, số phần tử phải bằng số file |

Ví dụ `meta`:

```json
[
  { "position": "front" },
  { "position": "back" }
]
```

### Logic

- Validate có file.
- Parse `meta`.
- Số lượng `meta` phải bằng số file.
- Tìm order theo `orderId`, có thêm `shopId` nếu được truyền.
- Check quyền seller-only.
- Tìm item theo `transactionId`.
- Upload từng file lên R2.
- Lưu URL vào `item.fulfillment_file[position]`.
- Set `item.scale_status = Pending`.
- Tính lại `order.scale_overall_status`.
- Gắn `order.scaleId` bằng user hiện tại.

### Response

```json
{
  "message": "Uploaded Etsy fulfillment files successfully",
  "fulfillment_file": {
    "front": "https://...",
    "back": "https://..."
  },
  "item_scale_status": "Pending",
  "order_scale_overall_status": "Pending"
}
```

### Lỗi Có Thể Gặp

```json
{ "message": "Missing files" }
```

```json
{ "message": "Invalid meta JSON" }
```

```json
{ "message": "Files count not match positions" }
```

```json
{ "message": "Etsy order not found" }
```

```json
{ "message": "Etsy order item not found" }
```

```json
{ "message": "You can only access your own Etsy orders" }
```

## 13. Confirm Etsy Scale For Item

```http
POST /api/etsy/:orderId/items/:transactionId/scale/confirm
Authorization: Bearer <token>
Content-Type: application/json
```

Auth: Có.

### Params

| Param | Mô tả |
|---|---|
| `orderId` | Etsy order ID |
| `transactionId` | Item transaction ID |

### Query Hoặc Body

Có thể truyền `shopId` để lookup chính xác.

### Body

```json
{
  "decision": "approve",
  "note": "File OK"
}
```

`decision` hợp lệ:

```txt
approve
reject
```

### Logic Khi Reject

- Set `item.scale_status = QC Rejected`.
- Xóa `item.fulfillment_file`.
- Nếu có `note`, lưu vào `item.qc_note`.
- Set `order.scale_overall_status = QC Rejected`.

### Logic Khi Approve

- Bắt buộc item phải có fulfillment file.
- Set `item.scale_status = Complete`.
- Nếu có `note`, lưu vào `item.qc_note`.
- Tính lại `order.scale_overall_status`.
- Nếu order đáng lẽ `Ready` nhưng `address_validation.isValid === false`, chuyển thành `Address Invalid`.

### Response Approve

```json
{
  "message": "Etsy item approved. Order is Ready.",
  "item_scale_status": "Complete",
  "qc_note": "File OK",
  "order_scale_overall_status": "Ready"
}
```

### Response Reject

```json
{
  "message": "Etsy scale rejected. Item set to QC Rejected.",
  "item_scale_status": "QC Rejected",
  "qc_note": "Need fix",
  "order_scale_overall_status": "QC Rejected"
}
```

### Lỗi Có Thể Gặp

```json
{ "message": "Invalid decision. Must be \"approve\" or \"reject\"." }
```

```json
{ "message": "Missing print files. Please upload fulfillment_file before approval." }
```

## 14. Update CS Note For Item

```http
PUT /api/etsy/:orderId/items/:transactionId/cs-note
Authorization: Bearer <token>
Content-Type: application/json
```

Auth: Có.

### Body

```json
{
  "cs_note": "Customer requested address update"
}
```

Giới hạn:

```txt
Tối đa 2000 ký tự
```

### Response

```json
{
  "message": "Etsy cs_note updated.",
  "orderId": "ETSY-001",
  "transactionId": "TX-001",
  "cs_note": "Customer requested address update"
}
```

## 15. Update QC Note For Item

```http
PUT /api/etsy/:orderId/items/:transactionId/qc-note
Authorization: Bearer <token>
Content-Type: application/json
```

Auth: Có.

### Body

```json
{
  "qc_note": "Artwork is low resolution"
}
```

Giới hạn:

```txt
Tối đa 2000 ký tự
```

### Response

```json
{
  "message": "Etsy qc_note updated.",
  "orderId": "ETSY-001",
  "transactionId": "TX-001",
  "qc_note": "Artwork is low resolution"
}
```

## 16. Manual Vendor Mapping

```http
PUT /api/etsy/manual-mapping
Authorization: Bearer <token>
Content-Type: application/json
```

Auth: Có.

Controller dùng chung: `orderCustomProductController.applyManualVendorMapping`.

API này xử lý cả order thường và Etsy order:

- Tìm `OrderCustomProduct` theo `orderId` trước.
- Nếu không có, tìm `EtsyOrder`.
- Với Etsy order, item match bằng `transactionId` hoặc `orderItemId`.

### Body Cho Etsy

```json
{
  "orderId": "ETSY-001",
  "forcedVendorId": "666000000000000000000000",
  "items": [
    {
      "transactionId": "TX-001",
      "vendorCostCenterId": "667000000000000000000000"
    }
  ]
}
```

Hoặc:

```json
{
  "orderId": "ETSY-001",
  "items": [
    {
      "orderItemId": "TX-001",
      "vendorCostCenterId": null
    }
  ]
}
```

### Logic Với Etsy Order

- Cập nhật `etsyOrder.forced_vendor_id` nếu có `forcedVendorId`.
- Với từng item override:
  - Tìm item theo `transactionId` hoặc `orderItemId`.
  - Set `item.manual_vendor_cost_center_id = vendorCostCenterId`.
  - Nếu `vendorCostCenterId` rỗng, set `item.cost_breakdown = null`.
- Save order.
- Ghi order history với action `UPDATE_MANUAL_VENDOR_MAPPING`.
- Gọi lại `computeBaseCostForEtsyOrder`.

### Response Etsy

```json
{
  "message": "Manual mapping applied successfully",
  "platform": "etsy",
  "orderId": "ETSY-001",
  "computed_info": {
    "platform": "etsy",
    "orderId": "ETSY-001",
    "base_cost": 12.34
  }
}
```

### Lỗi Có Thể Gặp

```json
{ "message": "orderId is required" }
```

```json
{ "message": "Order not found" }
```

## Model EtsyOrder

Schema chính trong `src/models/etsyOrder.model.js`.

### Order Fields Chính

```txt
orderId
shopId
saleDate
paidAt
shippedAt
status
orderType
listingsType
paymentType
paymentMethod
currency
buyer
seller
coupon
shipping
shipping_type
totals
base_cost
base_cost_computed_at
base_cost_shipping_groups
scale_overall_status
scaleId
csAssigneeId
csAssignedBy
csAssignedAt
cs_assignment_status
forced_vendor_id
numberOfItems
sumbittedoetsy
items
address_validation
createdAt
updatedAt
```

### Buyer

```json
{
  "userId": "buyer123",
  "fullName": "Customer Name",
  "firstName": "Customer",
  "lastName": "Name",
  "display": "Customer Name"
}
```

### Seller

```json
{
  "sellerId": "667000000000000000000000",
  "sellerCode": "J2512"
}
```

Seller code được derive từ SKU bằng phần trước dấu `-`.

Ví dụ:

```txt
J2512-CONFIG-DATE
```

Seller code:

```txt
J2512
```

### Shipping

```json
{
  "name": "Customer Name",
  "address1": "Street 1",
  "address2": "Apt 2",
  "city": "New York",
  "state": "NY",
  "zipcode": "10001",
  "country": "United States"
}
```

### Totals

```txt
orderValue
shipping
salesTax
orderTotal
cardProcessingFees
orderNet
fee
adjustedOrderTotal
adjustedCardProcessingFees
adjustedNet
adjustedOrderValue
adjustedShipping
adjustedSalesTax
orderShipping
orderSalesTax
discountAmount
shippingDiscount
inPersonDiscount
vatPaidByBuyer
```

### Item Fields

```txt
transactionId
listingId
sku
itemName
quantity
unitPrice
itemTotal
variationsRaw
variations
cost_breakdown
baseImage
tracking_info
fulfillment_file
scale_status
qc_note
cs_note
manual_vendor_cost_center_id
```

### Tracking Info

```json
{
  "fulfillment": "USPS",
  "tracking": "9400000000000000000000",
  "status": "Shipped",
  "note": "Tracking uploaded",
  "updated_at": "2026-05-30T00:00:00.000Z"
}
```

### Fulfillment File

`fulfillment_file` là Map string-string:

```json
{
  "front": "https://...",
  "back": "https://..."
}
```

### Scale Status Của Item

Enum trong model:

```txt
Need Scale
Pending
Complete
QC Rejected
Cancelled
```

### Scale Overall Status Của Order

Enum trong model:

```txt
Need Scale
Pending
Ready
Sent
Failed
QC Rejected
Cancelled
Address Invalid
```

## Index Quan Trọng

```js
EtsyOrderSchema.index({ shopId: 1, orderId: 1 }, { unique: true });
EtsyOrderSchema.index({ shopId: 1, "items.listingId": 1 });
EtsyOrderSchema.index({ shopId: 1, "items.sku": 1 });
EtsyOrderSchema.index({ saleDate: -1 });
EtsyOrderSchema.index({ "items.sku": 1 });
EtsyOrderSchema.index({ "items.listingId": 1 });
EtsyOrderSchema.index({ saleDate: 1, "items.sku": 1 });
```

## Ghi Chú Rủi Ro Và Điểm Cần Rà Soát

1. Nhiều endpoint liên quan dữ liệu đơn hàng chưa có auth:
   - `POST /api/etsy/import`
   - `GET /api/etsy/statistic`
   - `PATCH /api/etsy/sumbittedoetsy`
   - `PATCH/PUT /api/etsy/:orderId/items/:transactionId/tracking`
   - `GET /api/etsy/`
   - `POST /api/etsy/`
   - `POST /api/etsy/compute-base-cost`

2. Route và field `sumbittedoetsy` đang bị typo. Nếu frontend/backend đã dùng ổn định thì nên giữ tương thích, nhưng nên cân nhắc thêm alias chuẩn `submitted-to-etsy` hoặc `submittedToEtsy`.

3. `updateEtsyOrderItemTracking` lookup theo `orderId` và `transactionId`, không lọc `shopId`. Nếu nhiều shop có cùng `orderId`, có thể update nhầm.

4. `computeBaseCostForEtsyOrder` cũng tìm order bằng `orderId` בלבד, không lọc `shopId`. Đây là rủi ro tương tự nếu order ID trùng giữa nhiều shop.

5. `importOrders` có `stats.ordersUpserted` và `stats.itemsCreated`, nhưng logic hiện tại không tăng hai biến này rõ ràng trong các đoạn đã đọc.

6. `createOrder` không tự gọi validate address hoặc compute cost sau khi tạo mới. Import CSV thì có, create thủ công thì không thấy gọi trực tiếp.

7. `scale_status` item có enum `Complete`, nhưng các API list/statistics map overall status dùng `Ready` cho order-level. Cần phân biệt rõ:
   - Item done: `Complete`
   - Order ready: `Ready`

8. File controller có một số comment bị lỗi encoding tiếng Việt, không ảnh hưởng runtime nhưng gây khó đọc.

