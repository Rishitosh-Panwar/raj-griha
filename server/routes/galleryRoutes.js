const express = require('express');
const router = express.Router();
const {
  getGalleryImages, addGalleryImage, updateGalleryImage, deleteGalleryImage
} = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/auth');
const uploadGallery = require('../middleware/uploadGallery');

router.get('/', getGalleryImages);
router.post('/', protect, authorize('admin'), uploadGallery.single('image'), addGalleryImage);
router.put('/:id', protect, authorize('admin'), updateGalleryImage);
router.delete('/:id', protect, authorize('admin'), deleteGalleryImage);

module.exports = router;