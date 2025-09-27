import { Select } from 'antd';
import { updateOrder } from '../../apis/order';
import { toast } from 'sonner';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';

const ItemScaleBy = ({ orderId, scale_by, designers, fetchAllFulfill, filters, showSelect = false }) => {
  const onChange = async (val) => {
    try {
      const response = await updateOrder(orderId, { scaleId: val });
      if (response.status === 200) {
        toast.success('Update success!');
      }
    } catch (error) {
      console.log(error);
    } finally {
      fetchAllFulfill(filters);
    }
  };
  return (
    <>
      {showSelect ? (
        <Select
          placeholder="Select a person"
          optionFilterProp="label"
          value={scale_by}
          onChange={onChange}
          style={{ width: 200 }}
          options={designers}
        />
      ) : (
        <StatusComponent title={scale_by} color={dataColors.purple} />
      )}
    </>
  );
};

export default ItemScaleBy;
