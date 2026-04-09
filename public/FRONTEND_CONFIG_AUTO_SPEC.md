# ConfigAuto Frontend Specification

## Tổng quan
Tài liệu này mô tả những gì Frontend cần implement để quản lý hệ thống Auto Config cho việc tự động gọi API vendorSyncBatch.

## 🎯 Mục tiêu
Tạo giao diện cho phép admin:
- Xem danh sách các config auto
- Bật/tắt auto sync
- Cập nhật thời gian chạy auto
- Xem thống kê và trạng thái

## 📊 Data Structure

### ConfigAuto Object
```typescript
interface ConfigAuto {
  _id: string;                    // MongoDB ObjectId
  id: string;                     // Unique identifier (e.g., "vendor-sync-default")
  type: string;                   // "vendorSyncBatch" | "uploadTracking" | "other"
  autoTime: string;               // Cron pattern (e.g., "*/30 * * * *")
  status: boolean;                // true = bật, false = tắt
  description?: string;           // Mô tả
  config: {
    maxOrders?: number;           // Số lượng orders tối đa mỗi lần chạy
    dryRun?: boolean;             // Chế độ test (true) hay thật (false)
  };
  stats: {
    totalRuns: number;            // Tổng số lần đã chạy
    lastRunAt?: Date;             // Lần chạy cuối cùng
    lastRunStatus?: string;       // "success" | "error" | "running"
    lastRunResult?: any;          // Kết quả lần chạy cuối
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔌 API Endpoints

### 1. Lấy danh sách configs
```http
GET /api/config-auto?type=vendorSyncBatch&page=1&limit=10

