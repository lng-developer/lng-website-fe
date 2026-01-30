import { Flex, Modal, Select, Tooltip } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import { memo, useState } from 'react';
import { dataShippingType } from '../../../utils/dataShippingType';
import { MdNotificationsActive } from 'react-icons/md';
import { updateShippingType } from '../../../apis/order';
import { BiSolidEdit } from 'react-icons/bi';
import { toast } from 'sonner';

const ItemShippingType = ({ orderId, shipping_type, fetchAllOrder, filters }) => {
  const [isShowModalUpdate, setIsShowModalUpdate] = useState(false);
  const [shippingType, setShippingType] = useState('');
  const [disabled, setDisabled] = useState(true);

  const handleUpdate = async () => {
    try {
      const response = await updateShippingType(orderId, shippingType);
      if (response.status === 200) {
        toast.success(`Updated shipping type success!`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update shipping type!`);
    } finally {
      setIsShowModalUpdate(false);
      fetchAllOrder(filters);
    }
  };

  const handleColor = (stt) => {
    switch (stt) {
      case 'Standard':
        return dataColors.success;
      case 'Expedited':
        return dataColors.process;
      case 'Overnight':
        return dataColors.pending;
      case 'Ground':
        return dataColors.asin;
      case 'Second Day':
        return dataColors.process;
      case 'FreeEconomy':
        return dataColors.pending;
      default:
        return dataColors.default;
    }
  };

  return (
    <>
      <Flex gap={5} justify="center" align="center">
        <StatusComponent title={shipping_type} color={handleColor(shipping_type)} />
        <Tooltip title="Edit">
          <button className="cursor-pointer" onClick={() => setIsShowModalUpdate(true)}>
            <BiSolidEdit size={16} color={dataColors.pending} />
          </button>
        </Tooltip>
      </Flex>
      <Modal
        title="Update Shipping Type"
        width={350}
        style={{ top: '20%' }}
        okText="Update"
        okButtonProps={{ disabled: disabled }}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalUpdate}
        onOk={handleUpdate}
        onCancel={() => setIsShowModalUpdate(false)}
      >
        <Flex vertical={true} gap={2} style={{ paddingTop: 5, paddingBottom: 10 }}>
          <Select
            defaultValue={shipping_type}
            onChange={(value) => {
              if (shipping_type === value) {
                setDisabled(true);
              } else {
                setDisabled(false);
              }
              setShippingType(value);
            }}
            placeholder="Select Shipping Type"
            options={dataShippingType}
          />
          <Flex gap={8} align="center" style={{ marginTop: 10, marginBottom: 5 }}>
            <MdNotificationsActive fontSize={20} />
            <span className="font-medium text-xl">Note</span>
          </Flex>
          <Flex vertical={true} gap={5}>
            <Flex vertical={true}>
              <span className="font-medium">Second Day:</span>
              <span>2 Day, Second Day, SecondDay, 2 Day, 2 Days</span>
            </Flex>
            <Flex vertical={true}>
              <span className="font-medium">Ground:</span>
              <span>Ground, Expedited</span>
            </Flex>
            <Flex vertical={true}>
              <span className="font-medium">Overnight:</span>
              <span>Overnight: Overnight, Standard Overnight</span>
            </Flex>
            <Flex vertical={true}>
              <span className="font-medium">Economy:</span>
              <span>Economy, Standard, FreeEconomy, Standard Shipping, Free Shipping</span>
            </Flex>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};

export default memo(ItemShippingType);
