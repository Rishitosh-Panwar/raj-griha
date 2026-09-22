import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { playAlertSound } from '../../utils/alertSound';

const statusColors = {
  placed: 'bg-yellow-100 text-yellow-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-purple-100 text-purple-700',
  served: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusOptions = ['placed', 'preparing', 'ready', 'served', 'cancelled'];

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const knownIds = useRef(new Set());
  const firstLoad = useRef(true);

  const fetchOrders = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const { data } = await api.get('/orders', { params });

      if (!firstLoad.current) {
        const newOnes = data.filter((o) => !knownIds.current.has(o._id));
        if (newOnes.length > 0) {
          playAlertSound();
          toast.success(`${newOnes.length} new order${newOnes.length > 1 ? 's' : ''} just came in!`, { duration: 6000 });
          if (Notification?.permission === 'granted') {
            new Notification('New order at Raj Griha', { body: `${newOnes.length} new order(s) placed` });
          }
        }
      }

      knownIds.current = new Set(data.map((o) => o._id));
      setOrders(data);
      firstLoad.current = false;
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [filter]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success('Order updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update order');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl text-primary-800">Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="border border-primary-200 rounded-full px-4 py-2 text-sm">
          <option value="">All Statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o, i) => (
            <motion.div key={o._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">{o.user?.name}</p>
                  <p className="text-xs text-gray-400">
                    Room {o.booking?.room?.roomNumber} · {o.booking?.room?.type} · {o.source === 'offline' ? 'Offline order' : 'Online order'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[o.status]}`}>{o.status}</span>
                  <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    className="border border-primary-200 rounded-lg px-2 py-1 text-xs">
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1 mb-2">
                {o.items.map((it, idx) => (
                  <p key={idx}>{it.quantity} × {it.name} — ₹{it.price * it.quantity}</p>
                ))}
              </div>
              <p className="text-sm font-medium text-primary-700">Total: ₹{o.totalAmount}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;