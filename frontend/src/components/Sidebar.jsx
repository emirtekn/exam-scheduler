import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarPlus, BookOpen, Building, Users, UserX, Clock } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', name: 'Sınav Programı', icon: LayoutDashboard },
    { path: '/sinav-atama', name: 'Sınav Planlama', icon: CalendarPlus },
    { path: '/ders-yonetimi', name: 'Ders Yönetimi', icon: BookOpen },
    { path: '/derslik-yonetimi', name: 'Derslik Yönetimi', icon: Building },
    { path: '/personel-yonetimi', name: 'Personel Yönetimi', icon: Users },
    { path: '/mazeret-yonetimi', name: 'Mazeret Yönetimi', icon: UserX },
    { path: '/oturum-yonetimi', name: 'oturum-yonetimi', icon: Clock },
  ];

  return (
    <aside className="w-64 bg-white border-r shadow-sm flex flex-col h-full">
      <div className="h-16 flex items-center justify-center border-b border-blue-100">
        <span className="text-xl font-extrabold text-blue-600 tracking-wide">FAKÜLTE YBS</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-inner border-l-4 border-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;