import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import OrderEtsyImageThumb from './OrderEtsyImageThumb';
import { resolveCustomFileImage, resolveSnapshotImage } from './orderEtsyImageResolver';

const OrderEtsySubItemCustomOptimized = ({ items = [], customUrl, linkImage, listingId, customFiles = [], orderId, transactionId }) => {
  const listingUrl = listingId ? `https://www.etsy.com/listing/${listingId}` : '';
  const normalizedCustomFiles = Array.isArray(customFiles) ? customFiles : [];

  const customPhotoImages = useMemo(
    () =>
      normalizedCustomFiles
        .map((file, index) => ({
          key: `${orderId || 'etsy'}-${transactionId || 'item'}-custom-photo-${index}`,
          ...resolveCustomFileImage(file),
        }))
        .filter((image) => image.thumbUrl || image.previewUrl || image.originalUrl),
    [normalizedCustomFiles, orderId, transactionId]
  );

  const snapshotImage = useMemo(() => resolveSnapshotImage(linkImage), [linkImage]);

  const normalizedItems = Array.isArray(items) ? items : Object.entries(items || {}).map(([label, value]) => ({ label, value }));

  return (
    <div className="flex-col justify-between">
      {normalizedItems.map((item, index) => (
        <div key={index} className="mb-0.5 max-w-[250px] whitespace-normal break-words">
          <span className="font-medium">{item.label}:</span>
          <span className="text-[#64748B] ml-2 whitespace-pre-wrap">
            {item.value ? item.value : <span className="text-red-500">x</span>}
          </span>
        </div>
      ))}

      <div className="flex gap-2 mb-0.5">
        <span className="font-medium">Customization Url: </span>
        {customUrl ? (
          <Link to={customUrl} className="text-[#64748B]">
            Link
          </Link>
        ) : (
          <span className="text-red-500">x</span>
        )}
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

      {customPhotoImages.length > 0 && (
        <div className="flex-col gap-2 mt-2">
          <div>
            <span className="font-medium">Customer Photo: </span>
          </div>
          <div className={customPhotoImages.length > 1 ? 'inline-grid grid-cols-2 gap-4 mt-1' : 'mt-1'}>
            {customPhotoImages.map((image) => (
              <OrderEtsyImageThumb
                key={image.key}
                thumbUrl={image.thumbUrl}
                previewUrl={image.previewUrl}
                originalUrl={image.originalUrl}
                alt="Customer Photo"
                width={130}
                height={130}
              />
            ))}
          </div>
        </div>
      )}

      {linkImage && (
        <div className="flex-col gap-2 mt-2">
          <div>
            <span className="font-medium">Customer Photo: </span>
          </div>
          <div className="mt-1">
            <OrderEtsyImageThumb
              thumbUrl={snapshotImage.thumbUrl}
              previewUrl={snapshotImage.previewUrl}
              originalUrl={snapshotImage.originalUrl}
              alt="Customer Photo Snapshot"
              width={80}
              height={80}
              buttonText="View Snapshot"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(OrderEtsySubItemCustomOptimized);
