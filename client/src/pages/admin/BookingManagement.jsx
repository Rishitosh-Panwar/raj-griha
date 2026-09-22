import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { X, Plus, Minus } from 'lucide-react';
import api from '../../api/axios';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  'checked-in': 'bg-green-100 text-green-700',
  'checked-out': 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const statusOptions = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const [offlineModal, setOfflineModal] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [offlineCart, setOfflineCart] = useState({});

  const [billModal, setBillModal] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const { data } = await api.get('/bookings', { params });
      setBookings(data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      toast.success('Status updated');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleProcessRefund = async (bookingId) => {
    if (!confirm('Process this refund through Razorpay now?')) return;
    try {
      await api.put(`/payments/process-refund/${bookingId}`);
      toast.success('Refund processed');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    }
  };

  const openOfflineModal = async (booking) => {
    setOfflineModal(booking);
    setOfflineCart({});
    try {
      const { data } = await api.get('/menu');
      setMenuItems(data);
    } catch {
      toast.error('Failed to load menu');
    }
  };

  const changeOfflineQty = (item, delta) => {
    setOfflineCart((prev) => {
      const current = prev[item._id]?.qty || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[item._id];
      else copy[item._id] = { qty: next, item };
      return copy;
    });
  };

  const submitOfflineOrder = async () => {
    const entries = Object.values(offlineCart);
    if (entries.length === 0) return;
    try {
      await api.post('/orders/offline', {
        bookingId: offlineModal._id,
        items: entries.map((e) => ({ menuItemId: e.item._id, quantity: e.qty })),
      });
      toast.success('Offline order added to guest\'s bill');
      setOfflineModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add order');
    }
  };

  const openBillModal = async (booking) => {
    try {
      const { data } = await api.get(`/bookings/${booking._id}/bill`);
      setBillModal(data);
    } catch {
      toast.error('Failed to load bill');
    }
  };

  const confirmCheckout = async () => {
    try {
      await api.put(`/bookings/${billModal.booking._id}/checkout`);
      toast.success('Guest checked out and bill settled');
      setBillModal(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl text-primary-800">Booking Management</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="border border-primary-200 rounded-full px-4 py-2 text-sm">
          <option value="">All Statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Guest</th>
                <th className="px-6 py-3 font-medium">Room</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Check-in</th>
                <th className="px-6 py-3 font-medium">Check-out</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-t border-gray-100">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-700">{b.user?.name}</p>
                    <p className="text-xs text-gray-400">{b.user?.email}</p>
                  </td>
                  <td className="px-6 py-3">{b.room?.type} {b.room?.roomNumber}</td>
                  <td className="px-6 py-3">{b.mealPlan}</td>
                  <td className="px-6 py-3">{new Date(b.checkIn).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-3">{new Date(b.checkOut).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-3">₹{b.totalAmount}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <select value={b.status} onChange={(e) => handleStatusChange(b._id, e.target.value)}
                        className="border border-primary-200 rounded-lg px-2 py-1 text-xs">
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {b.status === 'checked-in' && (
                        <div className="flex gap-2">
                          <button onClick={() => openOfflineModal(b)} className="text-xs text-primary-600 hover:underline">
                            + Add Order
                          </button>
                          <button onClick={() => openBillModal(b)} className="text-xs text-primary-600 hover:underline">
                            Checkout & Bill
                          </button>
                        </div>
                      )}
                      {b.refundStatus === 'pending' && (
                        <div className="text-right">
                          <p className="text-xs text-red-600 font-medium">Refund due: ₹{b.refundEligibleAmount}</p>
                          <button onClick={() => handleProcessRefund(b._id)} className="text-xs text-primary-600 hover:underline">
                            Process Refund
                          </button>
                        </div>
                      )}
                      {b.refundStatus === 'processed' && (
                        <p className="text-xs text-green-600">Refunded ✓</p>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p className="text-center text-gray-400 py-8">No bookings found.</p>}
        </div>
      )}

      {/* Offline order modal */}
      <AnimatePresence>
        {offlineModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
            onClick={() => setOfflineModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="font-serif text-lg sm:text-xl text-primary-800">
                  Add Order — Room {offlineModal.room?.roomNumber}
                </h2>
                <button onClick={() => setOfflineModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
                {menuItems.map((item) => {
                  const qty = offlineCart[item._id]?.qty || 0;
                  return (
                    <div key={item._id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                      <div>
                        <p className="text-gray-700">{item.name}</p>
                        <p className="text-xs text-gray-400">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeOfflineQty(item, -1)} className="h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center">{qty}</span>
                        <button onClick={() => changeOfflineQty(item, 1)} className="h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={submitOfflineOrder}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors">
                Add to Guest's Bill
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bill / checkout modal */}
      <AnimatePresence>
        {billModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
            onClick={() => setBillModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="font-serif text-lg sm:text-xl text-primary-800">
                  Bill — Room {billModal.booking.room?.roomNumber}
                </h2>
                <button onClick={() => setBillModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room ({billModal.booking.mealPlan}, {billModal.booking.nights} nights)</span>
                  <span className="font-medium">₹{billModal.roomTotal}</span>
                </div>
                {billModal.orders.map((o) => (
                  <div key={o._id} className="border-t border-gray-50 pt-2 mt-2 first:border-t-0 first:pt-0 first:mt-0">
                    <p className="text-xs text-gray-400 mb-1">
                      {o.source === 'offline' ? 'Offline order' : 'Online order'} · {new Date(o.createdAt).toLocaleString('en-IN')}
                    </p>
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600 text-sm">
                        <span>{it.quantity} × {it.name}</span>
                        <span>₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between border-t border-gray-100 pt-2 font-medium text-primary-800">
                  <span>Grand Total</span>
                  <span>₹{billModal.grandTotal}</span>
                </div>
              </div>

              <button onClick={confirmCheckout}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors">
                Mark Paid & Check Out
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingManagement;