import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';

const ForgotPassword = () => {
  usePageTitle('Reset Password');
  const navigate = useNavigate();

  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If that email is registered, a code is on its way');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send code');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset — please log in');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
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
        <h1 className="font-serif text-3xl text-primary-800 mb-1 text-center">Reset Password</h1>

        {step === 'email' ? (
          <>
            <p className="text-gray-500 text-sm text-center mb-8">
              Enter your account email and we'll send you a 6-digit code.
            </p>
            <form onSubmit={requestCode} className="space-y-4">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-sm text-center mb-8">
              Enter the code sent to <span className="font-medium">{email}</span> and choose a new password.
            </p>
            <form onSubmit={resetPassword} className="space-y-4">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                className="w-full text-center text-2xl tracking-[0.5em] border border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full border border-primary-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">At least 8 characters, including one number</p>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <div className="flex items-center justify-between mt-4 text-xs">
              <button onClick={requestCode} disabled={loading} className="text-primary-600 hover:text-primary-800">
                Resend code
              </button>
              <button onClick={() => { setStep('email'); setOtp(''); }} className="text-gray-500 hover:text-gray-700">
                Use a different email
              </button>
            </div>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:text-primary-800">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;