import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'checked-in': 'bg-green-100 text-green-700',
  'checked-out': 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/my');
      setBookings(data);
    } catch {
      toast.error('Could not load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking? This follows our Cancellation & Refund Policy.')) return;
    try {
      const { data } = await api.put(`/bookings/${id}/cancel`);
      if (data.refundStatus === 'pending') {
        toast.success(`Cancelled. ₹${data.refundEligibleAmount} refund + ₹${data.creditAmount} credit due.`, { duration: 6000 });
      } else {
        toast.success('Booking cancelled');
      }
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    }
  };

  if (loading) return <p className="text-center text-gray-400 py-12">Loading...</p>;

  const standalone = bookings.filter((b) => !b.groupId);
  const groupsMap = bookings.reduce((acc, b) => {
    if (!b.groupId) return acc;
    acc[b.groupId] = acc[b.groupId] || [];
    acc[b.groupId].push(b);
    return acc;
  }, {});
  const groups = Object.entries(groupsMap);

  const canPay = (b) => ['pending', 'confirmed'].includes(b.status) && (b.totalAmount - b.amountPaid) > 0;

  const RoomLine = ({ b, compact }) => (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${compact ? 'py-3 border-t border-gray-100' : ''}`}>
      <div className="flex gap-3 sm:gap-4 items-center min-w-0">
        {!compact && (
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-primary-100 overflow-hidden flex-shrink-0">
            {b.room?.images?.[0] ? <img src={b.room.images[0].url} alt="" className="w-full h-full object-cover" /> : null}
          </div>
        )}
        <div className="min-w-0">
          <p className={`font-medium text-primary-800 ${compact ? 'text-sm' : ''} truncate`}>
            {b.room?.type} — Room {b.room?.roomNumber}
          </p>
          {!compact && (
            <p className="text-sm text-gray-500">
              {new Date(b.checkIn).toDateString()} → {new Date(b.checkOut).toDateString()}
            </p>
          )}
          <p className="text-sm text-gray-500">
            ₹{b.totalAmount} · {b.nights} nights · {b.mealPlan}
            {b.amountPaid > 0 && <span className="text-green-600"> · ₹{b.amountPaid} paid</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[b.status]}`}>{b.status}</span>
        {['pending', 'confirmed'].includes(b.status) && (
          <button onClick={() => handleCancel(b._id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
        )}
      </div>
    </div>
  );

  if (bookings.length === 0) return <p className="text-gray-500 py-8">You haven't made any bookings yet.</p>;

  return (
    <div className="space-y-4">
      {groups.map(([groupId, groupBookings], i) => {
        const groupTotal = groupBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const anyPayable = groupBookings.some(canPay);
        return (
          <motion.div key={groupId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full inline-block">
                Group Booking · {groupBookings.length} rooms
              </p>
              <p className="text-sm font-medium text-primary-800">₹{groupTotal} total</p>
            </div>
            <div>{groupBookings.map((b) => <RoomLine key={b._id} b={b} compact />)}</div>
            {anyPayable && (
              <Link to={`/group-confirmation/${groupId}`}
                className="inline-block mt-3 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full transition-colors">
                Complete Payment →
              </Link>
            )}
          </motion.div>
        );
      })}

      {standalone.map((b, i) => (
        <motion.div key={b._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (groups.length + i) * 0.05 }}
          className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <RoomLine b={b} />
          {canPay(b) && (
            <Link to={`/booking-confirmation/${b._id}`}
              className="inline-block mt-3 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full transition-colors">
              Complete Payment →
            </Link>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default BookingsList;