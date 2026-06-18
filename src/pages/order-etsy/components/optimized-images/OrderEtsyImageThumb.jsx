import { memo, useCallback, useState } from 'react';
import OrderEtsyImagePreviewModal from './OrderEtsyImagePreviewModal';

const OrderEtsyImageThumb = ({
  thumbUrl = '',
  previewUrl = '',
  originalUrl = '',
  alt = 'Order image',
  width = 130,
  height = 130,
  buttonText = 'View Image',
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const canPreview = Boolean(previewUrl || originalUrl);

  const openPreview = useCallback(() => {
    if (canPreview) setIsPreviewOpen(true);
  }, [canPreview]);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  if (!thumbUrl && !canPreview) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#94A3B8]"
        style={{ width, height }}
      >
        No Image
      </div>
    );
  }

  return (
    <>
      {thumbUrl ? (
        <button
          type="button"
          onClick={openPreview}
          className="block rounded-lg overflow-hidden bg-[#F8FAFC] cursor-pointer p-0 border-0"
          style={{
            width,
            height,
            boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
          }}
        >
          <img
            src={thumbUrl}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={openPreview}
          className="rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#F8FAFC]"
        >
          {buttonText}
        </button>
      )}

      <OrderEtsyImagePreviewModal
        open={isPreviewOpen}
        onClose={closePreview}
        previewUrl={previewUrl}
        originalUrl={originalUrl}
        alt={alt}
      />
    </>
  );
};

export default memo(OrderEtsyImageThumb);
