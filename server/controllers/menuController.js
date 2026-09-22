const MenuItem = require('../models/MenuItem');
const cloudinary = require('../config/cloudinary');

const getMenuItems = async (req, res) => {
  try {
    const { category, availableOnly } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (availableOnly === 'true') filter.available = true;

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { name, category, price } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    const image = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;

    const item = await MenuItem.create({ name, category, price, image });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { name, category, price, available } = req.body;
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (price !== undefined) item.price = price;
    if (available !== undefined) item.available = available === 'true' || available === true;

    if (req.file) {
      if (item.image?.publicId) {
        await cloudinary.uploader.destroy(item.image.publicId);
      }
      item.image = { url: req.file.path, publicId: req.file.filename };
    }

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    if (item.image?.publicId) {
      await cloudinary.uploader.destroy(item.image.publicId);
    }

    await item.deleteOne();
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem };