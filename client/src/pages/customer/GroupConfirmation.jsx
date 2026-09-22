import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import GroupPaymentButtons from '../../components/GroupPaymentButtons';

const GroupConfirmation = () => {
  const { groupId } = useParams();
  const [bookings, setBookings] = useState(null);
  const [advancePercentage, setAdvancePercentage] = useState(30);

  const fetchGroup = async () => {
    const { data } = await api.get(`/bookings/group/${groupId}`);
    setBookings(data);
  };

  useEffect(() => {
    fetchGroup();
    api.get('/settings').then(({ data }) => setAdvancePercentage(data.advancePercentage)).catch(() => {});
  }, [groupId]);

  if (!bookings) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  const grandTotal = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalPaid = bookings.reduce((sum, b) => sum + b.amountPaid, 0);
  const allConfirmed = bookings.every((b) => b.status === 'confirmed');

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 sm:py-24 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
        <h1 className="font-serif text-3xl text-primary-800 mb-2">
          {allConfirmed ? 'Group Booking Confirmed' : 'Group Booking Created'}
        </h1>
        <p className="text-gray-500 mb-8">
          {bookings.length} rooms booked. {allConfirmed
            ? 'Payment received — all rooms are confirmed. We look forward to hosting your group.'
            : "We'll be in touch to confirm your stay, or pay now below to confirm every room at once."}
        </p>

        <div className="space-y-3 mb-6 text-left">
          {bookings.map((b) => (
            <div key={b._id} className="bg-primary-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-800">{b.room.type} — Room {b.room.roomNumber}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white text-primary-700 font-medium capitalize">{b.status}</span>
              </div>
              <p className="text-xs text-gray-500">
                {b.mealPlan} · {b.guests.adults} Adults, {b.guests.children} Children · ₹{b.totalAmount}
                {b.amountPaid > 0 && <span className="text-green-700"> · ₹{b.amountPaid} paid</span>}
              </p>
            </div>
          ))}
        </div>

        <p className="font-medium text-primary-800 mb-1">Grand Total: ₹{grandTotal}</p>
        {totalPaid > 0 && <p className="text-sm text-green-700 mb-6">Paid so far: ₹{totalPaid}</p>}

        <GroupPaymentButtons groupId={groupId} bookings={bookings} advancePercentage={advancePercentage} onPaid={fetchGroup} />

        <Link to="/my-bookings" className="text-primary-600 font-medium hover:text-primary-800">
          View My Bookings →
        </Link>
      </motion.div>
    </div>
  );
};

export default GroupConfirmation;