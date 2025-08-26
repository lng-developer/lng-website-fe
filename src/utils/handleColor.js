import { dataColors } from './dataColors';

const handleColorStatus = (stt) => {
  switch (stt) {
    case 'New':
      return dataColors.success;
    case 'Fulfilled':
      return dataColors.process;
    case 'Shipped':
      return dataColors.pending;
    case 'Cancelled':
      return dataColors.cancelled;
    default:
      return dataColors.default;
  }
};

const handleColorStatusScale = (stt) => {
  switch (stt) {
    case 'Need Scale':
      return dataColors.success;
    case 'Pending':
      return dataColors.pending;
    case 'Ready':
      return dataColors.pending;
    case 'QC Rejected':
      return dataColors.cancelled;
    case 'Failed':
      return dataColors.cancelled;
    case 'Complete':
      return dataColors.success;
    default:
      return dataColors.default;
  }
};

export { handleColorStatus, handleColorStatusScale };
