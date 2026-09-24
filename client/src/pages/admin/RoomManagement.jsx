import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

const emptyForm = {
  roomNumber: '', type: 'Standard', priceEP: '', priceCP: '', priceMAP: '', extraGuestCharge: '', capacity: '', description: '', amenities: '',
};

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const openAddModal = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setFiles([]);
    setModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setForm({
      roomNumber: room.roomNumber,
      type: room.type,
      priceEP: room.priceEP ?? '',
      priceCP: room.priceCP ?? '',
      priceMAP: room.priceMAP ?? '',
      extraGuestCharge: room.extraGuestCharge ?? '',
      capacity: room.capacity,
      description: room.description || '',
      amenities: (room.amenities || []).join(', '),
    });
    setFiles([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append('roomNumber', form.roomNumber);
    fd.append('type', form.type);
    fd.append('priceEP', form.priceEP);
    fd.append('priceCP', form.priceCP);
    fd.append('priceMAP', form.priceMAP);
    fd.append('extraGuestCharge', form.extraGuestCharge || 0);
    fd.append('capacity', form.capacity);
    fd.append('description', form.description);
    fd.append('amenities', JSON.stringify(form.amenities.split(',').map(a => a.trim()).filter(Boolean)));
    files.forEach((f) => fd.append('images', f));

    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Room updated');
      } else {
        await api.post('/rooms', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Room added');
      }
      setModalOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (room) => {
    try {
      const fd = new FormData();
      fd.append('featured', !room.featured);
      await api.put(`/rooms/${room._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchRooms();
    } catch {
      toast.error('Failed to update');
    }
  };

  const updateFeaturedOrder = async (room, order) => {
    try {
      const fd = new FormData();
      fd.append('featuredOrder', order);
      await api.put(`/rooms/${room._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchRooms();
    } catch {
      toast.error('Failed to update order');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room? This cannot be undone.')) return;
    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Room deleted');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl text-primary-800">Room Management</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Room
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Room</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">EP / CP / MAP</th>
                <th className="px-6 py-3 font-medium">Extra Guest</th>
                <th className="px-6 py-3 font-medium">Capacity</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Featured</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room._id} className="border-t border-gray-100">
                  <td className="px-6 py-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 overflow-hidden flex-shrink-0">
                      {room.images?.[0] && <img src={room.images[0].url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    {room.roomNumber}
                  </td>
                  <td className="px-6 py-3">{room.type}</td>
                  <td className="px-6 py-3 text-xs">
                    ₹{room.priceEP ?? '—'} / ₹{room.priceCP ?? '—'} / ₹{room.priceMAP ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-xs">
                    {room.extraGuestCharge > 0 ? `+₹${room.extraGuestCharge}` : '—'}
                  </td>
                  <td className="px-6 py-3">{room.capacity}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full capitalize">{room.status}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleFeatured(room)}
                        className={`text-xs px-3 py-1 rounded-full font-medium ${room.featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {room.featured ? 'Featured ★' : 'Not Featured'}
                      </button>
                      {room.featured && (
                        <input
                          type="number"
                          defaultValue={room.featuredOrder}
                          onBlur={(e) => updateFeaturedOrder(room, e.target.value)}
                          title="Display order (lower shows first)"
                          className="w-14 border border-primary-200 rounded-lg px-2 py-1 text-xs"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEditModal(room)} className="text-gray-400 hover:text-primary-600"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(room._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rooms.length === 0 && <p className="text-center text-gray-400 py-8">No rooms added yet.</p>}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-primary-800">{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Room Number</label>
                    <input required value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                      className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Type</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm">
                      <option>Standard</option><option>Deluxe</option><option>Premium</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Pricing per night</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">EP (Room Only)</label>
                      <input type="number" required min={0} value={form.priceEP}
                        onChange={(e) => setForm({ ...form, priceEP: e.target.value })}
                        className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">CP (+Breakfast)</label>
                      <input type="number" required min={0} value={form.priceCP}
                        onChange={(e) => setForm({ ...form, priceCP: e.target.value })}
                        className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">MAP (+Dinner)</label>
                      <input type="number" required min={0} value={form.priceMAP}
                        onChange={(e) => setForm({ ...form, priceMAP: e.target.value })}
                        className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Capacity (beds)</label>
                    <input type="number" required min={1} value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Extra guest charge (₹/night)</label>
                    <input type="number" min={0} value={form.extraGuestCharge}
                      onChange={(e) => setForm({ ...form, extraGuestCharge: e.target.value })}
                      placeholder="0"
                      className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 -mt-2">
                  Charged only when guests reach full bed capacity (e.g. 3rd guest in a 3-bed room). Leave 0 for 2-bed rooms.
                </p>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Amenities (comma separated)</label>
                  <input placeholder="Wi-Fi, LED TV, Hot Water" value={form.amenities}
                    onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Images {editingRoom && '(adds to existing images)'}
                  </label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-primary-200 rounded-lg py-4 text-sm text-primary-600 cursor-pointer hover:bg-primary-50 transition-colors">
                    <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Click to choose images'}</span>
                    <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files))} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP · up to 5MB per image · max 6 images</p>
                </div>

                <button type="submit" disabled={saving}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomManagement;