import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, Check, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const plans = [
  { key: 'EP', label: 'EP', desc: 'Room Only' },
  { key: 'CP', label: 'CP', desc: 'Room + Breakfast' },
  { key: 'MAP', label: 'MAP', desc: 'Room + Breakfast + Dinner' },
];

const RoomTypeDetails = () => {
  const { type } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const passedState = location.state || {};

  const [sampleRoom, setSampleRoom] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [mealPlan, setMealPlan] = useState(passedState.mealPlan || 'EP');
  const [checkIn, setCheckIn] = useState(passedState.checkIn || '');
  const [checkOut, setCheckOut] = useState(passedState.checkOut || '');
  const [adults, setAdults] = useState(passedState.adults || 1);
  const [children, setChildren] = useState(passedState.children || 0);
  const [availableCount, setAvailableCount] = useState(null);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    const fetchSample = async () => {
      try {
        const { data } = await api.get('/rooms', { params: { type } });
        if (data.length > 0) setSampleRoom(data[0]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSample();
  }, [type]);

  useEffect(() => {
    if (checkIn && checkOut) checkAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Select check-in and check-out dates');
      return;
    }
    setChecking(true);
    try {
      const { data } = await api.get('/rooms/search', {
        params: { checkIn, checkOut, type, mealPlan, capacity: adults + children },
      });
      const group = data.find((g) => g.type === type);
      setAvailableCount(group ? group.availableCount : 0);
      if (!group || group.availableCount === 0) {
        toast.error(`No ${type} rooms available for ${adults + children} guests on these dates`);
      }
    } catch {
      toast.error('Could not check availability');
    } finally {
      setChecking(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please log in to book a room');
      navigate('/login');
      return;
    }
    if (!availableCount || availableCount < 1) {
      toast.error('Please check availability first');
      return;
    }
    if (!user.phone && !/^\+?[0-9]{7,15}$/.test(phoneInput)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setBooking(true);
    try {
      const { data } = await api.post('/bookings', {
        type, checkIn, checkOut, adults, children, mealPlan,
        phone: user.phone ? undefined : phoneInput,
      });
      toast.success('Booking created!');
      navigate(`/booking-confirmation/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
      setAvailableCount(null);
    } finally {
      setBooking(false);
    }
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setSendingInquiry(true);
    try {
      await api.post('/inquiries/room', { ...inquiryForm, roomType: type });
      toast.success('Thanks! We\'ll get back to you shortly.');
      setInquiryOpen(false);
      setInquiryForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your message');
    } finally {
      setSendingInquiry(false);
    }
  };

  if (!sampleRoom) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;

  const priceByPlan = { EP: sampleRoom.priceEP, CP: sampleRoom.priceCP, MAP: sampleRoom.priceMAP };
  const totalGuests = Number(adults) + Number(children);
  const isFullOccupancy = totalGuests >= sampleRoom.capacity;
  const extraCharge = isFullOccupancy ? (sampleRoom.extraGuestCharge || 0) : 0;
  const currentPrice = priceByPlan[mealPlan] + extraCharge;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 sm:py-16 grid md:grid-cols-2 gap-8 md:gap-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="h-64 sm:h-96 rounded-2xl overflow-hidden bg-primary-100 mb-4">
          {sampleRoom.images?.[activeImage] ? (
            <img src={sampleRoom.images[activeImage].url} alt={type} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-300">No image</div>
          )}
        </div>
        {sampleRoom.images?.length > 1 && (
          <div className="flex gap-3">
            {sampleRoom.images.map((img, i) => (
              <button key={img._id} onClick={() => setActiveImage(i)}
                className={`h-20 w-20 rounded-lg overflow-hidden border-2 transition-colors ${activeImage === i ? 'border-primary-600' : 'border-transparent'}`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <h1 className="font-serif text-3xl text-primary-800 mb-2">{type} Room</h1>

        <div className="flex items-center gap-2 text-gray-500 mb-4">
          <Users size={18} /> Up to {sampleRoom.capacity} guests
        </div>

        {sampleRoom.description && <p className="text-gray-600 mb-6 leading-relaxed">{sampleRoom.description}</p>}

        {sampleRoom.amenities?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {sampleRoom.amenities.map((a) => (
              <div key={a} className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={16} className="text-primary-600" /> {a}
              </div>
            ))}
          </div>
        )}

        <p className="text-sm font-medium text-gray-700 mb-2">Choose your plan</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          {plans.map((p) => (
            <button key={p.key} onClick={() => { setMealPlan(p.key); setAvailableCount(null); }}
              className={`text-left rounded-xl p-2 sm:p-3 border-2 transition-colors ${
                mealPlan === p.key ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-200'
              }`}>
              <p className="font-semibold text-primary-800 text-sm">{p.label}</p>
              <p className="text-xs text-gray-500 mb-1">{p.desc}</p>
              <p className="text-primary-600 font-medium text-sm">
                ₹{priceByPlan[p.key]}{sampleRoom.extraGuestCharge > 0 && <span className="text-xs">*</span>}
              </p>
            </button>
          ))}
        </div>
        {sampleRoom.extraGuestCharge > 0 && (
          <p className="text-xs text-gray-400 -mt-4 mb-6">
            *Discounted rate for up to {sampleRoom.capacity - 1} guests. Full occupancy ({sampleRoom.capacity} guests)
            rate: ₹{priceByPlan[mealPlan] + sampleRoom.extraGuestCharge}/night. See our <a href="/terms" className="underline">Terms & Conditions</a>.
          </p>
        )}

        <div className="bg-primary-50 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Check-in</label>
              <input type="date" value={checkIn} min={new Date().toISOString().split('T')[0]}
                onChange={(e) => { setCheckIn(e.target.value); setAvailableCount(null); }}
                className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Check-out</label>
              <input type="date" value={checkOut} min={checkIn || new Date().toISOString().split('T')[0]}
                onChange={(e) => { setCheckOut(e.target.value); setAvailableCount(null); }}
                className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Adults</label>
              <input type="number" min={1} value={adults}
                onChange={(e) => { setAdults(Number(e.target.value)); setAvailableCount(null); }}
                className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Children</label>
              <input type="number" min={0} value={children}
                onChange={(e) => { setChildren(Number(e.target.value)); setAvailableCount(null); }}
                className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {!isFullOccupancy && sampleRoom.extraGuestCharge > 0 && (
            <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
              You're getting the discounted rate for {totalGuests} guest{totalGuests > 1 ? 's' : ''} — saving ₹{sampleRoom.extraGuestCharge}/night compared to full occupancy.
            </p>
          )}
          {isFullOccupancy && sampleRoom.extraGuestCharge > 0 && (
            <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              This is the full-occupancy rate for {sampleRoom.capacity} guests.
            </p>
          )}

          {nights > 0 && (
            <p className="text-sm text-gray-600">
              {nights} night{nights > 1 ? 's' : ''} × ₹{currentPrice} ({mealPlan}{isFullOccupancy && extraCharge > 0 ? ', full occupancy' : ''}) = <span className="font-medium text-primary-700">₹{nights * currentPrice}</span>
            </p>
          )}

          {availableCount !== null && (
            availableCount > 0 ? (
              <p className="text-sm text-green-600 font-medium">✓ {availableCount} room(s) available for these dates</p>
            ) : (
              <p className="text-sm text-red-500 font-medium">No rooms available for these dates</p>
            )
          )}

          {user && !user.phone && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone number (required to book)</label>
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={checkAvailability} disabled={checking}
              className="flex-1 border border-primary-600 text-primary-600 hover:bg-primary-100 rounded-full py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {checking ? 'Checking...' : 'Check Availability'}
            </button>
            <button onClick={handleBooking} disabled={booking}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {booking ? 'Booking...' : 'Book Now'}
            </button>
          </div>

          <button onClick={() => setInquiryOpen(true)}
            className="w-full text-center border-2 border-primary-300 text-primary-700 bg-white hover:bg-primary-50 rounded-full py-2 text-sm font-medium transition-colors">
            Get in Touch
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {inquiryOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setInquiryOpen(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()} className="bg-white h-full w-full sm:w-[420px] p-5 sm:p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-primary-800">Get in Touch</h2>
                <button onClick={() => setInquiryOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
              </div>
              <p className="text-sm text-gray-500 mb-6">Have a question about this room? Send us a message and we'll get back to you.</p>
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                  <input required value={inquiryForm.name} onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                  <input type="email" required value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone *</label>
                  <input required value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Room</label>
                  <input disabled value={`${type} Room`} className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Message (optional)</label>
                  <textarea rows={4} value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <button type="submit" disabled={sendingInquiry}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                  {sendingInquiry ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomTypeDetails;