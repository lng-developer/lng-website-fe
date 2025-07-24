import { IoSettingsOutline } from 'react-icons/io5';
import { IoIosArrowDown } from 'react-icons/io';
import { dataColors } from '../utils/dataColors';
import { Popconfirm } from 'antd';
import ModalImportOrder from '../pages/home/ModalImportOrder';
import { useState } from 'react';

const Header = () => {
  const [isShowModal, setIsShowModal] = useState(false);
  const [isShowPop, setIsShowPop] = useState(false);

  const handleOnclick = () => {
    setIsShowModal((prev) => !prev);
    setIsShowPop(false);
  };
  return (
    <>
      <div className="z-20 h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
        <h1 className="text-2xl !mb-0">Manage Orders</h1>
        <div className="flex justify-center items-center gap-2">
          <Popconfirm
            open={isShowPop}
            description={
              <button
                className={`text-md font-medium p-2 cursor-pointer rounded-lg hover:bg-[${dataColors.backgroundHover}]`}
                onClick={handleOnclick}
              >
                Import Orders
              </button>
            }
            showArrow={false}
            showCancel={false}
            okButtonProps={{ style: { display: 'none' } }}
            placement="bottomLeft"
            icon={null}
          >
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={() => {
                setIsShowPop((prev) => !prev);
              }}
            >
              <span className="text-sm font-medium">Actions</span>
              <div>
                <IoIosArrowDown size={15} />
              </div>
            </button>
          </Popconfirm>

          <button
            className={`border-[${dataColors.default}] inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium disabled:opacity-50 border border-input h-10 px-4 py-2 cursor-pointer`}
          >
            <IoSettingsOutline />
          </button>
        </div>
      </div>
      <ModalImportOrder isModalOpen={isShowModal} setIsModalOpen={setIsShowModal} />
    </>
  );
};

export default Header;
