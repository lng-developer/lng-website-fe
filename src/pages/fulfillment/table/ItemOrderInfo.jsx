import { Input, Tooltip } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import { toast } from 'sonner';
import { CopyOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export default function OrderInfoForm({ orderId, seller, fulfillName, quantity }) {
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
        <StatusComponent title={seller || 'No data'} color={dataColors.process} />
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">
          Quantity: <span style={{ color: dataColors.asin }}>{quantity}</span>
        </div>
      </div>
      <div className="mb-1 max-w-[220px]" style={{ position: 'relative', width: '100%' }}>
        <div className="font-semibold text-gray-800 mb-1">Fulfill Name:</div>
        <div>
          <div
            className="border px-2 py-1 rounded text-sm inline-flex items-center
               max-w-[220px] break-words"
            style={{ borderColor: '#08969b', fontWeight: 500 }}
          >
            {fulfillName}
          </div>
          <Tooltip title="Copy">
            <CopyOutlined
              onClick={() => handleCopy(fulfillName)}
              style={{
                position: 'absolute',
                top: 35,
                right: 5,
                cursor: 'pointer',
                color: '#08969b',
              }}
            />
          </Tooltip>
        </div>
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Buyer Note: </div>
        <TextArea placeholder="Note" style={{ maxWidth: 220 }} />
      </div>
    </div>
  );
}
