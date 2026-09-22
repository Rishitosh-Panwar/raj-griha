import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const GalleryManagement = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [size, setSize] = useState('normal');
  const [saving, setSaving] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/gallery');
      setImages(data);
    } catch {
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const openModal = () => {
    setFile(null);
    setCaption('');
    setSize('normal');
    setModalOpen(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please choose an image');
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption);
    fd.append('size', size);
    try {
      await api.post('/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Image added');
      setModalOpen(false);
      fetchImages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleSize = async (image) => {
    try {
      const next = image.size === 'large' ? 'normal' : 'large';
      await api.put(`/gallery/${image._id}`, { size: next });
      fetchImages();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      toast.success('Image deleted');
      fetchImages();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl text-primary-800">Gallery Management</h1>
        <button onClick={openModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
          <Plus size={16} /> Add Image
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : images.length === 0 ? (
        <p className="text-gray-400">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img._id} className="relative group rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="aspect-square">
                <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/40 sm:bg-black/0 sm:group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                <button onClick={() => toggleSize(img)}
                  className="text-xs bg-white text-primary-700 px-3 py-1 rounded-full font-medium">
                  {img.size === 'large' ? 'Set Normal' : 'Set Large'}
                </button>
                <button onClick={() => handleDelete(img._id)}
                  className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
              {img.size === 'large' && (
                <span className="absolute top-2 left-2 text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded-full">Large</span>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
            onClick={() => setModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-primary-800">Add Gallery Image</h2>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-primary-200 rounded-lg py-4 text-sm text-primary-600 cursor-pointer hover:bg-primary-50 transition-colors">
                    <span>{file ? file.name : 'Click to choose an image'}</span>
                    <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP · up to 8MB</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Caption (optional)</label>
                  <input value={caption} onChange={(e) => setCaption(e.target.value)}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Deluxe Room" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Display size</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSize('normal')}
                      className={`flex-1 text-xs py-2 rounded-lg font-medium ${size === 'normal' ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700'}`}>
                      Normal
                    </button>
                    <button type="button" onClick={() => setSize('large')}
                      className={`flex-1 text-xs py-2 rounded-lg font-medium ${size === 'large' ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700'}`}>
                      Large (featured)
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={saving}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Uploading...' : 'Add to Gallery'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryManagement;