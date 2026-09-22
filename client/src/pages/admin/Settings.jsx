import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const Settings = () => {
  const [advancePercentage, setAdvancePercentage] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setAdvancePercentage(data.advancePercentage);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', { advancePercentage });
      toast.success('Settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <h1 className="font-serif text-3xl text-primary-800 mb-8">Settings</h1>

      <motion.form
        onSubmit={handleSave}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-sm p-6 max-w-md space-y-4"
      >
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Advance Payment Percentage</label>
          <p className="text-xs text-gray-400 mb-2">
            When a guest chooses "Pay Advance", this percentage of the total booking amount is charged.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={100} required
              value={advancePercentage}
              onChange={(e) => setAdvancePercentage(e.target.value)}
              className="w-24 border border-primary-200 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-500 text-sm">%</span>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </motion.form>
    </div>
  );
};

export default Settings;