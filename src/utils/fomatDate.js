import { format } from 'date-fns';

const formatDate = (dateValue) => {
  const formattedDate = format(new Date(dateValue), 'MMMM d, yyyy');
  return formattedDate;
};

export { formatDate };
