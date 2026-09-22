const express = require('express');
const router = express.Router();
const {
  createBooking,
  createGroupBooking,
  getGroupBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getMyActiveBooking,
  getBookingBill,
  checkoutBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.post('/group', protect, createGroupBooking);
router.get('/group/:groupId', protect, getGroupBooking);
router.get('/active', protect, getMyActiveBooking);
router.get('/my', protect, getMyBookings);
router.get('/', protect, authorize('admin'), getAllBookings);
router.get('/:id/bill', protect, authorize('admin'), getBookingBill);
router.put('/:id/checkout', protect, authorize('admin'), checkoutBooking);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;