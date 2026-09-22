import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Rooms', path: '/rooms' },
    { name: 'Menu', path: '/menu' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-primary-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20 py-4">
        <Link to="/" className="font-serif text-2xl font-semibold text-primary-700">
          Raj Griha
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
              {link.name}
            </Link>
          ))}
          {user && user.role !== 'admin' && (
            <Link to="/my-bookings" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
              My Bookings
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin/dashboard' : '/profile'}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                <User size={18} />
                {user.name.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-primary-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600">Login</Link>
              <Link to="/signup" className="bg-primary-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-primary-700 transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-3 bg-white border-t border-primary-100">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} onClick={() => setOpen(false)} className="text-gray-700 py-1">
              {link.name}
            </Link>
          ))}
          {user && user.role !== 'admin' && (
            <Link to="/my-bookings" onClick={() => setOpen(false)} className="text-gray-700 py-1">My Bookings</Link>
          )}
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin/dashboard' : '/profile'} onClick={() => setOpen(false)} className="text-gray-700 py-1">
                My Account
              </Link>
              <button onClick={handleLogout} className="text-left text-gray-500 py-1">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="text-gray-700 py-1">Login</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="text-primary-600 font-medium py-1">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;