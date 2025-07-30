import { Flex, Popover } from 'antd';
import StatusComponent from '../../../components/StatusComponent';
import { dataColors } from '../../../utils/dataColors';
import { FaEdit } from 'react-icons/fa';
import { useState } from 'react';

const ItemShippingType = ({ shipping_type }) => {
  const [isShowModalUpdate, setIsShowModalUpdate] = useState(false);
  return (
    <Flex gap={5} justify="center" align="center">
      <StatusComponent title={shipping_type} color={dataColors.success} />
      <Popover content={<div className="font-medium">Edit</div>} title="">
        <button className="cursor-pointer" onClick={() => setIsShowModalUpdate(true)}>
          <FaEdit color={dataColors.pending} />
        </button>
      </Popover>
    </Flex>
  );
};

export default ItemShippingType;
