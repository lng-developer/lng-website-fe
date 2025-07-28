import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  return (
    <div className="relative h-full overflow-hidden">
      <Sidebar />
      <main className="h-full overflow-x-hidden pt-16 transition-[margin] md:overflow-y-hidden md:pt-0 md:ml-64">
        <div className="h-full overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
