import { dataNav } from '../utils/dataMenu';
import { Dropdown, Flex, Image, Input, Menu, Modal } from 'antd';
import { useAuth } from '../context/AuthContext';
import { IoLogoAmazon } from 'react-icons/io5';
import { FcRating } from 'react-icons/fc';
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6';
import { dataColors } from '../utils/dataColors';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../routes/routes';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import { toast } from 'react-toastify';
import { changePassword } from '../apis/auth';

export default function Sidebar({ collapsed, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isShowModalChangePassword, setIsShowModalChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorCurrentPassword, setErrorCurrentPassword] = useState(false);
  const [errorNewPassword, setErrorNewPassword] = useState(false);

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

  const handleLogout = async () => {
    logout();
    toast.success('Logout success');
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setErrorCurrentPassword(true);
      return;
    }
    if (!newPassword) {
      setErrorNewPassword(true);
      return;
    }

    try {
      const response = await changePassword({
        username: user?.username,
        oldPassword: currentPassword,
        newPassword: newPassword,
      });
      if (response.status === 200) {
        toast.success('Change password success!');
      } else {
        toast.error('Change password error!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Change password error!');
    } finally {
      setIsShowModalChangePassword(false);
    }
  };

  const menu = (
    <Flex
      vertical={true}
      justify="left"
      style={{ width: 150, backgroundColor: 'white', padding: 4 }}
      className="gap-1 py-2 shadow-sm rounded-lg border-1 border-[#d3d9e1]"
    >
      <div
        className="px-3 py-1 hover:bg-[#f1f5f9] font-medium cursor-pointer rounded-lg"
        style={{ color: dataColors.title }}
        onClick={() => setIsShowModalChangePassword(true)}
      >
        Change Password
      </div>
      <div
        className="px-3 py-1 hover:bg-[#f1f5f9] font-medium cursor-pointer rounded-lg"
        style={{ color: dataColors.title }}
        onClick={handleLogout}
      >
        Logout
      </div>
    </Flex>
  );

  useEffect(() => {
    if (location.pathname === '/') {
      navigate(routes.order_amazon, { replace: true });
    }
  }, [location.pathname, navigate]);
  return (
    <>
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
            <Image src={logo} width={35} />
            <div className="visible w-auto flex flex-col justify-end truncate">
              <span className="font-medium" style={{ color: 'black' }}>
                LNG System
              </span>
              <Dropdown
                trigger={['click']}
                open={openDropdown}
                onOpenChange={setOpenDropdown}
                popupRender={() => menu}
                placement="bottomLeft"
              >
                <span
                  className="cursor-pointer text-xs font-medium transition hover:underline truncate block w-full"
                  style={{ color: dataColors.title }}
                >
                  {user?.full_name}
                </span>
              </Dropdown>
            </div>
            <div className="flex items-center visible w-auto ml-auto">
              <button className="p-3 hover:bg-[#f1f5f9] rounded-3xl cursor-pointer">
                <FcRating size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-[60px] items-center gap-4 bg-background flex-none sticky top-0 z-50 flex justify-center px-1 py-3 shadow-sm md:px-[10px]">
            <Image src={logo} width={35} />
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
      <Modal
        title="Change Password"
        width={350}
        style={{ top: '20%' }}
        okText="Change Password"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isShowModalChangePassword}
        onOk={handleChangePassword}
        onCancel={() => setIsShowModalChangePassword(false)}
      >
        <Flex vertical={true} gap={10} style={{ paddingBottom: 10 }}>
          <Flex vertical={true} gap={2}>
            <span className="font-medium" style={{ color: dataColors.title }}>
              Current Password
            </span>
            <Input.Password
              defaultValue={currentPassword}
              value={currentPassword}
              visibilityToggle={true}
              type="password"
              placeholder="Current Password"
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
            {errorCurrentPassword && (
              <div>
                <span className="text-[#ff0000]">Please enter current password</span>
              </div>
            )}
          </Flex>
          <Flex vertical={true} gap={2}>
            <span className="font-medium" style={{ color: dataColors.title }}>
              New Password
            </span>
            <Input.Password
              defaultValue={newPassword}
              value={newPassword}
              visibilityToggle={true}
              type="password"
              placeholder="New Password"
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full flex-1"
            />
            {errorNewPassword && (
              <div>
                <span className="text-[#ff0000]">Please enter new password</span>
              </div>
            )}
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
