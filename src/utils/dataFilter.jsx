const dataFilterStatus = [
  {
    key: 'all',
    title: 'All',
    status: 'All',
  },
  {
    key: 'new',
    title: 'New Order',
    status: 'New',
  },
  {
    key: 'noCostCenter',
    title: 'No Cost Center',
    status: 'NoCostCenter',
  },
  {
    key: 'paymentPending',
    title: 'Payment Pending',
    status: 'paymentPending',
  },
  {
    key: 'fulfilled',
    title: 'Fulfilled',
    status: 'Fulfilled',
  },
  {
    key: 'shipped',
    title: 'Shipped',
    status: 'Shipped',
  },
  {
    key: 'cancelled',
    title: 'Cancelled',
    status: 'Cancelled',
  },
  {
    key: 'openCase',
    title: 'Open Case',
    status: 'openCase',
  },
];

const dataFilterStatusFulfillment = [
  {
    key: 'Total',
    title: 'Total',
    status: 'Total',
  },
  {
    key: 'Pending',
    title: 'Pending',
    status: 'Pending',
  },
  {
    key: 'In Progress',
    title: 'In Progress',
    status: 'InProgress',
  },
  {
    key: 'Completed',
    title: 'Completed',
    status: 'Completed',
  },
  {
    key: 'Rejected',
    title: 'Rejected',
    status: 'Rejected',
  },
];

export { dataFilterStatus, dataFilterStatusFulfillment };
