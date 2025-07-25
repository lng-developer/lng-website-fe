import { dataColors } from '../../../utils/dataColors';
import { FaEdit } from 'react-icons/fa';

const ItemCustomer = ({ nameCustomer }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <button className="hover:underline cursor-pointer hover:text-blue">
        <span className="font-medium hover:text-blue-600 ">{nameCustomer}</span>
      </button>
      <button className="cursor-pointer">
        <FaEdit color={dataColors.pending} />
      </button>
    </div>
  );
};

export default ItemCustomer;