Response:
{
  "ok": true,
  "data": [
    {
      "_id": "676c1234567890abcdef1234",
      "id": "vendor-sync-default",
      "type": "vendorSyncBatch",
      "autoTime": "*/30 * * * *",
      "status": true,
      "description": "Auto sync tracking từ vendors mỗi 30 phút",
      "config": {
        "maxOrders": 100,
        "dryRun": false
      },
      "stats": {
        "totalRuns": 25,
        "lastRunAt": "2024-01-15T08:30:00.000Z",
        "lastRunStatus": "success",
        "lastRunResult": {
          "statusCode": 200,
          "processedOrders": 45,
          "message": "Sync completed successfully"
        }
      },
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-15T08:30:00.000Z"
    },
    {
      "_id": "676c1234567890abcdef5678",
      "id": "vendor-sync-peak-hours",
      "type": "vendorSyncBatch",
      "autoTime": "0 8,12,16,20 * * *",
      "status": false,
      "description": "Auto sync vào giờ cao điểm: 8AM, 12PM, 4PM, 8PM",
      "config": {
        "maxOrders": 200,
        "dryRun": false
      },
      "stats": {
        "totalRuns": 12,
        "lastRunAt": "2024-01-14T20:00:00.000Z",
        "lastRunStatus": "error",
        "lastRunResult": {
          "statusCode": 500,
          "error": "Connection timeout to vendor API"
        }
      },
      "createdAt": "2024-01-12T15:00:00.000Z",
      "updatedAt": "2024-01-14T20:00:00.000Z"
    },
    {
      "_id": "676c1234567890abcdef9012",
      "id": "vendor-sync-night",
      "type": "vendorSyncBatch", 
      "autoTime": "0 2 * * *",
      "status": true,
      "description": "Auto sync ban đêm lúc 2AM",
      "config": {
        "maxOrders": 500,
        "dryRun": false
      },
      "stats": {
        "totalRuns": 8,
        "lastRunAt": "2024-01-15T02:00:00.000Z",
        "lastRunStatus": "success",
        "lastRunResult": {
          "statusCode": 200,
          "processedOrders": 156,
          "message": "Night sync completed"
        }
      },
      "createdAt": "2024-01-08T09:00:00.000Z",
      "updatedAt": "2024-01-15T02:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "pages": 1
  }
}
```

### 2. Lấy config theo ID
```http
GET /api/config-auto/vendor-sync-default

Response:
{
  "ok": true,
  "data": {
    "_id": "676c1234567890abcdef1234",
    "id": "vendor-sync-default",
    "type": "vendorSyncBatch",
    "autoTime": "*/30 * * * *",
    "status": true,
    "description": "Auto sync tracking từ vendors mỗi 30 phút",
    "config": {
      "maxOrders": 100,
      "dryRun": false
    },
    "stats": {
      "totalRuns": 25,
      "lastRunAt": "2024-01-15T08:30:00.000Z",
      "lastRunStatus": "success",
      "lastRunResult": {
        "statusCode": 200,
        "processedOrders": 45,
        "message": "Sync completed successfully"
      }
    },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-15T08:30:00.000Z"
  }
}
```

### 3. Cập nhật config
```http
PUT /api/config-auto/vendor-sync-default
Content-Type: application/json

Body:
{
  "status": true,                    // Bật/tắt
  "autoTime": "*/15 * * * *",       // Thay đổi thời gian
  "description": "New description",  // Cập nhật mô tả
  "config": {
    "maxOrders": 200,
    "dryRun": false
  }
}

Response:
{
  "ok": true,
  "message": "Config auto updated successfully",
  "data": ConfigAuto
}
```

## 🎨 UI Components Cần Thiết

### 1. ConfigAuto List Component
**Mục đích**: Hiển thị danh sách tất cả configs

**Features cần có**:
- Table/List hiển thị configs
- Toggle switch để bật/tắt
- Badge hiển thị trạng thái (🟢 BẬT / 🔴 TẮT)
- Hiển thị thời gian chạy (cron pattern)
- Hiển thị stats (total runs, last run)
- Button để edit config

**Cách xử lý dữ liệu**:
```typescript
// Từ API response
const configs = response.data; // Array of ConfigAuto

// Hiển thị trong table
configs.map(config => ({
  id: config.id,                                    // "vendor-sync-default"
  type: config.type,                                // "vendorSyncBatch"
  status: config.status,                            // true/false
  statusText: config.status ? "🟢 BẬT" : "🔴 TẮT",
  schedule: config.autoTime,                        // "*/30 * * * *"
  scheduleText: cronToText(config.autoTime),       // "Mỗi 30 phút"
  totalRuns: config.stats.totalRuns,               // 25
  lastRun: formatDate(config.stats.lastRunAt),     // "2 giờ trước"
  lastStatus: config.stats.lastRunStatus,          // "success"
  description: config.description                   // "Auto sync tracking..."
}))
```

**Mock UI với dữ liệu thật**:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Auto Config Management                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ID                    │ Type           │ Status │ Schedule    │ Stats    │ Actions│
├─────────────────────────────────────────────────────────────────────────────────┤
│ vendor-sync-default   │ vendorSyncBatch│ 🟢 BẬT │ */30 * * * *│ Runs: 25 │ [Edit] │
│ Auto sync mỗi 30 phút │                │        │ (30 phút)   │ ✅ 2h ago│        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ vendor-sync-peak-hours│ vendorSyncBatch│ 🔴 TẮT │ 0 8,12,16,20│ Runs: 12 │ [Edit] │
│ Auto sync giờ cao điểm│                │        │ (4x/ngày)   │ ❌ 1d ago│        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ vendor-sync-night     │ vendorSyncBatch│ 🟢 BẬT │ 0 2 * * *   │ Runs: 8  │ [Edit] │
│ Auto sync ban đêm 2AM │                │        │ (hàng ngày) │ ✅ 6h ago│        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2. ConfigAuto Edit Modal/Form
**Mục đích**: Chỉnh sửa config

**Fields cần có**:
- Toggle Switch: Bật/Tắt auto
- Dropdown: Chọn thời gian preset hoặc custom
- Input: Custom cron pattern
- Number Input: Max orders
- Checkbox: Dry run mode
- Textarea: Description

**Preset thời gian**:
```typescript
const timePresets = [
  { label: "Mỗi 5 phút", value: "*/5 * * * *" },
  { label: "Mỗi 15 phút", value: "*/15 * * * *" },
  { label: "Mỗi 30 phút", value: "*/30 * * * *" },
  { label: "Mỗi giờ", value: "0 * * * *" },
  { label: "Mỗi 2 giờ", value: "0 */2 * * *" },
  { label: "8AM, 2PM, 8PM", value: "0 8,14,20 * * *" },
  { label: "Custom", value: "custom" }
];
```

### 3. Stats Dashboard Component
**Mục đích**: Hiển thị thống kê tổng quan

**Metrics cần hiển thị**:
- Tổng số configs
- Số configs đang bật
- Tổng số lần chạy hôm nay
- Trạng thái lần chạy cuối
- Biểu đồ runs theo thời gian (optional)

## 📱 User Stories

### Story 1: Admin xem danh sách configs
```
Là admin
Tôi muốn xem danh sách tất cả auto configs
Để biết configs nào đang bật/tắt và thời gian chạy
```

**Acceptance Criteria**:
- Hiển thị table với các cột: ID, Type, Status, Schedule, Actions
- Status hiển thị rõ ràng (🟢 BẬT / 🔴 TẮT)
- Hiển thị thống kê: total runs, last run time
- Có pagination nếu nhiều configs

### Story 2: Admin bật/tắt auto sync
```
Là admin  
Tôi muốn bật/tắt auto sync bằng toggle switch
Để kiểm soát khi nào auto sync chạy
```

**Acceptance Criteria**:
- Toggle switch dễ nhìn và dễ click
- Khi toggle, gọi API PUT để cập nhật status
- Hiển thị loading state khi đang cập nhật
- Hiển thị success/error message
- UI cập nhật ngay lập tức

### Story 3: Admin thay đổi thời gian auto
```
Là admin
Tôi muốn thay đổi thời gian chạy auto
Để phù hợp với nhu cầu business
```

**Acceptance Criteria**:
- Modal/form để edit config
- Dropdown với các preset thời gian phổ biến
- Option để nhập custom cron pattern
- Validate cron pattern trước khi save
- Preview thời gian chạy tiếp theo

### Story 4: Admin xem thống kê
```
Là admin
Tôi muốn xem thống kê auto sync
Để biết hiệu quả và phát hiện vấn đề
```

**Acceptance Criteria**:
- Hiển thị total runs, success rate
- Hiển thị thời gian chạy cuối và kết quả
- Hiển thị next run time
- Color coding cho status (green=success, red=error)

## 🛠️ Technical Implementation

### React/Vue Component Structure
```
components/
├── ConfigAutoList.tsx          // Danh sách configs
├── ConfigAutoEditModal.tsx     // Modal edit config
├── ConfigAutoToggle.tsx        // Toggle switch component
├── ConfigAutoStats.tsx         // Stats dashboard
├── CronPatternInput.tsx        // Input cho cron pattern
└── ConfigAutoCard.tsx          // Card hiển thị 1 config
```

### React Component Example
```typescript
// ConfigAutoList.tsx
import React, { useState, useEffect } from 'react';

interface ConfigAutoListProps {}

export const ConfigAutoList: React.FC<ConfigAutoListProps> = () => {
  const [configs, setConfigs] = useState<ConfigAuto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await configAutoService.getConfigs();
      setConfigs(response.data);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, newStatus: boolean) => {
    try {
      await configAutoService.updateConfig(id, { status: newStatus });
      // Update local state
      setConfigs(prev => prev.map(config => 
        config.id === id ? { ...config, status: newStatus } : config
      ));
    } catch (error) {
      console.error('Failed to toggle config:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="config-auto-list">
      <h2>Auto Config Management</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Schedule</th>
            <th>Stats</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {configs.map(config => (
            <tr key={config.id}>
              <td>
                <div className="font-medium">{config.id}</div>
                <div className="text-sm text-gray-500">{config.description}</div>
              </td>
              <td>{config.type}</td>
              <td>
                <span className={`badge ${config.status ? 'badge-success' : 'badge-error'}`}>
                  {formatStatus(config.status, config.stats.lastRunStatus)}
                </span>
              </td>
              <td>
                <div>{config.autoTime}</div>
                <div className="text-sm text-gray-500">
                  {cronToText(config.autoTime)}
                </div>
              </td>
              <td>
                <div>Runs: {config.stats.totalRuns}</div>
                <div className="text-sm">
                  {config.stats.lastRunAt && (
                    <>
                      {config.stats.lastRunStatus === 'success' ? '✅' : '❌'} 
                      {formatRelativeTime(config.stats.lastRunAt)}
                    </>
                  )}
                </div>
              </td>
              <td>
                <ConfigAutoToggle 
                  checked={config.status}
                  onChange={(checked) => handleToggle(config.id, checked)}
                />
                <button 
                  className="btn btn-sm"
                  onClick={() => openEditModal(config)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ConfigAutoToggle.tsx
interface ConfigAutoToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ConfigAutoToggle: React.FC<ConfigAutoToggleProps> = ({
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="slider"></span>
    </label>
  );
};
```

### API Service
```typescript
class ConfigAutoService {
  async getConfigs(params?: { type?: string; page?: number; limit?: number }) {
    const response = await fetch('/api/config-auto?' + new URLSearchParams(params));
    return response.json();
  }
  
  async getConfigById(id: string) {
    const response = await fetch(`/api/config-auto/${id}`);
    return response.json();
  }
  
  async updateConfig(id: string, data: Partial<ConfigAuto>) {
    const response = await fetch(`/api/config-auto/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
```

### Utility Functions
```typescript
// Chuyển đổi cron pattern thành text dễ hiểu
function cronToText(cronPattern: string): string {
  const patterns = {
    '*/5 * * * *': 'Mỗi 5 phút',
    '*/15 * * * *': 'Mỗi 15 phút', 
    '*/30 * * * *': 'Mỗi 30 phút',
    '0 * * * *': 'Mỗi giờ',
    '0 */2 * * *': 'Mỗi 2 giờ',
    '0 8,12,16,20 * * *': '4 lần/ngày (8AM, 12PM, 4PM, 8PM)',
    '0 2 * * *': 'Hàng ngày lúc 2AM',
    '0 8 * * *': 'Hàng ngày lúc 8AM'
  };
  
  return patterns[cronPattern] || cronPattern;
}

// Format thời gian relative
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Vừa xong';
  if (diffHours < 24) return `${diffHours}h trước`;
  return `${diffDays}d trước`;
}

// Format status với icon
function formatStatus(status: boolean, lastRunStatus?: string): string {
  if (!status) return '🔴 TẮT';
  
  if (lastRunStatus === 'success') return '🟢 BẬT';
  if (lastRunStatus === 'error') return '🟡 BẬT (Lỗi)';
  if (lastRunStatus === 'running') return '🔵 BẬT (Đang chạy)';
  
  return '🟢 BẬT';
}

// Tính next run time từ cron pattern
function getNextRunTime(cronPattern: string): string {
  // Sử dụng thư viện như 'cron-parser' hoặc 'node-cron'
  // Ví dụ với cron-parser:
  // const parser = require('cron-parser');
  // const interval = parser.parseExpression(cronPattern);
  // return interval.next().toString();
  
  // Tạm thời return placeholder
  return 'Trong 15 phút';
}
```

### State Management (Redux/Vuex)
```typescript
interface ConfigAutoState {
  configs: ConfigAuto[];
  loading: boolean;
  error: string | null;
  selectedConfig: ConfigAuto | null;
  editModalOpen: boolean;
}

// Actions
- fetchConfigs()
- updateConfig(id, data)
- toggleConfig(id, status)
- setSelectedConfig(config)
- openEditModal()
- closeEditModal()
```

## 🎨 UI/UX Guidelines

### Colors
- 🟢 Green (#10B981): Active/Success
- 🔴 Red (#EF4444): Inactive/Error  
- 🟡 Yellow (#F59E0B): Warning/Running
- 🔵 Blue (#3B82F6): Info/Links
- ⚪ Gray (#6B7280): Disabled/Secondary

### Icons
- ⚙️ Settings icon cho config
- 🔄 Refresh icon cho sync
- ⏰ Clock icon cho schedule
- 📊 Chart icon cho stats
- ✅ Check icon cho success
- ❌ X icon cho error

### Responsive Design
- Desktop: Table layout
- Tablet: Card layout với 2 columns
- Mobile: Single column card layout

### CSS Styles Example
```css
/* ConfigAuto.css */
.config-auto-list {
  padding: 20px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.table th {
  background-color: #f9fafb;
  font-weight: 600;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
}

.badge-error {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge-warning {
  background-color: #fef3c7;
  color: #92400e;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* Responsive */
@media (max-width: 768px) {
  .table {
    font-size: 14px;
  }
  
  .table th,
  .table td {
    padding: 8px;
  }
}
```

## 📱 Mobile Responsive Example
```typescript
// ConfigAutoCard.tsx - Mobile version
export const ConfigAutoCard: React.FC<{ config: ConfigAuto }> = ({ config }) => {
  return (
    <div className="config-card">
      <div className="config-header">
        <h3>{config.id}</h3>
        <ConfigAutoToggle 
          checked={config.status}
          onChange={(checked) => handleToggle(config.id, checked)}
        />
      </div>
      
      <div className="config-body">
        <p className="description">{config.description}</p>
        
        <div className="config-stats">
          <div className="stat">
            <span className="label">Schedule:</span>
            <span className="value">{cronToText(config.autoTime)}</span>
          </div>
          
          <div className="stat">
            <span className="label">Runs:</span>
            <span className="value">{config.stats.totalRuns}</span>
          </div>
          
          <div className="stat">
            <span className="label">Last Run:</span>
            <span className="value">
              {config.stats.lastRunAt && formatRelativeTime(config.stats.lastRunAt)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="config-actions">
        <button className="btn btn-primary">Edit</button>
      </div>
    </div>
  );
};
```

### Unit Tests
- ConfigAutoService API calls
- Component rendering
- Toggle functionality
- Form validation

### Integration Tests  
- API integration
- State management
- User workflows

### E2E Tests
- Complete user journey: view → edit → save
- Toggle on/off functionality
- Error handling

## 📋 Checklist cho Frontend Dev

### Phase 1: Basic Display
- [ ] Tạo ConfigAutoService để gọi API
- [ ] Tạo ConfigAutoList component
- [ ] Hiển thị danh sách configs
- [ ] Hiển thị status (bật/tắt)
- [ ] Hiển thị thời gian chạy

### Phase 2: Toggle Functionality  
- [ ] Tạo ConfigAutoToggle component
- [ ] Implement toggle on/off
- [ ] Loading states
- [ ] Success/Error messages
- [ ] Optimistic updates

### Phase 3: Edit Functionality
- [ ] Tạo ConfigAutoEditModal
- [ ] Form với các fields cần thiết
- [ ] Preset thời gian dropdown
- [ ] Custom cron pattern input
- [ ] Form validation
- [ ] Save functionality

### Phase 4: Stats & Polish
- [ ] ConfigAutoStats component
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading skeletons
- [ ] Accessibility (a11y)

## 🚀 Deployment Notes

### Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

### Build Requirements
- Node.js 16+
- React 18+ hoặc Vue 3+
- TypeScript support
- Tailwind CSS hoặc styled-components

## 📞 Backend Support

Nếu Frontend cần thêm API endpoints:
- Liên hệ Backend team
- Tạo GitHub issue với spec rõ ràng
- Test API với Postman trước khi integrate

---

**Tài liệu này sẽ được cập nhật khi có thay đổi từ Backend.**