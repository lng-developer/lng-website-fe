export const countActiveAdvancedFilters = ({ vendor, carrier, submitFrom, submitTo } = {}) =>
    Number(Boolean(vendor)) + Number(Boolean(carrier)) + Number(Boolean(submitFrom || submitTo));
