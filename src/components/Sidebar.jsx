import { dataNav } from '../utils/dataMenu';
import { Menu } from 'antd';
import { useAuth } from '../context/AuthContext';
import { IoLogoAmazon } from 'react-icons/io5';
import { FcRating } from 'react-icons/fc';
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6';
import { dataColors } from '../utils/dataColors';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../routes/routes';
import { useEffect } from 'react';

export default function Sidebar({ collapsed, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Lấy key đang active
  const selectedKey = location.pathname;

  const getOpenKey = () => {
    if (selectedKey.startsWith(routes.order_amazon) || selectedKey.startsWith(routes.order_shopify)) {
      return routes.order;
    }
    if (selectedKey.startsWith(routes.vendor)) {
      return routes.vendor;
    }
    return '';
  };

  useEffect(() => {
    if (location.pathname === '/') {
      navigate(routes.order_amazon, { replace: true });
    }
  }, [location.pathname, navigate]);
  return (
    <aside
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 w-full border-r-2 border-r-[#f1f5f9] md:bottom-0 md:right-auto md:h-svh ${
        collapsed ? 'md:w-64' : 'md:w-20'
      }`}
    >
      {collapsed ? (
        <div
          className="h-[60px] items-center gap-4 bg-background flex-none sticky top-0 z-50 flex justify-between px-1 py-3 shadow-sm md:px-[10px]"
          style={{ color: 'black' }}
        >
          <div>
            <IoLogoAmazon size={25} />
          </div>
          <div className="visible w-auto flex flex-col justify-end truncate">
            <span className="font-medium" style={{ color: 'black' }}>
              LNG System
            </span>
            <span className="cursor-pointer text-xs transition hover:underline truncate block w-full" style={{ color: 'black' }}>
              {user?.full_name}
            </span>
          </div>
          <div className="flex items-center visible w-auto ml-auto">
            <button className="p-3 hover:bg-[#f1f5f9] rounded-3xl cursor-pointer">
              <FcRating size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="h-[60px] items-center gap-4 bg-background flex-none sticky top-0 z-50 flex justify-center px-1 py-3 shadow-sm md:px-[10px]">
          <IoLogoAmazon size={25} />
        </div>
      )}
      <div className="py-2">
        <Menu
          selectedKeys={[selectedKey]}
          defaultOpenKeys={[getOpenKey()]}
          mode="inline"
          items={dataNav}
          inlineCollapsed={!collapsed}
          onClick={({ key }) => navigate(key)}
        />
      </div>
      <button
        onClick={toggleSidebar}
        className={`absolute bottom-60 right-[-12px] z-50 rounded-full shadow p-2 bg-white cursor-pointer border-1 border-[${dataColors.default}]`}
      >
        {collapsed ? <FaAnglesLeft color="black" /> : <FaAnglesRight color="black" />}
      </button>
    </aside>
  );
}
