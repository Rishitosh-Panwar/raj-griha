import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wifi, Tv, Droplets, ConciergeBell, Car, UtensilsCrossed, Trees, Users, PartyPopper } from 'lucide-react';
import api from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const amenities = [
  { icon: Tv, label: 'LED TV' },
  { icon: Wifi, label: 'Wi-Fi' },
  { icon: Droplets, label: 'Hot & Cold Water 24/7' },
  { icon: ConciergeBell, label: 'Room Service' },
  { icon: Car, label: 'Parking' },
  { icon: UtensilsCrossed, label: 'Dining Hall & Food Facility' },
  { icon: Trees, label: 'Garden Space' },
  { icon: Users, label: 'Group Booking & Kitchen Facility' },
  { icon: PartyPopper, label: 'Weddings & Parties' },
];

const Home = () => {
  usePageTitle('Home');
  const [featuredRooms, setFeaturedRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get('/rooms', { params: { featured: true } });
        setFeaturedRooms(data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load rooms', err);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div>
      {/* Hero */}
    <section className="relative h-[70vh] sm:h-[85vh] flex items-end justify-center overflow-hidden">
  <img
    src="https://res.cloudinary.com/w4vetazv/image/upload/v1789561057/IMG_5371.jpg"
    alt="Raj Griha"
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
  <motion.div
    initial="hidden"
    animate="visible"
    variants={fadeUp}
    className="relative z-10 text-center px-6 pb-10 sm:pb-20 max-w-2xl"
  >
    <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl text-white mb-4">Raj Griha</h1>
    <p className="text-white/90 text-lg md:text-xl mb-8">
      A comfortable stay on the Gangotri National Highway, Uttarkashi — your base for the Char Dham
      Yatra, open all year round with views of the surrounding Himalayan valley.
    </p>
    <Link
      to="/rooms"
      className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full font-medium transition-colors"
    >
      Book Your Stay
    </Link>
  </motion.div>
</section>
      {/* About */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-14 sm:py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
        >
          <div className="text-center">
  <h2 className="font-serif text-3xl md:text-4xl text-primary-800 mb-3">
    About Raj Griha
  </h2>

  <h3 className="font-serif text-xl md:text-2xl text-primary-700 mb-6">
    A Place to Pause. A Journey to Remember.
  </h3>

  <div className="space-y-4">
    <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
      Set along the Gangotri Highway in Barethi, Uttarkashi,{" "}
      <span className="text-primary-800 font-medium">Raj Griha</span> is a
      welcoming mountain stay for Char Dham pilgrims, families, and travelers
      exploring the Garhwal Himalayas.
    </p>

    <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
      For years, we have been a trusted stop along the journey to Gangotri —
      offering comfortable rooms, wholesome home-style buffet meals, and a
      peaceful setting where you can slow down and take in the beauty of the
      valley.
    </p>

    <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
      Open throughout the year, Raj Griha is a place to rest after the road,
      gather over a good meal, and wake up to the mountains before continuing
      your journey.
    </p>
  </div>
</div>
        </motion.div>
      </section>

      {/* Location & Valley View */}
      <section className="bg-primary-50 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h2 className="font-serif text-3xl text-primary-800 mb-4">Surrounded by the Mountains</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Raj Griha sits along the Gangotri Highway with a view of the Uttarkashi valley,
              tucked into the surrounding hills. Whether you're here on your way to the Char Dham, or simply passing through in the quieter winter months, it's a peaceful
              place to rest.
            </p>
            <p className="text-sm text-gray-500">
              Bypass Road, Barethi, Gangotri National Highway, Uttarkashi - 249193, Uttarakhand
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="h-56 sm:h-72 rounded-2xl overflow-hidden"
          >
            <img
              src="https://res.cloudinary.com/w4vetazv/image/upload/v1789494090/WhatsApp_Image_2026-09-15_at_19.47.32.jpg"
              alt="Uttarkashi valley view"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-14 sm:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="font-serif text-3xl md:text-4xl text-primary-800 text-center mb-12"
          >
            Featured Rooms
          </motion.h2>

          {featuredRooms.length === 0 ? (
            <p className="text-center text-gray-500">Rooms will appear here once added.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredRooms.map((room, i) => (
                <motion.div
                  key={room._id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="h-56 bg-primary-100 overflow-hidden">
                    {room.images?.[0] ? (
                      <img src={room.images[0].url} alt={room.type} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-300">No image</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-primary-800 mb-1">{room.type}</h3>
                    <p className="text-primary-600 font-medium mb-1">From ₹{room.priceEP}/night</p>
                    <p className="text-xs text-gray-400 mb-3">Room only (EP) · CP & MAP plans available</p>
                    <p className="text-sm text-gray-500 mb-4">{room.capacity} Guests</p>
                    <Link to={`/rooms/type/${room.type}`} className="text-sm font-medium text-primary-600 hover:text-primary-800">
  View Details →
</Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Amenities */}
      <section className="max-w-6xl mx-auto px-6 py-14 sm:py-24">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="font-serif text-3xl md:text-4xl text-primary-800 text-center mb-12"
        >
          Amenities
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {amenities.map((a, i) => (
            <motion.div
              key={a.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center text-center gap-3 p-6 rounded-xl bg-primary-50"
            >
              <a.icon className="text-primary-600" size={28} />
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;