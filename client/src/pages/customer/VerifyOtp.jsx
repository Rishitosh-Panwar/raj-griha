import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 mb-4">No signup in progress.</p>
        <Link to="/signup" className="text-primary-600 font-medium">Go to Sign Up →</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await verifyOtp(email, otp);
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      toast.success('A new code has been sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 text-center">
        <h1 className="font-serif text-2xl text-primary-800 mb-2">Verify Your Email</h1>
        <p className="text-gray-500 text-sm mb-6">Enter the 6-digit code sent to <span className="font-medium">{email}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-[0.5em] border border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
          />
          <button type="submit" disabled={loading || otp.length !== 6}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <button onClick={handleResend} disabled={resending} className="text-xs text-primary-600 hover:text-primary-800 mt-4">
          {resending ? 'Sending...' : "Didn't get a code? Resend"}
        </button>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;