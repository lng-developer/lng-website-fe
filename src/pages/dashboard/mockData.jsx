import React from 'react';
import { ShoppingCartOutlined, DollarOutlined, FallOutlined, RiseOutlined } from '@ant-design/icons';

export const ALL_MEMBERS = ['Nguyễn Đức Sơn', 'Trần Thị Thu', 'Nguyễn Thùy Linh', 'Ngô Chí Huy', 'Nguyễn Thị Như Quỳnh'];

export const COLUMN_CONFIG = {
  todo: { title: 'To Do', bg: 'bg-[#f1f2f4]', collapsedBg: 'bg-slate-200', border: 'border-l-4 border-slate-400', headerColor: '#f1f2f4' },
  inProgress: {
    title: 'In Progress',
    bg: 'bg-[#f1f2f4]',
    collapsedBg: 'bg-blue-200',
    border: 'border-l-4 border-blue-400',
    headerColor: '#669df1',
  },
  review: {
    title: 'Review',
    bg: 'bg-[#f1f2f4]',
    collapsedBg: 'bg-purple-200',
    border: 'border-l-4 border-purple-400',
    headerColor: '#c97cf4',
  },
  done: {
    title: 'Done',
    bg: 'bg-[#f1f2f4]',
    collapsedBg: 'bg-green-200',
    border: 'border-l-4 border-green-400',
    headerColor: '#10b981',
  },
  rejected: {
    title: 'Rejected',
    bg: 'bg-[#f1f2f4]',
    collapsedBg: 'bg-red-200',
    border: 'border-l-4 border-red-400',
    headerColor: '#f87168',
  },
  late: {
    title: 'Late',
    bg: 'bg-[#fff1f0]',
    collapsedBg: 'bg-orange-200',
    border: 'border-l-4 border-orange-400',
    headerColor: '#ffd6a7',
  },
};

export const MOCK_STATS = [
  {
    title: 'Orders Today',
    value: 128,
    prefix: '',
    suffix: '',
    iconBg: 'bg-slate-600',
    textColor: 'text-slate-700',
    icon: <ShoppingCartOutlined />,
  },
  {
    title: 'Revenue Today',
    value: 12500,
    prefix: '$',
    suffix: '',
    iconBg: 'bg-blue-500',
    textColor: 'text-blue-600',
    icon: <DollarOutlined />,
  },
  { title: 'Ad Spends', value: 3200, prefix: '$', suffix: '', iconBg: 'bg-red-500', textColor: 'text-red-500', icon: <FallOutlined /> },
  {
    title: 'Profit Today',
    value: 9300,
    prefix: '$',
    suffix: '',
    iconBg: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    icon: <RiseOutlined />,
  },
];

export const MOCK_TASKS = {
  todo: [
    {
      id: 't1',
      title: 'Design Banner Black Friday',
      assignees: ['Nguyễn Đức Sơn', 'Trần Thị Thu'],
      priority: 'High',
      due: '2025-10-24',
      tag: 'Design',
      description: 'Cần thiết kế banner theo style Cyberpunk. Kích thước 1920x1080.',
      note: '',
      isCompleted: false,
      attachments: [
        'https://i.pinimg.com/736x/71/28/a2/7128a2ffa8eeff9218a76a98e81622e4.jpg',
        'https://i.pinimg.com/736x/50/ea/24/50ea240cdd57ff88f8adb58eb50b801a.jpg',
      ],
      activities: [
        // Đổi comments thành activities
        { user: 'System', action: 'created this task', time: 'Oct 20 at 9:00 AM' },
        { user: 'Nguyễn Đức Sơn', action: 'added an attachment', time: 'Oct 20 at 10:30 AM' },
      ],
    },
    {
      id: 't2',
      title: 'Fix bug checkout flow',
      assignees: ['Tran Thi B'],
      priority: 'Medium',
      due: '2025-10-25',
      tag: 'Dev',
      description: '',
      note: '',
      isCompleted: false,
      attachments: ['https://i.pinimg.com/1200x/3a/1f/d4/3a1fd4ad04a00d556856dc1a803f7c71.jpg'],
      activities: [],
    },
  ],
  inProgress: [
    {
      id: 't3',
      title: 'Setup Facebook Ads Campaign',
      assignees: ['Le Van C'],
      priority: 'High',
      due: '2025-10-23',
      tag: 'Seller',
      description: '',
      note: '',
      isCompleted: false,
      attachments: [],
      activities: [],
    },
  ],
  review: [
    {
      id: 't4',
      title: 'Content for Landing Page',
      assignees: ['Pham Van D'],
      priority: 'Low',
      due: '2025-10-22',
      tag: 'Content',
      description: '',
      note: '',
      isCompleted: false,
      attachments: [],
      activities: [],
    },
  ],
  done: [
    {
      id: 't5',
      title: 'Meeting with Partner',
      assignees: ['Nguyen Van A', 'Hoang Thi E'],
      priority: 'Medium',
      due: '2025-10-20',
      tag: 'Meeting',
      description: '',
      note: '',
      isCompleted: true,
      attachments: [],
      activities: [],
    },
  ],
  rejected: [],
  late: [
    {
      id: 't6',
      title: 'Update layout home page',
      assignees: ['Nguyen Van A'],
      priority: 'Medium',
      due: '2025-10-15',
      tag: 'Meeting',
      description: 'Chỉnh sửa theo figma homepage',
      note: 'Xem lại phần font chữ và kích thước hỉnh ảnh.',
      isCompleted: false,
      attachments: ['https://i.pinimg.com/736x/cf/02/94/cf02945414e5106249f55a8e1eac61d9.jpg'],
      activities: [],
    },
  ],
};
