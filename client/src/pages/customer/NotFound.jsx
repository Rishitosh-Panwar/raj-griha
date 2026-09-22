import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-serif text-6xl sm:text-8xl text-primary-300 mb-4">404</h1>
        <h2 className="font-serif text-2xl text-primary-800 mb-3">Looks like this path led off the map</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist — maybe it moved, or the link was mistyped.
        </p>
        <Link to="/" className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors">
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;