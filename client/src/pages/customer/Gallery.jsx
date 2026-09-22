import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const Gallery = () => {
  usePageTitle('Gallery');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data } = await api.get('/gallery');
        setImages(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
        <h1 className="font-serif text-4xl text-primary-800 mb-2">Gallery</h1>
        <p className="text-gray-500">A glimpse of Raj Griha</p>
      </motion.div>

      {loading ? (
        <p className="text-center text-gray-400">Loading gallery...</p>
      ) : images.length === 0 ? (
        <p className="text-center text-gray-500">Photos coming soon.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[180px] sm:auto-rows-[220px] gap-4">
          {images.map((img, i) => (
            <motion.button
              key={img._id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              transition={{ delay: (i % 6) * 0.05 }}
              onClick={() => setSelected(img)}
              className={`relative rounded-2xl overflow-hidden group ${
                img.size === 'large' ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
              }`}
            >
              <img src={img.url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {img.caption && (
                <span className="absolute bottom-3 left-3 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.caption}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6"
            onClick={() => setSelected(null)}
          >
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-white hover:text-gray-300">
              <X size={28} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full"
            >
              <img src={selected.url} alt={selected.caption} className="w-full max-h-[80vh] object-contain rounded-lg mx-auto" />
              {selected.caption && (
                <p className="text-white text-center mt-4 text-sm">{selected.caption}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;