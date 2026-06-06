import { cloneElement, useCallback } from 'react';
import { Image } from 'antd';
import { Link } from 'react-router-dom';
import NoImage from '../../../assets/NoImage.jpg';
import LazyImage from '../../../components/LazyImage';

const getImageUrlFromMasked = (url = '') => {
  if (typeof url !== 'string') return '';
  const match = url.match(/^(.+\.(?:png|jpe?g|webp|gif))/i);
  return match?.[1] || '';
};

const getFullSizeImageUrl = (url = '') => {
  if (typeof url !== 'string') return '';
  return url.replace(/\/ipf_[^/.]+(?=\.)/i, '/ipf_fullxfull');
};

const getCustomFileViewUrl = (file = {}) =>
  getFullSizeImageUrl(getImageUrlFromMasked(file.downloadUrlMasked) || file.storageUrl || file.externalUrl || file.downloadUrl || '');

const getCustomFileThumbUrl = (file = {}) =>
  getFullSizeImageUrl(
    getImageUrlFromMasked(file.downloadUrlMasked) ||
      getImageUrlFromMasked(file.previewUrlMasked) ||
      file.previewUrl ||
      file.storageUrl ||
      file.externalUrl ||
      file.downloadUrl ||
      ''
  );

const SubItemCustomEtsy = ({ items = [], customUrl, linkImage, listingId, customFiles = [], orderId, transactionId }) => {
  const listingUrl = listingId ? `https://www.etsy.com/listing/${listingId}` : '';
  const normalizedCustomFiles = Array.isArray(customFiles) ? customFiles : [];
  const customPhotoUrls = normalizedCustomFiles
    .map((file) => getCustomFileViewUrl(file) || getCustomFileThumbUrl(file))
    .filter(Boolean);

  const getLargePreview = useCallback(
    (src) => ({
      src,
      mask: 'View large',
      scaleStep: 0.75,
      imageRender: (originalNode) =>
        cloneElement(originalNode, {
          style: {
            ...originalNode.props.style,
            width: 'auto',
            height: 'auto',
            maxWidth: '92vw',
            maxHeight: '85vh',
            objectFit: 'contain',
          },
        }),
    }),
    []
  );

  // Chuẩn hóa: items có thể là array [{label, value}] hoặc object {key: value}
  const normalizedItems = Array.isArray(items)
    ? items // version3Data: [{label, value}]
    : Object.entries(items || {}).map(([label, value]) => ({ label, value }));

  return (
    <div className="flex-col justify-between">
      {normalizedItems.map((item, index) => (
        <div key={index} className="mb-0.5 max-w-[250px] whitespace-normal break-words">
          <span className="font-medium">{item.label}:</span>
          {/* whitespace-pre-wrap giữ nguyên ký tự xuống dòng \n */}
          <span className="text-[#64748B] ml-2 whitespace-pre-wrap">
            {item.value ? item.value : <span className="text-red-500">x</span>}
          </span>
        </div>
      ))}

      <div className="flex gap-2 mb-0.5">
        <span className="font-medium">Customization Url: </span>
        <Link to={customUrl} className="text-[#64748B]">
          Link
        </Link>
      </div>

      <div className="flex gap-2 mb-0.5">
        <span className="font-medium">Link SP: </span>
        {listingUrl ? (
          <a href={listingUrl} target="_blank" rel="noreferrer" className="text-[#64748B]">
            Link
          </a>
        ) : (
          <span className="text-red-500">x</span>
        )}
      </div>

      {customPhotoUrls.length > 0 && (
        <div className="flex-col gap-2 mt-2">
          <div>
            <span className="font-medium">Customer Photo: </span>
          </div>
          <div className={customPhotoUrls.length > 1 ? 'inline-grid grid-cols-2 gap-4 mt-1' : 'mt-1'}>
            {customPhotoUrls.map((url, index) => (
              <LazyImage
                key={`${orderId || 'etsy'}-${transactionId || 'item'}-custom-photo-${index}`}
                src={url || NoImage}
                alt="Customer Photo"
                width={130}
                height={130}
                preview={getLargePreview(url || NoImage)}
              />
            ))}
          </div>
        </div>
      )}

      {linkImage && (
        <div className="flex-col gap-2">
          <div>
            <span className="font-medium">Customer Photo: </span>
          </div>
          <div
            className="w-[80px] h-[80px] mt-1 rounded-lg overflow-hidden"
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <Image width={80} src={linkImage} fallback={NoImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubItemCustomEtsy;
