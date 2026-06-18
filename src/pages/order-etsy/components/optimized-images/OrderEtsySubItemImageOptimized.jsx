import { memo, useCallback, useMemo } from 'react';
import { Tooltip } from 'antd';
import { FcApproval } from 'react-icons/fc';
import { MdOutlineCloudDownload } from 'react-icons/md';
import { ImSpinner10 } from 'react-icons/im';
import { toast } from 'sonner';
import StatusComponent from '../../../../components/StatusComponent';
import { dataColors } from '../../../../utils/dataColors';
import { dowloadPSD } from '../../../../apis/listing';
import OrderEtsyImageThumb from './OrderEtsyImageThumb';
import { resolveEtsyImage } from './orderEtsyImageResolver';

const OrderEtsySubItemImageOptimized = ({
  linkImage = '',
  linkFulfill = {},
  listing = {},
  scale_status,
  asin,
  scale_by,
  imageSize = 130,
}) => {
  const productImage = useMemo(() => resolveEtsyImage(listing?.product_image || linkImage), [linkImage, listing?.product_image]);

  const fulfillmentImages = useMemo(
    () =>
      Object.entries(typeof linkFulfill === 'object' ? linkFulfill : {}).map(([key, url]) => ({
        title: key,
        ...resolveEtsyImage(url),
      })),
    [linkFulfill]
  );

  const downloadPSD = useCallback(async () => {
    if (!(listing?.psd?.status === 'Available')) return;
    try {
      const response = await dowloadPSD(asin);
      if (response.status === 200) {
        const { signed_url, asin: asinName } = response.data || {};
        if (signed_url) {
          const link = document.createElement('a');
          link.href = signed_url;
          link.setAttribute('download', asinName);
          link.setAttribute('target', '_parent');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        toast.success('Download success!');
      } else {
        toast.error('Download Failed!');
      }
    } catch {
      toast.error('Download Failed!');
    }
  }, [asin, listing?.psd?.status]);

  return (
    <div>
      <div className={fulfillmentImages?.length > 0 ? 'inline-grid grid-cols-2 gap-4' : ''}>
        <OrderEtsyImageThumb
          thumbUrl={productImage.thumbUrl}
          previewUrl={productImage.previewUrl}
          originalUrl={productImage.originalUrl}
          alt="Product"
          width={imageSize}
          height={imageSize}
        />

        {fulfillmentImages?.length > 0 &&
          fulfillmentImages.map((image, index) => (
            <OrderEtsyImageThumb
              key={`${image.title || 'fulfillment'}-${index}`}
              thumbUrl={image.thumbUrl}
              previewUrl={image.previewUrl}
              originalUrl={image.originalUrl}
              alt={image.title || 'Fulfillment image'}
              width={imageSize}
              height={imageSize}
            />
          ))}
      </div>

      <div className="mt-3">
        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">PSD:</span>
            <FcApproval />
          </div>
          <div>
            <Tooltip title={listing?.psd?.status === 'Available' ? 'Download' : false}>
              <div
                style={{
                  borderColor: listing?.psd?.status === 'Available' ? dataColors.success : dataColors.pending,
                }}
                className="inline-flex items-center gap-1 rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
                onClick={downloadPSD}
              >
                <span>
                  {listing?.psd?.status === 'Available' ? (
                    <MdOutlineCloudDownload color={dataColors.success} size={16} />
                  ) : (
                    <ImSpinner10 color={dataColors.pending} size={12} />
                  )}
                </span>
                <span
                  style={{
                    color: listing?.psd?.status === 'Available' ? dataColors.success : dataColors.pending,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'inline-block',
                  }}
                  className="whitespace-nowrap"
                >
                  {listing?.psd?.status === 'Available' ? 'Download' : 'Pending'}
                </span>
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">ASIN Type:</span>
          </div>
          <div>
            <StatusComponent title={listing?.asin_type || 'No data'} color={dataColors.asin} />
          </div>
        </div>

        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">PNG Status:</span>
          </div>
          <div>
            <StatusComponent title={scale_status || 'No data'} color={dataColors.success} />
          </div>
        </div>

        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">Scale By:</span>
          </div>
          <div>
            <StatusComponent title={scale_by?.full_name || 'No data'} color={dataColors.process} />
          </div>
        </div>

        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">QC By:</span>
          </div>
          <div>
            <StatusComponent title="Đặng Thành Trung CS" color={dataColors.purple} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OrderEtsySubItemImageOptimized);
