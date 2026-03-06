# LNG MERCH - PROJECT FLOWS DOCUMENTATION

## 📋 MỤC LỤC
1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Authentication Flow](#1-authentication-flow)
3. [Order Management Flow](#2-order-management-flow)
4. [Fulfillment/Scale Flow](#3-fulfillmentscale-flow)
5. [Design Task Flow](#4-design-task-flow)
6. [Cost Center Flow](#5-cost-center-flow)
7. [Vendor Management Flow](#6-vendor-management-flow)
8. [Reporting Flow](#7-reporting-flow)
9. [Listing Management Flow](#8-listing-management-flow)
10. [Extension Flow](#9-extension-flow)
11. [Real-time Updates](#10-real-time-updates)

---

## TỔNG QUAN HỆ THỐNG

### Tech Stack
- **Frontend**: React 19 + Vite
- **Routing**: React Router v7
- **State Management**: React Context + TanStack React Query
- **UI Framework**: Ant Design + Tailwind CSS
- **Real-time**: Socket.io
- **API**: Axios với JWT interceptor
- **i18n**: i18next (EN/VI)

### Kiến trúc
```
src/
├── apis/          # API modules (18 modules)
├── components/    # Reusable components
├── context/       # AuthContext, OrderContext
├── hooks/         # useOrders, useDebounce
├── layouts/       # MainLayout, PrivateRoute
├── pages/         # Feature pages
├── routes/        # Route definitions
└── utils/         # Helpers, constants
```

### Roles trong hệ thống
- **Admin**: Full access
- **Seller**: Quản lý orders, listings
- **Designer**: Design tasks
- **Customer Service**: Order support
- **Production**: Fulfillment operations
- **Design Leader**: Manage design team

---

## 1. AUTHENTICATION FLOW

### 1.1 Login Process
```
User Input (username/password)
    ↓
POST /api/auth/login
    ↓
Receive JWT token + user info
    ↓
Store in localStorage
    ↓
AuthContext updates (user, accessToken, roles)
    ↓
Navigate to /order/amazon
```

### 1.2 Protected Routes
```
User access route
    ↓
PrivateRoute checks:
    - accessToken exists?
    - User role allowed?
    ↓
Yes → Render page
No → Redirect to /login or /unauthorized
```

### 1.3 Token Management
- Token stored: `localStorage.getItem('accessToken')`
- Auto-attach to headers: `Authorization: Bearer {token}`
- Logout: Clear localStorage + redirect

### Files liên quan
- `src/context/AuthContext.jsx`
- `src/layouts/PrivateRoute.jsx`
- `src/pages/login/index.jsx`
- `src/apis/auth.js`

---

## 2. ORDER MANAGEMENT FLOW

### 2.1 Order Lifecycle
```
NEW ORDER
    ↓
Import từ Amazon/Etsy hoặc Manual Input
    ↓
PAYMENT PENDING (nếu cần)
    ↓
Assign Cost Center
    ↓
Assign PSD/Design
    ↓
FULFILLED (production complete)
    ↓
Add Tracking Number
    ↓
SHIPPED
    ↓
COMPLETED / CANCELLED
```

### 2.2 Order Status Flow


| Status | Mô tả | Action |
|--------|-------|--------|
| **New** | Order mới import | Assign cost center, PSD |
| **NoCostCenter** | Chưa có cost center | Cần config cost center |
| **noPsd** | Chưa có design | Request PSD task |
| **paymentPending** | Chờ thanh toán | Verify payment |
| **Fulfilled** | Đã hoàn thành production | Add tracking |
| **Shipped** | Đã gửi hàng | Monitor delivery |
| **Cancelled** | Đã hủy | Process refund |
| **openCase** | Có vấn đề | Customer service handle |
| **invalidAddress** | Địa chỉ không hợp lệ | Update address |

### 2.3 Order Operations

#### Import Orders
```
Click "Import" button
    ↓
Select platform (Amazon/Etsy)
    ↓
Upload CSV/Excel file
    ↓
POST /api/order/import
    ↓
Validate data
    ↓
Create orders in database
    ↓
Refresh order list
```

#### Update Order
```
Select order → Edit fields
    ↓
Update: Customer info, Shipping type, Notes, Custom fields
    ↓
PUT /api/order/:id
    ↓
Real-time update via Socket.io
    ↓
Refresh UI
```

#### Replace Order
```
Select order → Click "Replace"
    ↓
POST /api/order/replace/:id
    ↓
Create new order with same info
    ↓
Mark old order as replaced
    ↓
Update both orders
```

#### Retest Basecode
```
Order có issue → Click "Retest"
    ↓
POST /api/order/retest-basecode
    ↓
Re-validate order data
    ↓
Update status
```

### 2.4 Filtering & Search
- Filter by status (All, New, Fulfilled, Shipped, etc.)
- Date range picker (from/to)
- Search by Order ID, Customer name, SKU
- Filter by Shop (multi-store)
- Filter by Team (Group Standards)

### 2.5 Real-time Features
- Auto-refresh every 5 minutes
- Socket.io updates on status change
- Last updated timestamp display
- Sync vendor tracking automatically

### Files liên quan
- `src/pages/home/index.jsx` (Amazon orders)
- `src/pages/home/OrderEtsy.jsx` (Etsy orders)
- `src/apis/order.js`
- `src/context/OrderContext.jsx`
- `src/hooks/useOrders.jsx`

---

## 3. FULFILLMENT/SCALE FLOW

### 3.1 Fulfillment Lifecycle
```
Orders từ Order Management
    ↓
Filter orders cần fulfill
    ↓
SCALE PENDING
    ↓
Group orders theo team
    ↓
SCALE PROCESSING
    ↓
Production team xử lý
    ↓
SCALED (hoàn thành production)
    ↓
QC VALIDATION
    ↓
QC Pass → Update tracking → FULFILLED
QC Reject → Back to production
```

### 3.2 Scale Status Flow

| Status | Mô tả | Next Action |
|--------|-------|-------------|
| **Pending** | Chờ xử lý | Assign to team |
| **Processing** | Đang xử lý | Production work |
| **Scaled** | Đã scale xong | QC check |
| **QC Pending** | Chờ QC | QC review |
| **QC Passed** | QC đạt | Add tracking |
| **QC Rejected** | QC không đạt | Rework |
| **Fulfilled** | Hoàn thành | Ship order |

### 3.3 QC Process
```
Order scaled xong
    ↓
Navigate to /fulfillment/qc
    ↓
QC reviewer checks:
    - Product quality
    - Images uploaded
    - Specifications match
    ↓
QC Decision:
    PASS → Status = QC Passed → Add tracking
    REJECT → Status = QC Rejected → Add notes → Back to production
    ↓
Update order status
    ↓
Notify production team
```

### 3.4 Image Upload
```
Select order item
    ↓
Click "Upload Images"
    ↓
DynamicImageUpload component
    ↓
Upload multiple images
    ↓
POST /api/order/upload-images
    ↓
Store image URLs
    ↓
Display in order details
```

### 3.5 Tracking Management
```
Order fulfilled
    ↓
Add tracking number
    ↓
PUT /api/order/tracking
    ↓
Sync with vendor system
    ↓
POST /api/order/sync-vendor-tracking
    ↓
Update order status to SHIPPED
    ↓
Customer notification (if enabled)
```

### Files liên quan
- `src/pages/fulfillment/index.jsx`
- `src/pages/fulfillment/QC.jsx`
- `src/pages/fulfillment/ScaleEsty.jsx`
- `src/components/DynamicImageUpload.jsx`

---

## 4. DESIGN TASK FLOW

### 4.1 Design Task Types
1. **PSD Tasks**: Photoshop design files
2. **PNG Tasks**: PNG export/optimization
3. **Idea Tasks**: Concept/brainstorming

### 4.2 PSD Task Lifecycle
```
Order cần design
    ↓
REQUEST PSD TASK
    ↓
POST /api/psd-task/create
    ↓
Status: NEW
    ↓
Design Leader assigns to Designer
    ↓
Status: ASSIGNED
    ↓
Designer starts work
    ↓
Status: IN PROGRESS
    ↓
Designer uploads PSD file
    ↓
Status: UPLOADED
    ↓
QC Review:
    PASS → Status: QC PASSED → Link to order
    REJECT → Status: QC REJECTED → Back to designer
    ↓
Task completed
```

### 4.3 Task Status Flow

| Status | Mô tả | Role |
|--------|-------|------|
| **New** | Task mới tạo | System |
| **Requested** | Đã request design | Seller/CS |
| **Assigned** | Đã assign designer | Design Leader |
| **In Progress** | Designer đang làm | Designer |
| **Uploaded** | Đã upload file | Designer |
| **QC Rejected** | QC không đạt | QC |
| **QC Passed** | QC đạt | QC |

### 4.4 Priority Levels
- **Easy**: Simple designs
- **Low**: Standard priority
- **Normal**: Default priority
- **High**: Urgent orders
- **Urgent**: Critical/rush orders
- **Hard**: Complex designs
- **Extremely**: Very complex

### 4.5 Task Assignment
```
Design Leader view tasks
    ↓
Filter by status/priority
    ↓
Select task → Click "Assign"
    ↓
ModalAssign opens
    ↓
Select designer from list
    ↓
POST /api/psd-task/assign
    ↓
Update task status to ASSIGNED
    ↓
Notify designer
```

### 4.6 Designer Workflow
```
Designer login
    ↓
View assigned tasks (/design/psd)
    ↓
Filter: My Tasks
    ↓
Start task → Status: IN PROGRESS
    ↓
Work on design
    ↓
Upload PSD file
    ↓
POST /api/psd-task/upload
    ↓
Status: UPLOADED
    ↓
Wait for QC
```

### 4.7 Points System
```
Task completed (QC Passed)
    ↓
Calculate points based on:
    - Priority level
    - Complexity
    - Time taken
    ↓
POST /api/point/add
    ↓
Update designer points
    ↓
View in /design/points dashboard
```

### Files liên quan
- `src/pages/design/PSDTasks.jsx`
- `src/pages/design/PNGTasks.jsx`
- `src/pages/design/IdeaTask.jsx`
- `src/pages/design/PointsDashboard.jsx`
- `src/apis/psdTask.js`
- `src/apis/point.js`

---

## 5. COST CENTER FLOW

### 5.1 Cost Center Structure
```
Cost Center
    ├── Product Types (Mug, Shirt, Hat, etc.)
    │   ├── Base Cost
    │   ├── Shipping Cost
    │   └── Extra Costs
    ├── Vendor Mapping
    └── Team Assignment
```

### 5.2 Config Flow
```
Navigate to /cost-center/config
    ↓
View all cost center configs
    ↓
Add New Config:
    - Product Type
    - Base Cost
    - Shipping Cost
    - Extra Costs (optional)
    - Vendor
    ↓
POST /api/config/create
    ↓
Save configuration
```

### 5.3 Product Type Management
```
Navigate to /cost-center/product-types
    ↓
View all product types
    ↓
Add Product Type:
    - Name (Mug, Shirt, etc.)
    - Category
    - Default costs
    ↓
POST /api/config/product-type
    ↓
Link to vendors
```

### 5.4 Mapping Flow
```
Navigate to /cost-center/mapping
    ↓
Map SKU to Cost Center:
    - Platform SKU
    - Internal SKU
    - Cost Center
    - Product Type
    ↓
POST /api/sku-mapping/create
    ↓
Auto-assign cost center when order imported
```

### 5.5 Group Standards (Teams)
```
Navigate to /cost-center/group-standards
    ↓
Create Team:
    - Team Name
    - Members
    - Cost allocation rules
    ↓
POST /api/teams/create
    ↓
Assign orders to team
    ↓
Track team performance
```

### 5.6 Cost Calculation
```
Order imported
    ↓
Lookup SKU in mapping
    ↓
Get Cost Center config
    ↓
Calculate total cost:
    Total = (Base Cost + Shipping + Extras) × Quantity
    ↓
Store in order.lngCost
    ↓
Use for profit calculation
```

### Files liên quan
- `src/pages/cost_center/CostCenterConfig.jsx`
- `src/pages/cost_center/index.jsx` (Product Types)
- `src/pages/cost_center/Mapping.jsx`
- `src/pages/cost_center/Teams.jsx`
- `src/apis/config.js`
- `src/apis/skuMapping.js`
- `src/apis/teams.js`

---

## 6. VENDOR MANAGEMENT FLOW

### 6.1 Vendor Lifecycle
```
Add Vendor
    ↓
POST /api/vendor/create
    - Vendor Name
    - Contact Info
    - Payment Terms
    ↓
Add Vendor Products
    ↓
POST /api/vendor/products
    - Product Name
    - SKU
    - Cost
    - Lead Time
    ↓
Link to Cost Centers
    ↓
Assign to Orders
```

### 6.2 Vendor Product Management
```
Navigate to /vendor/vendor-products
    ↓
View all vendor products
    ↓
Add Product:
    - Select Vendor
    - Product details
    - Pricing
    - Cost Center link
    ↓
POST /api/vendor/product/create
    ↓
Available for order assignment
```

### 6.3 Tracking Sync
```
Order fulfilled by vendor
    ↓
Vendor updates tracking
    ↓
POST /api/order/sync-vendor-tracking
    ↓
Fetch tracking from vendor API
    ↓
Update order tracking
    ↓
Real-time update via Socket.io
    ↓
Notify customer
```

### 6.4 Vendor Cost Center
```
Navigate to /vendor/vendor-products/:id
    ↓
View product cost center details
    ↓
Update costs:
    - Base cost
    - Shipping
    - Extras
    ↓
PUT /api/vendor/cost-center/:id
    ↓
Affects future orders
```

### Files liên quan
- `src/pages/vendor/index.jsx`
- `src/pages/vendor/VendorProduct.jsx`
- `src/pages/vendor/ProductCostCenter.jsx`
- `src/apis/vendor.js`

---

## 7. REPORTING FLOW

### 7.1 Order Cost Report
```
Navigate to /report/orders-cost
    ↓
Select date range
    ↓
GET /api/report/order-cost-statistics
    ↓
Display KPIs:
    - Total Orders
    - Revenue (order total)
    - LNG Cost (internal cost)
    - Vendor Cost
    - Profit (Revenue - LNG Cost - Vendor Cost)
    - Refunds
    - Profit Margin %
    ↓
Table view: Order details with cost breakdown
    ↓
Export to Excel
```

### 7.2 Sales Report
```
Navigate to /report/sale
    ↓
Select date range
    ↓
GET /api/report/sales
    ↓
Display charts:
    - Daily sales trend
    - Top products
    - Sales by category
    ↓
Summary statistics
```

### 7.3 Etsy Reports
```
Navigate to /report/sale-etsy or /report/order-cost-etsy
    ↓
Filter Etsy orders only
    ↓
GET /api/report/etsy-sales
    ↓
Etsy-specific metrics:
    - Listing performance
    - Shop statistics
    - Etsy fees
    ↓
Chart adapters for visualization
```

### 7.4 Ads Report
```
Navigate to /report/ads
    ↓
GET /api/report/ads
    ↓
Display ad campaign data:
    - Spend
    - Impressions
    - Clicks
    - Conversions
    - ROAS (Return on Ad Spend)
    ↓
Campaign comparison
```

### 7.5 Export Flow
```
View report
    ↓
Click "Export" button
    ↓
POST /api/report/export
    - Report type
    - Date range
    - Filters
    ↓
Generate Excel file
    ↓
Download file
```

### Files liên quan
- `src/pages/report/ReportOrderCost.jsx`
- `src/pages/report/SaleReport.jsx`
- `src/pages/report/etsy/EtsySaleReport.jsx`
- `src/pages/report/etsy/EtsyOrderCost.jsx`
- `src/pages/report/AdsReport.jsx`
- `src/apis/report.js`

---

## 8. LISTING MANAGEMENT FLOW

### 8.1 Listing Lifecycle
```
Create/Import Listing
    ↓
POST /api/listing/create or /import
    ↓
Listing Details:
    - Title
    - SKU
    - Price
    - Platform (Amazon/Etsy)
    - Images
    - Description
    ↓
Link to Cost Center
    ↓
Status: ACTIVE
    ↓
Sync with platform
    ↓
Orders reference listing
```

### 8.2 Import Listings
```
Navigate to /sales/listing
    ↓
Click "Import"
    ↓
ModalImportListing opens
    ↓
Upload CSV/Excel:
    - Platform
    - Listing data
    ↓
POST /api/listing/import
    ↓
Validate and create listings
    ↓
Refresh listing table
```

### 8.3 Update Listing
```
Select listing → Click "Edit"
    ↓
ModalUpdateListing opens
    ↓
Update fields:
    - Price
    - Quantity
    - Description
    - Images
    ↓
PUT /api/listing/:id
    ↓
Sync with platform (optional)
```

### 8.4 Listing Actions
- **Activate/Deactivate**: Toggle listing status
- **Delete**: Remove listing
- **Duplicate**: Create copy
- **Sync**: Update from platform

### Files liên quan
- `src/pages/listing/index.jsx`
- `src/pages/listing/ModalAddListing.jsx`
- `src/pages/listing/ModalImportListing.jsx`
- `src/pages/listing/ModalUpdateListing.jsx`
- `src/apis/listing.js`

---

## 9. EXTENSION FLOW

### 9.1 Extension Manager
```
Navigate to /extensions
    ↓
View installed extensions
    ↓
Manage:
    - Client connections
    - API keys
    - Webhooks
    ↓
Configure extension settings
```

### 9.2 Confirm Ship Extension
```
Navigate to /extensions/confirm-ship
    ↓
View orders ready to ship
    ↓
Select orders
    ↓
Click "Confirm Ship"
    ↓
POST /api/extension/confirm-ship
    ↓
Update order status
    ↓
Send confirmation to platform
```

### 9.3 Store Management
```
Navigate to /manage_stores
    ↓
View connected stores
    ↓
Add Store:
    - Platform (Amazon/Etsy/Shopify)
    - Store name
    - API credentials
    ↓
POST /api/shop/create
    ↓
Test connection
    ↓
Enable store
```

### Files liên quan
- `src/pages/extension/index.jsx`
- `src/pages/extension/ConfirmShip.jsx`
- `src/pages/shop/ManageStore.jsx`
- `src/apis/shop.js`

---

## 10. REAL-TIME UPDATES

### 10.1 Socket.io Integration
```
User login
    ↓
Connect to Socket.io server
    ↓
src/apis/socketio.js
    ↓
Listen to events:
    - order:updated
    - task:assigned
    - tracking:synced
    - qc:completed
    ↓
Update UI in real-time
```

### 10.2 Event Types
| Event | Trigger | Action |
|-------|---------|--------|
| `order:updated` | Order status change | Refresh order list |
| `task:assigned` | Design task assigned | Notify designer |
| `tracking:synced` | Vendor tracking update | Update tracking display |
| `qc:completed` | QC review done | Update task status |
| `import:completed` | Bulk import finished | Refresh data |

### 10.3 Real-time Components
- **RealtimeLogViewer**: View live logs
- **OrderLogPopover**: Show order history
- Auto-refresh indicators
- Last updated timestamps

### Files liên quan
- `src/apis/socketio.js`
- `src/components/RealtimeLogViewer.jsx`
- `src/components/OrderLogPopover.jsx`

---

## 📊 DATA FLOW SUMMARY

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Import Orders  │◄──── Amazon/Etsy API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Assign Cost     │◄──── Cost Center Config
│ Center & PSD    │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  Design Tasks   │  │  Fulfillment    │
│  (PSD/PNG)      │  │  (Scale/QC)     │
└────────┬────────┘  └────────┬────────┘
         │                    │
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
           ┌─────────────────┐
           │   QC Review     │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Add Tracking   │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │     Shipped     │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │    Reports      │
           │ (Cost/Profit)   │
           └─────────────────┘
```

---

## 🔑 KEY FEATURES

### Performance Optimization
- TanStack React Query caching (5 min stale time)
- Debounced search (500ms)
- Pagination (10 items/page)
- Lazy loading images
- Memoized calculations

### User Experience
- Real-time updates via Socket.io
- Auto-refresh with timestamps
- Expandable table rows
- Bulk operations
- Export to Excel
- Multi-language (EN/VI)

### Security
- JWT authentication
- Role-based access control
- Protected routes
- Token refresh
- Secure API calls

---

## 📝 NOTES

### API Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.lngmerch.co/api`

### State Management Strategy
- **AuthContext**: User, token, roles
- **OrderContext**: Order filters, display state
- **React Query**: Server state, caching
- **Local State**: Component-specific UI state

### Common Patterns
- Filter → API call → Update state → Render
- Modal → Form → API → Refresh → Close
- Select → Assign → Update → Notify
- Upload → Validate → Store → Display

---

**Last Updated**: 2026-03-06
**Version**: 1.0
**Maintainer**: LNG Merch Development Team
