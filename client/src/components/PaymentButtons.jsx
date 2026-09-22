import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PaymentButtons = ({ booking, advancePercentage, onPaid, compact }) => {
  const { user } = useAuth();
  const [paying, setPaying] = useState(null);

  const remaining = booking.totalAmount - booking.amountPaid;
  const advanceAmount = Math.round(booking.totalAmount * advancePercentage / 100);
  const canPay = ['pending', 'confirmed'].includes(booking.status) && remaining > 0;

  if (!canPay) return null;

  const handlePay = async (type) => {
    setPaying(type);
    try {
      const { data: order } = await api.post('/payments/create-order', { bookingId: booking._id, type });

      const options = {
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: 'Raj Griha',
        description: `${type === 'full' ? 'Full payment' : 'Advance payment'} — ${booking.room?.type} Room ${booking.room?.roomNumber}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || '',
        },
        theme: { color: '#9c6023' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
              amount: order.amount,
              type,
            });
            toast.success('Payment successful — booking confirmed!');
            onPaid?.();
          } catch {
            toast.error('Payment succeeded but verification failed — contact us to confirm.');
          } finally {
            setPaying(null);
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment');
      setPaying(null);
    }
  };

  return (
    <div className={compact ? 'flex flex-col sm:flex-row gap-2 mt-3' : 'bg-white border border-primary-200 rounded-2xl p-4 sm:p-6 mb-6'}>
      {!compact && (
        <p className="text-sm font-medium text-primary-800 mb-4">
          {booking.amountPaid > 0 ? 'Complete your payment' : 'Confirm this room now with payment'}
        </p>
      )}
      <div className={compact ? 'flex gap-2 w-full' : 'flex flex-col sm:flex-row gap-3'}>
        <button
          onClick={() => handlePay('advance')}
          disabled={paying !== null || advanceAmount - booking.amountPaid <= 0}
          className={`flex-1 border-2 border-primary-600 text-primary-700 hover:bg-primary-50 rounded-full font-medium transition-colors disabled:opacity-40 ${compact ? 'text-xs py-1.5' : 'py-2.5 text-sm'}`}
        >
          {paying === 'advance' ? 'Processing...' : `Pay Advance (₹${Math.max(advanceAmount - booking.amountPaid, 0)})`}
        </button>
        <button
          onClick={() => handlePay('full')}
          disabled={paying !== null}
          className={`flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-medium transition-colors disabled:opacity-50 ${compact ? 'text-xs py-1.5' : 'py-2.5 text-sm'}`}
        >
          {paying === 'full' ? 'Processing...' : `Pay Full (₹${remaining})`}
        </button>
      </div>
    </div>
  );
};

export default PaymentButtons;