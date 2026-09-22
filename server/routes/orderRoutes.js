const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getAllOrders, updateOrderStatus, createOfflineOrder, getOrdersForBooking
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.post('/offline', protect, authorize('admin'), createOfflineOrder);
router.get('/my', protect, getMyOrders);
router.get('/booking/:bookingId', protect, authorize('admin'), getOrdersForBooking);
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;