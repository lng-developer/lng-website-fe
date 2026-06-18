const IMAGE_URL_PATTERN = /^(.+\.(?:png|jpe?g|webp|gif))(?:[?#].*)?/i;
const ETSY_IMAGE_VARIANT_PATTERN = /\/il_(?:fullxfull|\d+x(?:N|\d+))(?=\.)/i;
const CUSTOM_IMAGE_VARIANT_PATTERN = /\/ipf_[^/.]+(?=\.)/i;

const normalizeUrl = (url) => (typeof url === 'string' ? url.trim() : '');

export const getImageUrlFromMasked = (url = '') => {
  const normalizedUrl = normalizeUrl(url);
  const match = normalizedUrl.match(IMAGE_URL_PATTERN);
  return match?.[1] || '';
};

const replaceEtsyVariant = (url, variant) => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl || !ETSY_IMAGE_VARIANT_PATTERN.test(normalizedUrl)) return '';
  return normalizedUrl.replace(ETSY_IMAGE_VARIANT_PATTERN, `/il_${variant}`);
};

const replaceCustomVariant = (url, variant) => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) return '';
  return CUSTOM_IMAGE_VARIANT_PATTERN.test(normalizedUrl)
    ? normalizedUrl.replace(CUSTOM_IMAGE_VARIANT_PATTERN, `/ipf_${variant}`)
    : normalizedUrl;
};

export const getEtsyThumbUrl = (url = '') => replaceEtsyVariant(url, '340x270');

export const getEtsyPreviewUrl = (url = '') => {
  const normalizedUrl = normalizeUrl(url);
  return replaceEtsyVariant(normalizedUrl, 'fullxfull') || normalizedUrl;
};

export const getEtsyOriginalUrl = (url = '') => getEtsyPreviewUrl(url);

export const getCustomFileThumbUrl = (file = {}) => {
  const safeThumbUrl =
    normalizeUrl(file.thumbnailUrl) ||
    normalizeUrl(file.thumbUrl) ||
    getImageUrlFromMasked(file.thumbnailUrlMasked) ||
    getImageUrlFromMasked(file.previewUrlMasked) ||
    normalizeUrl(file.previewUrl);

  return safeThumbUrl ? replaceCustomVariant(safeThumbUrl, '300x300') : '';
};

export const getCustomFileOriginalUrl = (file = {}) =>
  getImageUrlFromMasked(file.downloadUrlMasked) ||
  normalizeUrl(file.downloadUrl) ||
  normalizeUrl(file.storageUrl) ||
  normalizeUrl(file.externalUrl) ||
  normalizeUrl(file.originalUrl);

export const getCustomFilePreviewUrl = (file = {}) => {
  const previewUrl =
    normalizeUrl(file.previewUrl) ||
    getImageUrlFromMasked(file.previewUrlMasked) ||
    getCustomFileOriginalUrl(file);

  return previewUrl ? replaceCustomVariant(previewUrl, 'fullxfull') : '';
};

export const resolveEtsyImage = (url = '') => ({
  thumbUrl: getEtsyThumbUrl(url),
  previewUrl: getEtsyPreviewUrl(url),
  originalUrl: getEtsyOriginalUrl(url),
});

export const resolveCustomFileImage = (file = {}) => {
  const originalUrl = getCustomFileOriginalUrl(file);
  const previewUrl = getCustomFilePreviewUrl(file) || originalUrl;

  return {
    thumbUrl: getCustomFileThumbUrl(file),
    previewUrl,
    originalUrl,
  };
};

export const resolveSnapshotImage = (url = '') => {
  const normalizedUrl = normalizeUrl(url);

  return {
    thumbUrl: '',
    previewUrl: normalizedUrl,
    originalUrl: normalizedUrl,
  };
};
