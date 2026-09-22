import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const MAP_EMBED_SRC =
  'https://www.google.com/maps?q=30.7331911511669,78.40647777522993&output=embed';

const About = () => {
  usePageTitle('About Us');
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-center mb-16"
      >
        <h1 className="font-serif text-4xl text-primary-800 mb-3">
          About Raj Griha
        </h1>

        <p className="text-gray-500 max-w-2xl mx-auto">
          A trusted stop on the Char Dham route, open all year round in the
          heart of Uttarkashi.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        className="prose max-w-2xl mx-auto text-gray-600 leading-relaxed mb-16 text-center"
      >
        <p className="mb-4">
          Located on the Gangotri National Highway in Barethi, Uttarkashi,
          Raj Griha has long been a trusted stop for Char Dham pilgrims and
          mountain travelers. While the Yatra season brings most of our
          guests, we stay open through the year — including winter — for
          anyone passing through the valley.
        </p>

        <p>
          Comfortable rooms, home-style buffet meals, and a peaceful mountain
          view make it easy to rest before the journey continues. Whether
          you're here for a night on your way to Gangotri and Yamunotri, or
          simply passing through, our team is here to make your stay
          comfortable and easy.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
      >
        <h2 className="font-serif text-2xl text-primary-800 text-center mb-6">
          Find Us
        </h2>

        <div className="flex items-center justify-center gap-2 text-gray-500 mb-6 text-sm">
          <MapPin size={16} />
          <span>
            Bypass Road, Barethi, Gangotri National Highway, Uttarkashi -
            249193, Uttarakhand
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-sm h-96">
          <iframe
            src={MAP_EMBED_SRC}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Raj Griha location"
          />
        </div>

        <div className="text-center mt-4">
          <a
            href="https://maps.app.goo.gl/gZoT5iKHkVuomyMn8"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-800 font-medium underline"
          >
            Get Directions →
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default About;