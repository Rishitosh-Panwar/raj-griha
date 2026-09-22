const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, required: true },
  mealPlan: { type: String, enum: ['EP', 'CP', 'MAP'], default: 'EP' },
  guests: {
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0 }
  },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
    default: 'pending'
  },
  groupId: { type: String, default: null },

  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid', 'refunded'], default: 'unpaid' },
  amountPaid: { type: Number, default: 0 },
  payments: [{
    razorpayPaymentId: String,
    razorpayOrderId: String,
    amount: Number,
    date: { type: Date, default: Date.now }
  }],
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },

  cancelledAt: { type: Date, default: null },
  refundEligibleAmount: { type: Number, default: 0 },
  creditAmount: { type: Number, default: 0 },
  refundStatus: { type: String, enum: ['not_applicable', 'pending', 'processed'], default: 'not_applicable' },
  refunds: [{
    razorpayRefundId: String,
    amount: Number,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);