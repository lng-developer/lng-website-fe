import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useState } from 'react';

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(true);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };
  return (
    <div className="relative h-full overflow-hidden">
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <main
        className={`h-full overflow-x-hidden pt-16 transition-[margin] md:overflow-y-hidden md:pt-0 ${
          collapsed ? 'md:ml-64' : 'md:ml-20'
        } `}
      >
        <div className="h-full overflow-auto">
          <Outlet context={{ collapsed }} />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
