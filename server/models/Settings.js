const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  advancePercentage: { type: Number, default: 30, min: 1, max: 100 }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);