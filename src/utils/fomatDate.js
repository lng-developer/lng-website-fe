import { endOfDay, format, startOfDay, subDays } from 'date-fns';

const formatDate = (dateValue) => {
  const formattedDate = format(new Date(dateValue), 'MMMM d, yyyy');
  return formattedDate;
};

const toUtcISOString = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

const today = new Date();
const sevenDaysAgo = subDays(today, 6); // Hôm nay là ngày thứ 7

const defaultFrom = toUtcISOString(startOfDay(sevenDaysAgo)); // "2025-07-01T00:00:00Z"
const defaultTo = toUtcISOString(endOfDay(today));

export { formatDate, defaultFrom, defaultTo };
