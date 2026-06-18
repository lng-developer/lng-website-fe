import { Modal } from 'antd';

const OrderEtsyImagePreviewModal = ({ open, onClose, previewUrl, originalUrl, alt = 'Preview image' }) => {
  const imageSrc = open ? previewUrl || originalUrl : '';

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered width="auto" destroyOnHidden>
      <div className="flex flex-col items-center gap-3">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="max-w-[92vw] max-h-[82vh] object-contain"
          />
        ) : (
          <span className="text-[#64748B]">No image</span>
        )}

        {originalUrl && (
          <a href={originalUrl} target="_blank" rel="noreferrer" className="text-[#64748B]">
            Open Original
          </a>
        )}
      </div>
    </Modal>
  );
};

export default OrderEtsyImagePreviewModal;
