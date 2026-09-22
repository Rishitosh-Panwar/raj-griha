const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  caption: { type: String, trim: true, default: '' },
  size: { type: String, enum: ['normal', 'large'], default: 'normal' } // controls grid span on the public page
}, { timestamps: true });

module.exports = mongoose.model('GalleryImage', galleryImageSchema);