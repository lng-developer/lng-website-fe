import { BsFillNutFill } from 'react-icons/bs';
import { FaGlobeAmericas } from 'react-icons/fa';
import ItemComponent from './ItemComponent';
import { dataNav } from '../utils/dataMenu';
import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
const { SubMenu } = Menu;

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 right-0 top-0 z-50 w-full border-r-2 border-r-[#f1f5f9] md:bottom-0 md:right-auto md:h-svh md:w-64">
      <div className="h-[60px] items-center gap-4 bg-background flex-none sticky top-0 z-50 flex justify-between px-1 py-3 shadow-sm md:px-[10px]">
        <div>
          <BsFillNutFill size={25} />
        </div>
        <div className="visible w-auto flex flex-col justify-end truncate">
          <span className="font-medium">LNG System</span>
          <span className="cursor-pointer text-xs transition hover:underline truncate block w-full">Hào Chu Quangg</span>
        </div>
        <div className="flex items-center visible w-auto ml-auto">
          <button className="p-3 hover:bg-[#f1f5f9] rounded-3xl cursor-pointer">
            <FaGlobeAmericas />
          </button>
        </div>
      </div>
      <div className="py-2 flex-col justify-between">
        <Menu mode="inline" selectedKeys={[location.pathname]}>
          {dataNav.map((data, index) => {
            if (data?.subMenu?.length > 0) {
              return (
                <SubMenu
                  key={data.link}
                  title={
                    <div className="flex gap-3 justify-start items-center px-2 !text-black">
                      {data.icon}
                      <span className="font-medium text-base">{data.title}</span>
                    </div>
                  }
                >
                  {data?.subMenu?.map((item, indexItem) => (
                    <div key={indexItem} className="ml-6">
                      <ItemComponent title={item?.title} link={item?.link} icon={item?.icon} />
                    </div>
                  ))}
                </SubMenu>
              );
            } else {
              return <ItemComponent title={data?.title} link={data?.link} icon={data?.icon} />;
            }
          })}
        </Menu>
      </div>
    </aside>
  );
}
