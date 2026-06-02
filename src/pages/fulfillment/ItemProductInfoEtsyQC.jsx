import StatusComponent from '../../components/StatusComponent';
import LazyImage from '../../components/LazyImage';
import { dataColors } from '../../utils/dataColors';

const ItemProductInfoEtsyQC = ({ link, sku, listingId, title, quantity }) => {
  return (
    <div className="flex items-center gap-5">
      <div
        className="w-[100px] h-[100px] rounded-lg overflow-hidden flex gap-2"
        style={{
          boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
        }}
      >
        <LazyImage src={link} width={100} height={100} preview={true} />
      </div>
      <div className="max-w-[260px]">
        {title && (
          <div className="mb-1 text-left">
            <div className="font-medium">Title:</div>
            <div className="text-[#64748B] whitespace-normal break-words">{title}</div>
          </div>
        )}
        <div className="flex-col">
          <div className="font-medium text-left">SKU:</div>
          <div className="text-left">
            <StatusComponent title={sku || 'No data'} color={dataColors.asin} />
          </div>
        </div>
        <div className="flex-col">
          <div className="font-medium text-left">Listing ID:</div>
          <div className="text-left">
            <StatusComponent title={listingId || 'No data'} color={dataColors.pending} />
          </div>
        </div>
        <div className="flex items-center">
          <div className="font-medium text-left">
            <span>Quantity:</span> <span style={{ color: dataColors.success }}> {quantity}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemProductInfoEtsyQC;
