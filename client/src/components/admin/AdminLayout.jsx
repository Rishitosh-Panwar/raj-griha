import { useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-primary-900 text-white flex items-center px-4 z-40">
        <button onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
        <span className="font-serif ml-3">Raj Griha Admin</span>
      </div>

      {/* Sidebar: static on desktop, slide-over on mobile */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <AdminSidebar onNavigate={() => setOpen(false)} />
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <main className="flex-1 bg-gray-50 min-h-screen p-6 md:p-8 pt-20 md:pt-8">{children}</main>
    </div>
  );
};

export default AdminLayout;