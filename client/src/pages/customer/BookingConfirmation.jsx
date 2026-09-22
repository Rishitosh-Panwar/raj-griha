import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import PaymentButtons from '../../components/PaymentButtons';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [advancePercentage, setAdvancePercentage] = useState(30);

  const fetchBooking = async () => {
    const { data } = await api.get(`/bookings/${id}`);
    setBooking(data);
  };

  useEffect(() => {
    fetchBooking();
    api.get('/settings').then(({ data }) => setAdvancePercentage(data.advancePercentage)).catch(() => {});
  }, [id]);

  if (!booking) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto px-6 py-12 sm:py-24 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
        <h1 className="font-serif text-3xl text-primary-800 mb-2">
          {booking.status === 'confirmed' ? 'Booking Confirmed' : 'Booking Created'}
        </h1>
        <p className="text-gray-500 mb-8">
          {booking.status === 'confirmed'
            ? 'Your payment has been received. We look forward to hosting you at Raj Griha.'
            : "We'll be in touch to confirm your stay, or pay now to confirm it instantly."}
        </p>

        <div className="bg-primary-50 rounded-2xl p-4 sm:p-6 text-left space-y-2 mb-6">
          <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Room:</span> {booking.room.type} — {booking.room.roomNumber}</p>
          <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Plan:</span> {booking.mealPlan}</p>
          <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Check-in:</span> {new Date(booking.checkIn).toDateString()}</p>
          <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Check-out:</span> {new Date(booking.checkOut).toDateString()}</p>
          <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Guests:</span> {booking.guests.adults} Adults, {booking.guests.children} Children</p>
          <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Total:</span> ₹{booking.totalAmount}</p>
          {booking.amountPaid > 0 && (
            <p className="text-sm text-green-700"><span className="font-medium">Paid so far:</span> ₹{booking.amountPaid}</p>
          )}
          <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Status:</span> {booking.status}</p>
        </div>

        <PaymentButtons booking={booking} advancePercentage={advancePercentage} onPaid={fetchBooking} />

        <Link to="/my-bookings" className="text-primary-600 font-medium hover:text-primary-800">
          View My Bookings →
        </Link>
      </motion.div>
    </div>
  );
};

export default BookingConfirmation;