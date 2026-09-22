const express = require('express');
const router = express.Router();
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  deleteRoomImage,
  searchAvailableRooms
} = require('../controllers/roomController');
const { checkAvailability } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/search', searchAvailableRooms);
router.get('/', getRooms);
router.get('/:id', getRoomById);
router.get('/:id/availability', checkAvailability);

router.post('/', protect, authorize('admin'), upload.array('images', 6), createRoom);
router.put('/:id', protect, authorize('admin'), upload.array('images', 6), updateRoom);
router.delete('/:id', protect, authorize('admin'), deleteRoom);
router.delete('/:id/images/:publicId', protect, authorize('admin'), deleteRoomImage);

module.exports = router;