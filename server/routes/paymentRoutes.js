const express = require('express');
const router = express.Router();
const {
  createPaymentOrder, verifyPayment, createGroupPaymentOrder, verifyGroupPayment, processCancellationRefund
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.post('/create-group-order', protect, createGroupPaymentOrder);
router.post('/verify-group', protect, verifyGroupPayment);
router.put('/process-refund/:bookingId', protect, authorize('admin'), processCancellationRefund);

module.exports = router;