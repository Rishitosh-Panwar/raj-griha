const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  type: { type: String, required: true, enum: ['Standard', 'Deluxe', 'Premium'] },
  priceEP: { type: Number, required: true, min: 0 },   // Room Only
  priceCP: { type: Number, required: true, min: 0 },   // Room + Breakfast
  priceMAP: { type: Number, required: true, min: 0 },  // Room + Breakfast + Dinner
  extraGuestCharge: { type: Number, default: 0, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  amenities: [{ type: String }],
  images: [{ url: String, publicId: String }],
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'reserved'], default: 'available' },
featured: { type: Boolean, default: false },
featuredOrder: { type: Number, default: 0 },
  description: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);