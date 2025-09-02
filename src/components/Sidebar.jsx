import { topMenus, detailMenus } from '../utils/dataMenu';
import { Dropdown, Flex, Image, Input, Layout, Menu, Modal, Popover } from 'antd';
import { useAuth } from '../context/AuthContext';
import { FcRating } from 'react-icons/fc';
import { FaAnglesLeft, FaAnglesRight } from 'react-icons/fa6';
import { dataColors } from '../utils/dataColors';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../routes/routes';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import { changePassword } from '../apis/auth';
import { toast } from 'sonner';
const { Sider } = Layout;

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
  const [activeMenu, setActiveMenu] = useState('sales');
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
    console.log(user);
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
        username: user?.email,
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

  // render nội dung popup menu
  const renderPopoverMenu = (menuKey) => {
    const items = detailMenus[menuKey];
    return (
      <div style={{ width: 'auto', padding: 0 }}>
        <div style={{ fontWeight: 600, padding: '4px' }}>{topMenus.find((m) => m.key === menuKey)?.label}</div>
        <Menu mode="vertical" items={items} onClick={({ key }) => navigate(key)} className="ant-menu-submenu-title-config" />
      </div>
    );
  };

  useEffect(() => {
    if (location.pathname === '/') {
      navigate(routes.order_amazon, { replace: true });
    }
  }, [location.pathname, navigate]);
  return (
    <>
      <aside
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 w-full border-r-1 border-r-[#f1f5f9] md:bottom-0 md:right-auto md:h-svh ${
          collapsed ? 'md:w-64' : 'md:w-13.5'
        }`}
      >
        <div
          className="h-[60px] flex items-center gap-4 bg-background flex-none sticky top-0 z-50 py-3 shadow-sm md:px-[7.5px]"
          style={{ color: 'black' }}
        >
          <div className="flex justify-center items-center ml-0.5">
            <Image src={logo} width={35} preview={false} />
          </div>
          <Flex width={!collapsed ? 0 : 202} flex={1} justify="space-between" align="center">
            <div className="visible flex flex-col justify-end truncate">
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
            <button className="p-3 hover:bg-[#f1f5f9] rounded-3xl cursor-pointer">
              <FcRating size={20} />
            </button>
          </Flex>
        </div>
        <div className="py-2 font-medium shadow-sm">
          <Layout style={{ height: '100vh' }}>
            {/* Lớp 1 - Top Menu */}
            <Flex justify="center" style={{ background: '#fff', borderRight: '1px solid #eee' }}>
              <Menu
                mode="inline"
                selectedKeys={[activeMenu]}
                onClick={({ key }) => setActiveMenu(key)}
                style={{ borderRight: 0 }}
                motion={{
                  motionDeadline: 0, // ← giảm timeout
                }}
              >
                {topMenus.map((item) => (
                  <Menu.Item key={item.key} style={{ paddingLeft: 12, paddingRight: 12 }}>
                    {!collapsed ? (
                      <Popover content={renderPopoverMenu(item.key)} trigger="click" placement="rightTop" style={{ padding: 0 }}>
                        <div
                          onClick={() => setActiveMenu(item.key)}
                          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                          {item.icon}
                        </div>
                      </Popover>
                    ) : (
                      item.icon
                    )}
                  </Menu.Item>
                ))}
              </Menu>
            </Flex>

            {/* Lớp 2 - Detail Menu */}
            <Sider
              width={!collapsed ? 0 : 202}
              style={{
                background: '#fff',
                overflow: 'hidden',
                transition: 'width 0.3s',
              }}
            >
              <Menu
                mode="inline"
                defaultOpenKeys={[getOpenKey()]}
                selectedKeys={[selectedKey]}
                style={{ height: '100%', borderRight: 0, paddingLeft: 0 }}
                items={detailMenus[activeMenu]}
                className="ant-menu-submenu-title-config"
                onClick={({ key }) => navigate(key)}
                motion={{
                  motionDeadline: 0, // ← giảm timeout
                }}
              />
            </Sider>
          </Layout>
        </div>
        <button
          onClick={toggleSidebar}
          className={`absolute bottom-30 right-[-16px] z-50 rounded-full shadow p-3 bg-white cursor-pointer border-1 border-[${dataColors.default}]`}
        >
          {collapsed ? <FaAnglesLeft color="black" size={15} /> : <FaAnglesRight color="black" size={15} />}
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
