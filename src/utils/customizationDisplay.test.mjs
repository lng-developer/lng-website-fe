import assert from 'node:assert/strict';
import { getCustomizationRows, normalizeCustomizationItems } from './customizationDisplay.js';

assert.deepEqual(normalizeCustomizationItems({ Size: 'S' }), [{ label: 'Size', value: 'S' }]);

const rows = getCustomizationRows([
  {
    label: 'Custom Name',
    value: 'Mrs. Adams',
    text: 'Mrs. Adams',
    customizationType: 'TextPrinting',
    colorName: 'Pink',
    fill: '#f784b7',
    fontFamily: 'Mochary',
    threadColor: 'Gold',
    fontUrl: 'https://example.com/font.ttf',
    Dimensions: { width: 143, height: 50 },
    Position: { x: 150, y: 172 },
    priceDelta: { value: 0 },
    name: 'Text Input 1',
  },
]);

assert.deepEqual(rows, [
  {
    label: 'Custom Name',
    value: 'Mrs. Adams',
  },
  {
    label: 'Color Name',
    value: 'Pink',
  },
  {
    label: 'Font Family',
    value: 'Mochary',
  },
  {
    label: 'Thread Color',
    value: 'Gold',
  },
]);

assert.deepEqual(getCustomizationRows({
  label: 'Custom Name',
  value: 'Mrs. Adams',
}), [
  { label: 'label', value: 'Custom Name' },
  { label: 'value', value: 'Mrs. Adams' },
]);

console.log('customizationDisplay self-check passed');
