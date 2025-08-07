import React from 'react';

const ItemCostCenter = ({ vendorProduct = 'GodGroup - Printed PET Hoodie', size = 'XL', color = 'Black / 2 Sides' }) => {
  return (
    <div className="text-sm">
      {/* Vendor Product Section */}
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Vendor Product:</div>
        <div className="border px-2 py-1 rounded text-sm font-normal inline-flex items-center" style={{ borderColor: '#08969b' }}>
          {vendorProduct}
        </div>
      </div>

      {/* Size Section */}
      <div className="mb-1">
        <div className="font-semibold text-gray-800 mb-1">Size:</div>
        <div className="border px-2 py-1 rounded text-sm font-normal w-fit inline-flex items-center" style={{ borderColor: '#08969b' }}>
          {size}
        </div>
      </div>

      {/* Color Section */}
      <div>
        <div className="font-semibold text-gray-800 mb-1 ">Color:</div>
        <div className="border px-2 py-1 rounded text-sm font-normal inline-flex items-center" style={{ borderColor: '#08969b' }}>
          {color}
        </div>
      </div>
    </div>
  );
};

export default ItemCostCenter;
