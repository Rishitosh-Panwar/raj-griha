const GalleryImage = require('../models/GalleryImage');
const cloudinary = require('../config/cloudinary');

const getGalleryImages = async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addGalleryImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });
    const { caption, size } = req.body;

    const image = await GalleryImage.create({
      url: req.file.path,
      publicId: req.file.filename,
      caption: caption || '',
      size: size === 'large' ? 'large' : 'normal'
    });

    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateGalleryImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    const { caption, size } = req.body;
    if (caption !== undefined) image.caption = caption;
    if (size !== undefined) image.size = size === 'large' ? 'large' : 'normal';

    await image.save();
    res.json(image);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteGalleryImage = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found' });

    await cloudinary.uploader.destroy(image.publicId);
    await image.deleteOne();

    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getGalleryImages, addGalleryImage, updateGalleryImage, deleteGalleryImage };