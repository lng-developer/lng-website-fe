export function normalizeCustomizationItems(items) {
  if (Array.isArray(items)) return items;
  return Object.entries(items || {}).map(([label, value]) => ({ label, value }));
}

function humanizeCustomizationKey(key) {
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCustomizationValue(value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.map(formatCustomizationValue).filter(Boolean).join(', ');

  const entries = Object.entries(value)
    .map(([key, nested]) => [key, formatCustomizationValue(nested)])
    .filter(([, nested]) => nested);

  if (entries.length === 1 && entries[0][0] === 'value') return entries[0][1];
  return entries.map(([key, nested]) => `${humanizeCustomizationKey(key)}: ${nested}`).join(', ');
}

function getExtraRows(item = {}) {
  const hiddenFields = new Set([
    'label',
    'value',
    'optionValue',
    'text',
    'numberValue',
    'customizationType',
    'fill',
    'fontUrl',
    'Dimensions',
    'Position',
    'priceDelta',
    'name',
    'optionImage',
  ]);
  const mainValues = new Set([
    String(item.label || ''),
    String(item.value || ''),
    String(item.optionValue || ''),
    String(item.text || ''),
    String(item.numberValue || ''),
  ]);

  return Object.entries(item)
    .filter(([key]) => !hiddenFields.has(key))
    .map(([key, value]) => ({ label: humanizeCustomizationKey(key), value: formatCustomizationValue(value) }))
    .filter(({ value }) => value && !mainValues.has(value));
}

export function getCustomizationRows(items) {
  return normalizeCustomizationItems(items).flatMap((item) => [
    {
      label: item?.label,
      value: item?.value,
    },
    ...getExtraRows(item),
  ]);
}
