import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          {/* Outlet, tıkladığımız menünün sayfasını buraya yükler */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;