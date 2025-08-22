import { Input } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';

const { TextArea } = Input;

export default function OrderInfoForm({ orderId, seller, fulfillName }) {
  return (
    <div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Order ID:</div>
        <StatusComponent title={orderId} color={dataColors.pink} />
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Seller:</div>
        <StatusComponent title={seller} color={dataColors.asin} />
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Fulfill Name:</div>
        <div
          className="border px-2 py-1 rounded text-sm font-normal inline-flex items-center"
          style={{ borderColor: '#08969b', maxWidth: 200 }}
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
