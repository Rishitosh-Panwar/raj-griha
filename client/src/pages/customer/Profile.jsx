import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Check, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import BookingsList from '../../components/BookingsList';
import OrdersList from '../../components/OrdersList';

const tabs = ['Profile', 'Bookings', 'Orders'];

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [emailStep, setEmailStep] = useState('idle'); // 'idle' | 'entering' | 'verifying'
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', { name, phone });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setEmailBusy(true);
    try {
      await api.post('/auth/change-email/request', { newEmail });
      toast.success('Verification code sent to your new email');
      setEmailStep('verifying');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send code');
    } finally {
      setEmailBusy(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setEmailBusy(true);
    try {
      await api.post('/auth/change-email/verify', { otp: emailOtp });
      await refreshUser();
      toast.success('Email updated');
      setEmailStep('idle');
      setNewEmail('');
      setEmailOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setEmailBusy(false);
    }
  };

  if (!user) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 sm:py-16">
      <h1 className="font-serif text-3xl text-primary-800 mb-2">My Account</h1>
      <p className="text-gray-500 mb-8">Welcome back, {user.name.split(' ')[0]}</p>

      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Profile' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User size={14} /> Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone size={14} /> Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210"
                className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={savingProfile}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Mail size={14} /> Email</label>

            {emailStep === 'idle' && (
              <div className="flex items-center justify-between gap-3 mt-1">
                <p className="text-sm text-gray-700">{user.email}</p>
                <button onClick={() => setEmailStep('entering')} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex-shrink-0">
                  Change Email
                </button>
              </div>
            )}

            {emailStep === 'entering' && (
              <form onSubmit={handleRequestEmailChange} className="mt-2 space-y-3">
                <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button type="submit" disabled={emailBusy}
                    className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-4 py-2 text-xs font-medium disabled:opacity-50">
                    {emailBusy ? 'Sending...' : 'Send Verification Code'}
                  </button>
                  <button type="button" onClick={() => setEmailStep('idle')}
                    className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
                </div>
              </form>
            )}

            {emailStep === 'verifying' && (
              <form onSubmit={handleVerifyEmailChange} className="mt-2 space-y-3">
                <p className="text-xs text-gray-500">Enter the code sent to <span className="font-medium">{newEmail}</span></p>
                <input value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-40 text-center text-lg tracking-[0.4em] border border-primary-200 rounded-lg px-3 py-2" />
                <div className="flex gap-2">
                  <button type="submit" disabled={emailBusy || emailOtp.length !== 6}
                    className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-4 py-2 text-xs font-medium disabled:opacity-50 flex items-center gap-1">
                    <Check size={14} /> {emailBusy ? 'Verifying...' : 'Confirm'}
                  </button>
                  <button type="button" onClick={() => { setEmailStep('idle'); setEmailOtp(''); }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-4 py-2 flex items-center gap-1">
                    <X size={14} /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'Bookings' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <BookingsList />
        </motion.div>
      )}

      {activeTab === 'Orders' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <OrdersList />
        </motion.div>
      )}
    </div>
  );
};

export default Profile;