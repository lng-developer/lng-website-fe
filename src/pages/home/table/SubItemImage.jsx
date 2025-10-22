import { memo, useCallback, useMemo } from 'react';
import { Tooltip } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import NoImage from '../../../assets/NoImage.jpg';
import { FcApproval } from 'react-icons/fc';
import { toast } from 'sonner';
import { dowloadPSD } from '../../../apis/listing';
import { MdOutlineCloudDownload } from 'react-icons/md';
import { ImSpinner10 } from 'react-icons/im';

// 👉 Dùng LazyImage dùng chung
import LazyImage from '../../../components/LazyImage';

const SubItemImage = ({ linkImage = '', linkFulfill = {}, listing = {}, scale_status, asin, scale_by }) => {
  const arrFulfill = useMemo(
    () =>
      Object.entries(typeof linkFulfill === 'object' ? linkFulfill : {}).map(([key, url]) => ({
        title: key,
        url,
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

  const makeDownloadUrl = useCallback((url, filename) => {
    if (!url) return '';
    const parts = url.split('/upload/');
    if (parts?.length !== 2) return url;
    const attach = filename ? `fl_attachment:${filename}` : 'fl_attachment';
    return `${parts[0]}/upload/${attach}/${parts[1]}`;
  }, []);

  return (
    <div>
      <div className={arrFulfill?.length > 0 ? 'inline-grid grid-cols-2 gap-4' : ''}>
        {/* Ảnh listing / base */}
        <LazyImage src={listing?.product_image || linkImage || NoImage} alt="Product" width={130} height={130} preview={true} />

        {/* Ảnh fulfill */}
        {arrFulfill?.length > 0 &&
          arrFulfill.map((f, i) => <LazyImage key={i} src={f?.url || NoImage} alt={f?.title} width={130} height={130} preview={true} />)}
      </div>

      {/* Info */}
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

        {linkFulfill?.front && (
          <div className="flex-col gap-2 mt-2">
            <div className="flex items-center">
              <span className="mr-2 font-medium">Download:</span>
            </div>
            <a
              href={`${makeDownloadUrl(linkFulfill?.front, asin)}`}
              className="inline-flex items-center gap-1 rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground cursor-pointer"
            >
              <MdOutlineCloudDownload color={dataColors.pending} size={16} />
              <span>Download Fulfill</span>
            </a>
          </div>
        )}

        <div className="flex-col gap-2 mt-2">
          <div className="flex items-center">
            <span className="mr-2 font-medium">ASIN Type:</span>
          </div>
          <div>
            <StatusComponent title={listing?.asin_type || 'No data'} color="#0958d7" />
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

export default memo(SubItemImage);
