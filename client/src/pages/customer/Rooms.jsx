import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const Rooms = () => {
  usePageTitle('Rooms');
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [filters, setFilters] = useState({ type: [], capacity: '', maxPrice: '', mealPlan: 'EP' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const datesReady = checkIn && checkOut && new Date(checkOut) > new Date(checkIn);

  const toggleType = (t) => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type.includes(t) ? prev.type.filter((x) => x !== t) : [...prev.type, t],
    }));
  };

  const runSearch = async () => {
    if (!datesReady) {
      toast.error('Please select valid check-in and check-out dates');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      // search endpoint takes one `type`, so if multiple are selected we call it per type and merge
      const typesToQuery = filters.type.length > 0 ? filters.type : [null];
      const allResults = await Promise.all(
        typesToQuery.map((t) => {
          const params = { checkIn, checkOut, mealPlan: filters.mealPlan };
          if (t) params.type = t;
          if (filters.capacity) params.capacity = filters.capacity;
          if (filters.maxPrice) params.maxPrice = filters.maxPrice;
          return api.get('/rooms/search', { params }).then((r) => r.data);
        })
      );
      setResults(allResults.flat());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const goToType = (group) => {
    navigate(`/rooms/type/${group.type}`, {
      state: { checkIn, checkOut, mealPlan: filters.mealPlan, adults: 1, children: 0 },
    });
  };

  const roomTypes = ['Standard', 'Deluxe', 'Premium'];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 sm:py-16">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-10">
        <h1 className="font-serif text-4xl text-primary-800 mb-2">Find Your Room</h1>
        <p className="text-gray-500">Tell us your dates and preferences — we'll show you what's available.</p>
      </motion.div>

      <div className="flex justify-center mb-8">
  <Link
    to="/group-booking"
    className="inline-flex items-center gap-2 bg-white border-2 border-primary-300 hover:bg-primary-50 text-primary-700 px-6 py-3 rounded-full text-sm font-medium shadow-sm transition-colors"
  >
    Booking for a group? Reserve multiple rooms together →
  </Link>
</div>

      {/* Search panel */}
      <div className="bg-primary-50 rounded-2xl p-4 sm:p-6 mb-12 max-w-3xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Check-in</label>
            <input type="date" value={checkIn} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setCheckIn(e.target.value); setSearched(false); }}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Check-out</label>
            <input type="date" value={checkOut} min={checkIn || new Date().toISOString().split('T')[0]}
              onChange={(e) => { setCheckOut(e.target.value); setSearched(false); }}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Room type (choose any)</p>
          <div className="flex flex-wrap gap-2">
            {roomTypes.map((t) => (
              <button key={t} onClick={() => toggleType(t)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filters.type.includes(t) ? 'bg-primary-600 text-white' : 'bg-white text-primary-700 border border-primary-200'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Guests (min. capacity)</label>
            <select value={filters.capacity} onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Any</option>
              <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Max price / night</label>
            <select value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Any</option>
              <option value="2000">Under ₹2,000</option><option value="4000">Under ₹4,000</option><option value="8000">Under ₹8,000</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Plan</label>
            <select value={filters.mealPlan} onChange={(e) => setFilters({ ...filters, mealPlan: e.target.value })}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm">
              <option value="EP">EP — Room Only</option>
              <option value="CP">CP — Room + Breakfast</option>
              <option value="MAP">MAP — Room + Breakfast + Dinner</option>
            </select>
          </div>
        </div>

        <button onClick={runSearch} disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
          {loading ? 'Searching...' : 'Check Availability'}
        </button>
      </div>

      {/* Results */}
      {searched && (
        loading ? (
          <p className="text-center text-gray-400">Searching...</p>
        ) : results.length === 0 ? (
          <p className="text-center text-gray-500">No rooms match your search for these dates. Try adjusting your filters.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {results.map((group, i) => (
              <motion.div key={group.type} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp} transition={{ delay: (i % 3) * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="h-56 bg-primary-100 overflow-hidden">
                  {group.images?.[0] ? (
                    <img src={group.images[0].url} alt={group.type} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-300">No image</div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-serif text-xl text-primary-800">{group.type}</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {group.availableCount} available
                    </span>
                  </div>
                 <p className="text-primary-600 font-medium mb-1">
                    ₹{filters.mealPlan === 'CP' ? group.priceCP : filters.mealPlan === 'MAP' ? group.priceMAP : group.priceEP}/night
                    {group.extraGuestCharge > 0 && <span className="text-xs">*</span>}
                  </p>
                  {group.extraGuestCharge > 0 && (
                    <p className="text-xs text-green-700 mb-1">*Discounted rate for up to {group.capacity - 1} guests</p>
                  )}
                  <p className="text-sm text-gray-500 mb-4">Up to {group.capacity} guests</p>
                  <button onClick={() => goToType(group)}
                    className="w-full text-center bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-full text-sm font-medium transition-colors">
                    View & Book
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {!searched && (
        <p className="text-center text-gray-400 text-sm">
          Select your dates above to see which rooms are available.
        </p>
      )}
    </div>
  );
};

export default Rooms;