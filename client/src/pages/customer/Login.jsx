import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import GoogleButton from '../../components/GoogleButton';
import usePageTitle from '../../hooks/usePageTitle';

const Login = () => {
  usePageTitle('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const user = await login(email, password);
    toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
    navigate(user.role === 'admin' ? '/admin/dashboard' : '/');
  } catch (err) {
    if (err.response?.data?.needsVerification) {
      toast.error('Please verify your email first');
      navigate('/verify-otp', { state: { email: err.response.data.email } });
    } else {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8"
      >
        <h1 className="font-serif text-3xl text-primary-800 mb-1 text-center">Welcome Back</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Log in to manage your bookings</p>

        <GoogleButton />
<div className="flex items-center gap-3 my-6">
  <div className="h-px bg-gray-200 flex-1" />
  <span className="text-xs text-gray-400">or</span>
  <div className="h-px bg-gray-200 flex-1" />
</div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-primary-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-primary-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-600 font-medium hover:text-primary-800">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;