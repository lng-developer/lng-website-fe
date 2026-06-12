const DESIGN_EXPORT_FIELDS = [
  { header: 'Design Front', key: 'designFront', aliases: ['front'] },
  { header: 'Design Back', key: 'designBack', aliases: ['back'] },
  { header: 'Design Right', key: 'designRight', aliases: ['right', 'right_sleeve', 'right sleeve', 'right-sleeve', 'rightSleeve'] },
  { header: 'Design Left', key: 'designLeft', aliases: ['left', 'left_sleeve', 'left sleeve', 'left-sleeve', 'leftSleeve'] },
];

const normalizeKey = (value) =>
  String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const getDesignExportValues = (fulfillmentFile = {}) => {
  const normalizedFiles = Object.entries(fulfillmentFile && typeof fulfillmentFile === 'object' ? fulfillmentFile : {}).reduce(
    (acc, [position, url]) => {
      acc[normalizeKey(position)] = typeof url === 'string' ? url : '';
      return acc;
    },
    {}
  );

  return DESIGN_EXPORT_FIELDS.reduce((acc, field) => {
    acc[field.key] = field.aliases.map(normalizeKey).map((alias) => normalizedFiles[alias]).find(Boolean) || '';
    return acc;
  }, {});
};

const normalizeCustomizationItems = (item = {}) => {
  if (Array.isArray(item.version3Data)) {
    return item.version3Data;
  }

  if (item.variations && typeof item.variations === 'object') {
    return Object.entries(item.variations).map(([label, value]) => ({ label, value }));
  }

  return [];
};

const getCustomizationExportValue = (item = {}) => {
  return normalizeCustomizationItems(item)
    .map((customItem) => {
      const label = String(customItem?.label || '').trim();
      if (!label) return '';
      return `${label}: ${customItem?.value ?? ''}`;
    })
    .filter(Boolean)
    .join('\n');
};

export { DESIGN_EXPORT_FIELDS, getCustomizationExportValue, getDesignExportValues };
