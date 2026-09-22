import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';

const statusColors = {
  placed: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-purple-100 text-purple-700',
  served: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  placed: 'Order Placed', preparing: 'Being Prepared', ready: 'Ready to Serve', served: 'Served', cancelled: 'Cancelled',
};

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data);
    } catch {
      toast.error('Could not load your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="text-center text-gray-400 py-12">Loading...</p>;
  if (orders.length === 0) return <p className="text-gray-500 py-8">You haven't placed any food orders yet.</p>;

  return (
    <div className="space-y-4">
      {orders.map((o, i) => (
        <motion.div key={o._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="text-xs text-gray-400 flex-shrink-0">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
            <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${statusColors[o.status]}`}>
              {statusLabels[o.status]}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1 mb-3">
            {o.items.map((it, idx) => <p key={idx}>{it.quantity} × {it.name}</p>)}
          </div>
          <p className="text-sm font-medium text-primary-700">Total: ₹{o.totalAmount}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default OrdersList;