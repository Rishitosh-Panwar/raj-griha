const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'raj-griha/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const uploadGallery = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 } // gallery shots can run a bit larger than thumbnails
});

module.exports = uploadGallery;