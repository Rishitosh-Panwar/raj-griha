import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import usePageTitle from '../../hooks/usePageTitle';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const planMessages = {
  EP: "Hungry? Everything here is yours to order, any time — just add it to your cart. 🍽️",
  CP: "Your buffet breakfast is already on the house — everything below is for whenever else hunger strikes. 🍽️",
  MAP: "Breakfast and dinner are already taken care of for you — think of this as everything in between. 🍽️",
};

const Menu = () => {
  usePageTitle('Menu');
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeBooking, setActiveBooking] = useState(null);
  const [statusChecked, setStatusChecked] = useState(false);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await api.get('/menu', { params: { availableOnly: true } });
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const fetchActiveBooking = async () => {
      if (!user) { setStatusChecked(true); return; }
      try {
        const { data } = await api.get('/bookings/active');
        setActiveBooking(data);
      } catch (err) {
        console.error(err);
      } finally {
        setStatusChecked(true);
      }
    };
    fetchActiveBooking();
  }, [user]);

  const isCheckedIn = !!activeBooking;

  const changeQty = (item, delta) => {
    setCart((prev) => {
      const current = prev[item._id]?.qty || 0;
      const nextQty = Math.max(0, current + delta);
      const next = { ...prev };
      if (nextQty === 0) {
        delete next[item._id];
      } else {
        next[item._id] = { qty: nextQty, item };
      }
      return next;
    });
  };

  const cartEntries = Object.values(cart);
  const cartCount = cartEntries.reduce((sum, e) => sum + e.qty, 0);
  const cartTotal = cartEntries.reduce((sum, e) => sum + e.qty * e.item.price, 0);

  const handlePlaceOrderClick = () => {
    if (cartCount === 0) return;
    if (!isCheckedIn) {
      setCartOpen(false);
      toast('You\'ll be able to order once you\'ve checked in — see you soon! 🏡', { icon: '💛' });
      return;
    }
    setConfirmOpen(true);
  };

  const confirmOrder = async () => {
    setPlacing(true);
    try {
      const payload = {
        items: cartEntries.map((e) => ({ menuItemId: e.item._id, quantity: e.qty })),
      };
      await api.post('/orders', payload);
      toast.success('Order placed! It\'ll be with you shortly. 🍽️');
      setCart({});
      setConfirmOpen(false);
      setCartOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  const introMessage = isCheckedIn
    ? planMessages[activeBooking.mealPlan] || planMessages.EP
    : "A little taste of what's waiting for you at Raj Griha. 🍽️";

  const categories = ['All', ...new Set(items.map((i) => i.category))];
  const filtered = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);
  const grouped = filtered.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 sm:py-16 pb-28 sm:pb-32">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-4">
        <h1 className="font-serif text-3xl sm:text-4xl text-primary-800 mb-2">Our Menu</h1>
        {statusChecked && <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">{introMessage}</p>}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-2 my-8 sm:my-10">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              activeCategory === cat ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Loading menu...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500">Menu coming soon.</p>
      ) : (
        <div className="space-y-12 sm:space-y-16">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
                className="font-serif text-xl sm:text-2xl text-primary-800 mb-4 sm:mb-6 pb-2 border-b border-primary-100">
                {category}
              </motion.h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {categoryItems.map((item, i) => {
                  const qty = cart[item._id]?.qty || 0;
                  return (
                    <motion.div key={item._id} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
                      variants={fadeUp} transition={{ delay: (i % 3) * 0.05 }}
                      className="flex items-center gap-3 sm:gap-4 bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition-shadow">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-primary-50 overflow-hidden flex-shrink-0">
                        {item.image?.url ? (
                          <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-200 text-xs">No photo</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{item.name}</p>
                        <p className="text-primary-600 font-medium text-sm">₹{item.price}</p>
                      </div>
                      {qty === 0 ? (
                        <button onClick={() => changeQty(item, 1)}
                          className="text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-full transition-colors flex-shrink-0">
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => changeQty(item, -1)} className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{qty}</span>
                          <button onClick={() => changeQty(item, 1)} className="h-7 w-7 rounded-full bg-primary-600 text-white flex items-center justify-center">
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating cart button */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg flex items-center gap-2 z-40"
          >
            <ShoppingCart size={18} />
            <span className="text-xs sm:text-sm font-medium">{cartCount} item{cartCount > 1 ? 's' : ''} · ₹{cartTotal}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setCartOpen(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg sm:text-xl text-primary-800">Your Order</h2>
                <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              {cartEntries.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">Your cart is empty.</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {cartEntries.map(({ item, qty }) => (
                    <div key={item._id} className="flex items-center justify-between text-sm gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700 truncate">{item.name}</p>
                        <p className="text-gray-400">₹{item.price} × {qty}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => changeQty(item, -1)} className="h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center">{qty}</span>
                        <button onClick={() => changeQty(item, 1)} className="h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between font-medium text-primary-800 border-t border-gray-100 pt-4 mb-4">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>

              <button
                onClick={handlePlaceOrderClick}
                disabled={cartEntries.length === 0}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
              >
                Place Order
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setConfirmOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm"
            >
              <h3 className="font-serif text-lg sm:text-xl text-primary-800 mb-3">Confirm your order?</h3>
              <div className="space-y-1 mb-4 text-sm text-gray-600">
                {cartEntries.map(({ item, qty }) => (
                  <p key={item._id}>{qty} × {item.name}</p>
                ))}
              </div>
              <p className="font-medium text-primary-800 mb-6">Total: ₹{cartTotal}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-full py-2 text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={confirmOrder} disabled={placing}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2 text-sm font-medium disabled:opacity-50">
                  {placing ? 'Placing...' : 'Confirm Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Menu;