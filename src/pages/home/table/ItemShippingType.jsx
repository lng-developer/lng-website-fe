import { Flex, Modal, Popover, Select } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import { FaEdit } from 'react-icons/fa';
import { useState } from 'react';
import { dataShippingType } from '../../../utils/dataShippingType';
import { MdNotificationsActive } from 'react-icons/md';
import { updateShippingType } from '../../../apis/order';
import { toast } from 'react-toastify';

const ItemShippingType = ({ orderId, shipping_type, fetchAllOrder, filters }) => {
  const [isShowModalUpdate, setIsShowModalUpdate] = useState(false);
  const [shippingType, setShippingType] = useState('');
  const [disabled, setDisabled] = useState(true);

  const handleUpdate = async () => {
    try {
      const response = await updateShippingType(orderId, shippingType);
      if (response.status === 200) {
        toast.success(`Updated shipping type success!`, { autoClose: 1000 });
        fetchAllOrder(filters);
        setIsShowModalUpdate(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update shipping type!`, { autoClose: 1000 });
    }
  };

  return (
    <>
      <Flex gap={5} justify="center" align="center">
        <StatusComponent title={shipping_type} color={dataColors.success} />
        <Popover content={<div className="font-medium">Edit</div>} title="">
          <button className="cursor-pointer" onClick={() => setIsShowModalUpdate(true)}>
            <FaEdit color={dataColors.pending} />
          </button>
        </Popover>
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

export default ItemShippingType;
