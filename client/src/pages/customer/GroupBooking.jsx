import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Minus, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const plans = [
  { key: 'EP', label: 'EP' },
  { key: 'CP', label: 'CP' },
  { key: 'MAP', label: 'MAP' },
];

const GroupBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [cart, setCart] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  const datesReady = checkIn && checkOut && new Date(checkOut) > new Date(checkIn);

  useEffect(() => {
    if (!datesReady) return;
    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const { data } = await api.get('/rooms');
        const withAvailability = await Promise.all(
          data.map(async (room) => {
            const { data: avail } = await api.get(`/rooms/${room._id}/availability`, { params: { checkIn, checkOut } });
            return { ...room, available: avail.available };
          })
        );
        setRooms(withAvailability.filter((r) => r.available));
      } catch {
        toast.error('Could not load rooms');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [checkIn, checkOut]);

  const addToCart = (room) => {
    setCart((prev) => ({
      ...prev,
      [room._id]: { room, mealPlan: 'EP', adults: 1, children: 0 },
    }));
  };

  const removeFromCart = (roomId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
  };

  const updateCartEntry = (roomId, field, value) => {
    setCart((prev) => ({ ...prev, [roomId]: { ...prev[roomId], [field]: value } }));
  };

  const cartEntries = Object.values(cart);
  const nights = datesReady ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) : 0;
  const priceForEntry = (entry) => {
    const priceByPlan = { EP: entry.room.priceEP, CP: entry.room.priceCP, MAP: entry.room.priceMAP };
    return priceByPlan[entry.mealPlan] * nights;
  };
  const grandTotal = cartEntries.reduce((sum, e) => sum + priceForEntry(e), 0);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to book');
      navigate('/login');
      return;
    }
    if (cartEntries.length < 2) {
      toast.error('Add at least 2 rooms for a group booking');
      return;
    }
    if (!user.phone && !/^\+?[0-9]{7,15}$/.test(phoneInput)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        checkIn, checkOut,
        phone: user.phone ? undefined : phoneInput,
        rooms: cartEntries.map((e) => ({
          roomId: e.room._id, mealPlan: e.mealPlan, adults: e.adults, children: e.children,
        })),
      };
      const { data } = await api.post('/bookings/group', payload);
      toast.success(`${data.bookings.length} rooms booked!`);
      navigate(`/group-confirmation/${data.groupId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Group booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 sm:py-16">
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl text-primary-800 mb-2">Group Booking</h1>
        <p className="text-gray-500 text-sm sm:text-base">Booking for a family, group, or Yatra party? Reserve multiple rooms together.</p>
      </div>

      <div className="bg-primary-50 rounded-2xl p-4 sm:p-6 grid sm:grid-cols-2 gap-4 mb-10 max-w-xl mx-auto">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Check-in</label>
          <input type="date" value={checkIn} min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Check-out</label>
          <input type="date" value={checkOut} min={checkIn || new Date().toISOString().split('T')[0]}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      {!datesReady ? (
        <p className="text-center text-gray-400">Pick your dates to see available rooms.</p>
      ) : loadingRooms ? (
        <p className="text-center text-gray-400">Checking availability...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Available rooms */}
          <div>
            <h2 className="font-serif text-lg sm:text-xl text-primary-800 mb-4">Available Rooms</h2>
            {rooms.length === 0 ? (
              <p className="text-gray-400 text-sm">No rooms available for these dates.</p>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div key={room._id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{room.type} — Room {room.roomNumber}</p>
                      <p className="text-xs text-gray-400">{room.capacity} guests · from ₹{room.priceEP}/night</p>
                    </div>
                    {cart[room._id] ? (
                      <span className="text-xs text-green-600 font-medium flex-shrink-0">Added ✓</span>
                    ) : (
                      <button onClick={() => addToCart(room)}
                        className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-full font-medium flex-shrink-0">
                        Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group cart */}
          <div>
            <h2 className="font-serif text-lg sm:text-xl text-primary-800 mb-4">Your Group ({cartEntries.length} rooms)</h2>
            {cartEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">Add rooms from the left to build your group booking.</p>
            ) : (
              <div className="space-y-4">
                {cartEntries.map((entry) => (
                  <motion.div key={entry.room._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <p className="font-medium text-gray-800 text-sm truncate">{entry.room.type} — Room {entry.room.roomNumber}</p>
                      <button onClick={() => removeFromCart(entry.room._id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {plans.map((p) => (
                        <button key={p.key} onClick={() => updateCartEntry(entry.room._id, 'mealPlan', p.key)}
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            entry.mealPlan === p.key ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700'
                          }`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1">
                        Adults
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateCartEntry(entry.room._id, 'adults', Math.max(1, entry.adults - 1))}><Minus size={12} /></button>
                          <span className="w-4 text-center">{entry.adults}</span>
                          <button onClick={() => updateCartEntry(entry.room._id, 'adults', entry.adults + 1)}><Plus size={12} /></button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1">
                        Children
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateCartEntry(entry.room._id, 'children', Math.max(0, entry.children - 1))}><Minus size={12} /></button>
                          <span className="w-4 text-center">{entry.children}</span>
                          <button onClick={() => updateCartEntry(entry.room._id, 'children', entry.children + 1)}><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-primary-700 font-medium">₹{priceForEntry(entry)} for {nights} nights</p>
                  </motion.div>
                ))}

                <div className="bg-primary-800 text-white rounded-xl p-4 flex items-center justify-between">
                  <span className="font-medium text-sm sm:text-base">Grand Total</span>
                  <span className="font-semibold text-base sm:text-lg">₹{grandTotal}</span>
                </div>

                {user && !user.phone && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Phone number (required to book)</label>
                    <input
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || cartEntries.length < 2}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-3 text-sm font-medium transition-colors disabled:opacity-40"
                >
                  {submitting ? 'Booking...' : cartEntries.length < 2 ? 'Add at least 2 rooms' : `Confirm Group Booking (${cartEntries.length} rooms)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupBooking;