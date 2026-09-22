const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: [
      'Main Course', 'Freshness', 'Indian Breads', 'Dessert', 'Rice & Aromas',
      'Hot Beverage', 'Cold Beverage', 'Sandwich / Maggi / Pasta', 'Breakfast', 'Fast Food / Chinese'
    ]
  },
  price: { type: Number, required: true, min: 0 },
  available: { type: Boolean, default: true },
  image: {
    url: String,
    publicId: String
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);