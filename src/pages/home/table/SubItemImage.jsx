import { Image, Tooltip } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import NoImage from '../../../assets/NoImage.jpg';
import { FcApproval } from 'react-icons/fc';
import { memo } from 'react';
import { toast } from 'sonner';
import { dowloadPSD } from '../../../apis/listing';
import { MdOutlineCloudDownload } from 'react-icons/md';
import { ImSpinner10 } from 'react-icons/im';

const SubItemImage = ({ linkImage = '', linkFulfill = {}, listing = {}, scale_status, asin, scale_by }) => {
  const arrFulfill = Object.entries(typeof linkFulfill === 'object' ? linkFulfill : {}).map(([key, url]) => ({
    title: key,
    url,
  }));

  const downloadPSD = async () => {
    if (!(listing?.psd?.status === 'Available')) {
      return;
    }
    try {
      const response = await dowloadPSD(asin);
      if (response.status === 200) {
        const { signed_url, asin } = response.data || {};

        if (signed_url) {
          const link = document.createElement('a');
          link.href = signed_url;
          link.setAttribute('download', asin);
          link.setAttribute('target', '_parent');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('Download Failed!');
    } finally {
      toast.success('Download success!');
    }
  };

  const makeDownloadUrl = (url, filename) => {
    if (url) {
      // tách phần trước "upload/"
      const parts = url?.split('/upload/');
      if (parts?.length !== 2) {
        throw new Error("URL không hợp lệ, thiếu '/upload/'");
      }

      // thêm fl_attachment (có filename nếu truyền vào)
      const attach = filename ? `fl_attachment:${filename}` : 'fl_attachment';
      return `${parts[0]}/upload/${attach}/${parts[1]}`;
    }
  };

  return (
    <div>
      <div className={arrFulfill?.length > 0 ? 'inline-grid grid-cols-2 gap-4' : ''}>
        <div
          className="w-[130px] h-[130px] rounded-lg overflow-hidden bg-white"
          style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
        >
          <Image
            src={listing?.product_image || linkImage || NoImage}
            className="rounded-lg"
            width="100%"
            height="100%"
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
          />
        </div>

        {arrFulfill?.length > 0 &&
          arrFulfill.map((f, i) => (
            <div
              key={i}
              className="w-[130px] h-[130px] rounded-lg overflow-hidden bg-white"
              style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
            >
              <Image
                src={f?.url || NoImage}
                className="rounded-lg"
                width="100%"
                height="100%"
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
              />
            </div>
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
                style={{ borderColor: listing?.psd?.status === 'Available' ? dataColors.success : dataColors.pending }}
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
              href={`${makeDownloadUrl(linkFulfill ? linkFulfill?.front : '', asin)}`}
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
