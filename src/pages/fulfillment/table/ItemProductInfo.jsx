import { Image, Button, Tooltip } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import NoImage from '../../../assets/NoImage.jpg';
import { RiLinkM } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { dowloadPSD } from '../../../apis/listing';
import { toast } from 'sonner';
import { MdOutlineCloudDownload } from 'react-icons/md';
import { ImSpinner10 } from 'react-icons/im';

const ItemProductInfo = ({ imageUrl, asin, sku, listing }) => {
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
  return (
    <div className="">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <div
          className="w-[130px] h-[130px] rounded-lg overflow-hidden flex gap-2 shadow-md mb-2"
          style={{
            boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
          }}
        >
          <Image
            width={130}
            height={130}
            src={listing?.product_image || imageUrl || NoImage}
            className="rounded-lg object-cover"
            alt="Product"
            preview={{
              mask: <div className="">Preview</div>,
            }}
          />
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-1 ">
        {/* ASIN Section */}
        {asin && (
          <div className="mb-1">
            <div className="font-semibold text-gray-800 ">ASIN:</div>
            <div className="flex items-center gap-1">
              <StatusComponent title={asin} color={dataColors.pending} />
              <Tooltip title="Open Link">
                <Link target="_blank" className="!text-black" to={`http://amazon.com/gp/product/${asin}`}>
                  <RiLinkM size={18} />
                </Link>
              </Tooltip>
            </div>
          </div>
        )}
        {listing?.asin_type && (
          <div className="mb-1">
            <div className="font-semibold text-gray-800 ">Asin Type:</div>
            <StatusComponent title={listing?.asin_type} color={dataColors.pink} />
          </div>
        )}
        {/* SKU Section */}
        {sku && (
          <div className="mb-1">
            <div className="font-semibold text-gray-800 ">SKU:</div>
            <StatusComponent title={sku} color={dataColors.asin} />
          </div>
        )}
        <div onClick={dowloadPSD}>
          <div className="font-semibold text-gray-800  mb-1">PSD:</div>
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
                {listing?.psd?.status === 'Available' ? 'Download PSD' : 'Pending'}
              </span>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default ItemProductInfo;
