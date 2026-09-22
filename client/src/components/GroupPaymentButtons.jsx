import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const GroupPaymentButtons = ({ groupId, bookings, advancePercentage, onPaid }) => {
  const { user } = useAuth();
  const [paying, setPaying] = useState(null);

  const groupTotal = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const groupPaid = bookings.reduce((sum, b) => sum + b.amountPaid, 0);
  const remaining = groupTotal - groupPaid;
  const advanceAmount = Math.round(groupTotal * advancePercentage / 100);
  const canPay = bookings.some((b) => ['pending', 'confirmed'].includes(b.status)) && remaining > 0;

  if (!canPay) return null;

  const handlePay = async (type) => {
    setPaying(type);
    try {
      const { data: order } = await api.post('/payments/create-group-order', { groupId, type });

      const options = {
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: 'Raj Griha',
        description: `${type === 'full' ? 'Full payment' : 'Advance payment'} — ${bookings.length} room group booking`,
        order_id: order.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || '',
        },
        theme: { color: '#9c6023' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify-group', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              groupId,
              amount: order.amount,
              type,
            });
            toast.success('Payment successful — all rooms confirmed!');
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
    <div className="bg-white border border-primary-200 rounded-2xl p-4 sm:p-6 mb-6">
      <p className="text-sm font-medium text-primary-800 mb-4">
        {groupPaid > 0 ? 'Complete your group payment' : 'Confirm all rooms now with one payment'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handlePay('advance')}
          disabled={paying !== null || advanceAmount - groupPaid <= 0}
          className="flex-1 border-2 border-primary-600 text-primary-700 hover:bg-primary-50 rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
        >
          {paying === 'advance' ? 'Processing...' : `Pay Advance (₹${Math.max(advanceAmount - groupPaid, 0)})`}
        </button>
        <button
          onClick={() => handlePay('full')}
          disabled={paying !== null}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {paying === 'full' ? 'Processing...' : `Pay Full (₹${remaining})`}
        </button>
      </div>
    </div>
  );
};

export default GroupPaymentButtons;