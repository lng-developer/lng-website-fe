import { Input } from 'antd';
import React from 'react';
import { dataColors } from '../../../utils/dataColors';
import { MdOutlineDoNotDisturb } from 'react-icons/md';

const ItemCostCenter = ({ cost_center = {} }) => {
  return (
    <div className="text-sm">
      {/* Vendor Product Section */}
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Vendor Product</div>
        <Input.TextArea
          value={cost_center?.vendorProductDisplayName}
          placeholder="Vendor product"
          style={{ borderColor: dataColors.asin, resize: 'none' }}
          autoSize={{ minRows: 2, maxRows: 6 }}
          spellCheck={false}
        />
      </div>

      {/* Size Section */}
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Size</div>
        <div className="border px-2 py-1 rounded text-sm font-normal w-fit inline-flex items-center" style={{ borderColor: '#08969b' }}>
          {cost_center?.sizeValue || <MdOutlineDoNotDisturb />}
        </div>
      </div>

      {/* Color Section */}
      <div>
        <div className="font-semibold text-gray-800 mb-1 ">Color</div>
        <div className="border px-2 py-1 rounded text-sm font-normal w-fit inline-flex items-center" style={{ borderColor: '#08969b' }}>
          {cost_center?.colorValue || <MdOutlineDoNotDisturb />}
        </div>
      </div>
    </div>
  );
};

export default ItemCostCenter;
