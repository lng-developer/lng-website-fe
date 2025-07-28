import { IoSettingsOutline } from 'react-icons/io5';
import { IoIosArrowDown } from 'react-icons/io';
import { dataColors } from '../utils/dataColors';
import { Button, DatePicker, Popconfirm } from 'antd';
import ModalImportOrder from '../pages/home/ModalImportOrder';
import { useState } from 'react';
import locale from 'antd/es/date-picker/locale/en_US';
import enUS from 'antd/es/date-picker/locale/en_US';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { useOrder } from '../context/OrderContext';
import { LuImport } from 'react-icons/lu';
const customLocale = {
  ...enUS,
  lang: {
    ...locale.lang,
    ok: 'Apply',
  },
};

const { RangePicker } = DatePicker;
const Header = () => {
  const [isShowModal, setIsShowModal] = useState(false);
  const [isShowPop, setIsShowPop] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState([]);
  const [range, setRange] = useState([]);
  const { dataFilter, setOrders } = useOrder();

  const handleOnclick = () => {
    setIsShowModal((prev) => !prev);
    setIsShowPop(false);
  };

  const handleApply = () => {
    const filtered = filterOrdersByDate(dataFilter, range);
    setOrders(filtered);
    setOpen(false); // ✅ chỉ đóng khi ấn Apply
  };

  const filterOrdersByDate = (ordersFil, range) => {
    if (!range?.[0] || !range?.[1]) return ordersFil;

    const [start, end] = [startOfDay(range[0]), endOfDay(range[1])];

    return ordersFil?.filter((order) => {
      const createdAt = parseISO(order?.purchase_date); // convert ISO string to Date
      return isWithinInterval(createdAt, { start, end });
    });
  };
  const onDateChange = (dates) => {
    setRange(dates);
  };
  return (
    <>
      <div className="z-20 h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
        <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
          Manage Orders
        </h1>
        <div className="flex justify-center items-center gap-2">
          <button
            className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
            onClick={handleOnclick}
          >
            <span className="text-sm font-medium" style={{ color: 'black' }}>
              Import Orders
            </span>
            <div style={{ color: 'black' }}>
              <LuImport size={15} />
            </div>
          </button>
          <RangePicker
            locale={customLocale}
            format="MMM D, YYYY"
            value={value}
            size="large"
            open={open}
            className="range-center"
            onChange={onDateChange}
            onCalendarChange={(val) => {
              if (val?.[0] && val?.[1]) {
                setValue(val);
                setOpen(true); // giữ popup luôn mở
              }
            }}
            onOpenChange={(nextOpen) => {
              // chỉ mở, không cho tự đóng
              if (nextOpen) setOpen(true);
            }}
            panelRender={(panelNode) => (
              <div>
                {panelNode}
                <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-4 py-2">
                  <Button
                    type="default"
                    size="middle"
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    Close
                  </Button>
                  <Button type="primary" size="middle" onClick={handleApply}>
                    Apply
                  </Button>
                </div>
              </div>
            )}
          />
          <button
            style={{ color: 'black' }}
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
