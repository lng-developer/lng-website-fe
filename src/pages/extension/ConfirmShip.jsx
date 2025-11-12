import React from 'react';
import { useOutletContext } from 'react-router-dom';

const ConfirmShip = () => {
  const { collapsed } = useOutletContext();
  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            AMZ Confirm Shipping
          </h1>
        </div>
      </div>

      <div className="mt-[60px] px-8 py-4 h-full"></div>
    </div>
  );
};

export default ConfirmShip;
