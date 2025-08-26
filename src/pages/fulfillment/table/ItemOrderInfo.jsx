import { Input } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import { toast } from 'sonner';

const { TextArea } = Input;

export default function OrderInfoForm({ orderId, seller, fulfillName }) {
  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.log(err);
      toast.error('Failed to copy!');
    }
  };
  return (
    <div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Order ID:</div>
        <button className="cursor-pointer" onClick={() => handleCopy(orderId)}>
          <StatusComponent title={orderId} color={dataColors.pink} />
        </button>
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Seller:</div>
        <StatusComponent title={seller} color={dataColors.asin} />
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Fulfill Name:</div>
        <div
          className="border px-2 py-1 rounded text-sm inline-flex items-center
             max-w-[220px] break-words"
          style={{ borderColor: '#08969b' }}
        >
          {fulfillName}
        </div>
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Buyer Note: </div>
        <TextArea placeholder="Note" style={{ maxWidth: 200 }} />
      </div>
    </div>
  );
}
