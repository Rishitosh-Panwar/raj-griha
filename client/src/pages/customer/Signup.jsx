import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import GoogleButton from '../../components/GoogleButton';
import usePageTitle from '../../hooks/usePageTitle';

const Signup = () => {
  usePageTitle('Sign Up');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { email } = await signup(form);
      toast.success('Check your email for a verification code');
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <h1 className="font-serif text-3xl text-primary-800 mb-1 text-center">Create Account</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Join Raj Griha to book your stay</p>

        <GoogleButton />
        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone (optional)</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500" />
            <p className="text-xs text-gray-400 mt-1">At least 8 characters, including one number</p>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:text-primary-800">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;