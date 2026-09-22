import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const categories = [
  'Main Course', 'Freshness', 'Indian Breads', 'Dessert', 'Rice & Aromas',
  'Hot Beverage', 'Cold Beverage', 'Sandwich / Maggi / Pasta', 'Breakfast', 'Fast Food / Chinese'
];

const emptyForm = { name: '', category: categories[0], price: '' };

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = filterCategory ? { category: filterCategory } : {};
      const { data } = await api.get('/menu', { params });
      setItems(data);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterCategory]);

  const openAddModal = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setFile(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({ name: item.name, category: item.category, price: item.price });
    setFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('category', form.category);
    fd.append('price', form.price);
    if (file) fd.append('image', file);

    try {
      if (editingItem) {
        await api.put(`/menu/${editingItem._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Item updated');
      } else {
        await api.post('/menu', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Item added');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (item) => {
    try {
      const fd = new FormData();
      fd.append('available', !item.available);
      await api.put(`/menu/${item._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchItems();
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Item deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl text-primary-800">Menu Management</h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-primary-200 rounded-full px-4 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Available</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t border-gray-100">
                  <td className="px-6 py-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 overflow-hidden flex-shrink-0">
                      {item.image?.url && (
                        <img src={item.image.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    {item.name}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{item.category}</td>
                  <td className="px-6 py-3">₹{item.price}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        item.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.available ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-primary-600">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-center text-gray-400 py-8">No menu items yet.</p>}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-primary-800">
                  {editingItem ? 'Edit Item' : 'Add Item'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Item Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Photo {editingItem && '(optional — replaces current photo)'}
                  </label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-primary-200 rounded-lg py-4 text-sm text-primary-600 cursor-pointer hover:bg-primary-50 transition-colors">
                    <span>{file ? file.name : 'Click to choose a photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP · up to 5MB</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuManagement;