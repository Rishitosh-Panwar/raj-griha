import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, IndianRupee, CalendarCheck, Users } from 'lucide-react';
import api from '../../api/axios';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'checked-in': 'bg-green-100 text-green-700',
  'checked-out': 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="text-gray-400">Loading dashboard...</div>;

  const cards = [
    { label: 'Occupancy', value: `${stats.occupancyRate}%`, icon: BedDouble },
    { label: 'Revenue (Paid)', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee },
    { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarCheck },
    { label: 'Customers', value: stats.totalCustomers, icon: Users },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-primary-800 mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="bg-white rounded-2xl shadow-sm p-5"
          >
            <c.icon className="text-primary-600 mb-2" size={22} />
            <p className="text-2xl font-semibold text-primary-800">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <h2 className="font-medium text-primary-800 mb-4">Recent Bookings</h2>
        <div className="space-y-3">
          {stats.recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400">No bookings yet.</p>
          ) : (
            stats.recentBookings.map((b) => (
              <div key={b._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <span className="font-medium text-gray-700">{b.user?.name}</span>
                  <span className="text-gray-400"> · {b.room?.type} {b.room?.roomNumber}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-gray-500">{new Date(b.checkIn).toLocaleDateString('en-IN')}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.status]}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;