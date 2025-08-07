import { Input } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';

const { TextArea } = Input;

export default function OrderInfoForm() {
  const orderData = {
    orderId: 'T11-4323604-8773863',
    seller: 'Nguyễn Huy Hoàng',
    fulfillName: 'T11-4323604-8773863-11842012004108I-0',
    buyerNote: '',
  };

  return (
    <div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Order ID:</div>
        <StatusComponent title={orderData.orderId} color={dataColors.purple} />
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Seller:</div>
        <StatusComponent title={orderData.seller} color={dataColors.asin} />
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Fulfill Name:</div>
        <div className="border px-2 py-1 rounded text-sm font-normal inline-flex items-center" style={{ borderColor: '#08969b' }}>
          {orderData.fulfillName}
        </div>
      </div>
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Buyer Note: </div>
        <TextArea placeholder="Note" />
      </div>
    </div>
  );
}
