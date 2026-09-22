import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin } from 'lucide-react';
import api from '../../api/axios';
import usePageTitle from '../../hooks/usePageTitle';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const Contact = () => {
  usePageTitle('Contact');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/inquiries/general', form);
      toast.success('Thanks! We\'ll get back to you shortly.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
        <h1 className="font-serif text-4xl text-primary-800 mb-2">Reservation & Hotel Inquiries</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          We offer booking for wedding ceremonies, parties, and other events as well —
          with ground, kitchen, and rooms available for the same. Get in touch and we'll help plan it with you.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
          <h2 className="font-serif text-xl text-primary-800 mb-4">Get in Touch</h2>
          <div className="space-y-4 text-sm text-gray-600 mb-8">
            <p className="flex items-center gap-3"><MapPin size={18} className="text-primary-600" /> Bypass Road, Barethi, Gangotri National Highway, Uttarkashi - 249193, Uttarakhand</p>
            <p className="flex items-center gap-3"><Phone size={18} className="text-primary-600" /> +91 7668434826</p>
            <a href="mailto:contact.rajgriha@gmail.com" className="flex items-center gap-3 hover:text-primary-700">
  <Mail size={18} className="text-primary-600" /> contact.rajgriha@gmail.com
</a>
          </div>
          <div className="bg-primary-50 rounded-2xl p-6">
            <h3 className="font-medium text-primary-800 mb-2">Planning an event?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              From weddings to family functions, Raj Griha's garden, dining hall, and kitchen facilities
              can be arranged for your event — along with rooms for your guests to stay. Tell us about
              your event in the form and we'll follow up with details.
            </p>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
          className="bg-white rounded-2xl shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name *</label>
            <input name="name" required value={form.name} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email *</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Phone *</label>
            <input name="phone" required value={form.phone} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <select name="subject" value={form.subject} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select one</option>
              <option value="Reservation Inquiry">Reservation Inquiry</option>
              <option value="Wedding / Event Booking">Wedding / Event Booking</option>
              <option value="General Question">General Question</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Message *</label>
            <textarea name="message" required rows={4} value={form.message} onChange={handleChange}
              className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={sending}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Inquiry'}
          </button>
        </motion.form>
      </div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="mt-16">
  <h2 className="font-serif text-2xl text-primary-800 text-center mb-6">Find Us</h2>
  <div className="rounded-2xl overflow-hidden shadow-sm h-96">
    <iframe
      src="https://www.google.com/maps?q=30.7331911511669,78.40647777522993&output=embed"
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen=""
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="Raj Griha location"
    />
  </div>
  <div className="text-center mt-4">
    <a href="https://maps.app.goo.gl/gZoT5iKHkVuomyMn8" target="_blank" rel="noopener noreferrer"
      className="text-sm text-primary-600 hover:text-primary-800 font-medium underline">
      Get Directions →
    </a>
  </div>
</motion.div>
    </div>
  );
};

export default Contact;