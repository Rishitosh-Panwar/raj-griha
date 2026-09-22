import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BedDouble, CalendarCheck, ClipboardList, UtensilsCrossed, Image as ImageIcon, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Rooms', path: '/admin/rooms', icon: BedDouble },
  { name: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
  { name: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
  { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
  { name: 'Gallery', path: '/admin/gallery', icon: ImageIcon },
  { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
];

const AdminSidebar = ({ onNavigate }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-primary-900 text-primary-50 min-h-screen flex flex-col">
      <div className="px-6 py-6 border-b border-primary-700/50">
        <h1 className="font-serif text-2xl">Raj Griha</h1>
        <p className="text-xs text-primary-200/70">Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-700 text-white' : 'text-primary-100/80 hover:bg-primary-800'
              }`
            }
          >
            <link.icon size={18} />
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-primary-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-primary-100/80 hover:bg-primary-800 w-full transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;