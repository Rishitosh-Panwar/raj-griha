const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const { sendAlertEmail, sendGuestEmail } = require('../utils/sendEmail');
const { cancelConflictingPendingBookings } = require('./bookingController');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId, type } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'This booking can no longer be paid for' });
    }

    const remaining = booking.totalAmount - booking.amountPaid;
    if (remaining <= 0) {
      return res.status(400).json({ message: 'This booking is already fully paid' });
    }

    let amount;
    if (type === 'full') {
      amount = remaining;
    } else {
      const settings = (await Settings.findOne()) || { advancePercentage: 30 };
      const advanceTarget = Math.round(booking.totalAmount * settings.advancePercentage / 100);
      amount = Math.min(advanceTarget - booking.amountPaid, remaining);
      if (amount <= 0) {
        return res.status(400).json({ message: 'Advance amount already covered — pay the remaining full balance instead' });
      }
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `booking_${booking._id}_${Date.now()}`,
      notes: { bookingId: booking._id.toString(), type }
    });

    res.json({
      orderId: order.id,
      amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, amount, type } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
    }

    const booking = await Booking.findById(bookingId).populate('room', 'roomNumber type');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const alreadyProcessed = booking.payments.some(p => p.razorpayPaymentId === razorpay_payment_id);
    if (alreadyProcessed) {
      return res.json({ message: 'Payment already processed', booking });
    }

    booking.amountPaid += Number(amount);
    booking.paymentStatus = booking.amountPaid >= booking.totalAmount ? 'paid' : 'partial';
    booking.status = 'confirmed';
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.payments.push({ razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id, amount: Number(amount) });
    await booking.save();

    await cancelConflictingPendingBookings(booking.room._id, booking.checkIn, booking.checkOut, booking._id);

    await sendAlertEmail(
      `Payment Received — ${type === 'full' ? 'Full Payment' : 'Advance Payment'}`,
      `<h3>${req.user.name} just paid ₹${amount}</h3>
       <p><b>Room:</b> ${booking.room.type} (Room ${booking.room.roomNumber})</p>
       <p><b>Payment type:</b> ${type === 'full' ? 'Full' : 'Advance'}</p>
       <p><b>Total paid so far:</b> ₹${booking.amountPaid} of ₹${booking.totalAmount}</p>
       <p><b>Booking status:</b> Confirmed</p>`
    );

    res.json({ message: 'Payment verified', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createGroupPaymentOrder = async (req, res) => {
  try {
    const { groupId, type } = req.body;

    const bookings = await Booking.find({ groupId, user: req.user._id });
    if (bookings.length === 0) return res.status(404).json({ message: 'Group booking not found' });

    const groupTotal = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const groupPaid = bookings.reduce((sum, b) => sum + b.amountPaid, 0);
    const remaining = groupTotal - groupPaid;

    if (remaining <= 0) {
      return res.status(400).json({ message: 'This group booking is already fully paid' });
    }

    let amount;
    if (type === 'full') {
      amount = remaining;
    } else {
      const settings = (await Settings.findOne()) || { advancePercentage: 30 };
      const advanceTarget = Math.round(groupTotal * settings.advancePercentage / 100);
      amount = Math.min(advanceTarget - groupPaid, remaining);
      if (amount <= 0) {
        return res.status(400).json({ message: 'Advance already covered — pay the remaining full balance instead' });
      }
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `group_${groupId}_${Date.now()}`,
      notes: { groupId, type }
    });

    res.json({ orderId: order.id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const verifyGroupPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, groupId, amount, type } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
    }

    const bookings = await Booking.find({ groupId, user: req.user._id }).populate('room', 'roomNumber type');
    if (bookings.length === 0) return res.status(404).json({ message: 'Group booking not found' });

    const alreadyProcessed = bookings.some(b => b.payments.some(p => p.razorpayPaymentId === razorpay_payment_id));
    if (alreadyProcessed) {
      return res.json({ message: 'Payment already processed', bookings });
    }

    const groupTotal = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    let distributed = 0;

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      const share = i === bookings.length - 1
        ? Number(amount) - distributed
        : Math.round(Number(amount) * (b.totalAmount / groupTotal));
      distributed += share;

      b.amountPaid += share;
      b.paymentStatus = b.amountPaid >= b.totalAmount ? 'paid' : 'partial';
      b.status = 'confirmed';
      b.razorpayOrderId = razorpay_order_id;
      b.razorpayPaymentId = razorpay_payment_id;
      b.payments.push({ razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id, amount: share });
      await b.save();

      await cancelConflictingPendingBookings(b.room._id, b.checkIn, b.checkOut, b._id);
    }

    const roomLines = bookings.map(b => `<li>${b.room.type} Room ${b.room.roomNumber} — ₹${b.totalAmount}</li>`).join('');
    await sendAlertEmail(
      `Group Payment Received — ${type === 'full' ? 'Full Payment' : 'Advance Payment'}`,
      `<h3>${req.user.name} just paid ₹${amount} for a ${bookings.length}-room group booking</h3>
       <ul>${roomLines}</ul>
       <p><b>Payment type:</b> ${type === 'full' ? 'Full' : 'Advance'}</p>
       <p><b>All rooms in this group are now confirmed.</b></p>`
    );

    res.json({ message: 'Payment verified', bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const processCancellationRefund = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.refundStatus !== 'pending') {
      return res.status(400).json({ message: 'No refund pending for this booking' });
    }
    if (booking.refundEligibleAmount <= 0) {
      return res.status(400).json({ message: 'Nothing to refund' });
    }
    if (!booking.payments || booking.payments.length === 0) {
      return res.status(400).json({ message: 'No payment records found to refund against' });
    }

    let remaining = booking.refundEligibleAmount;
    const refundRecords = [];

    const paymentsDesc = [...booking.payments].reverse();
    for (const payment of paymentsDesc) {
      if (remaining <= 0) break;
      const refundAmount = Math.min(remaining, payment.amount);

      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100)
      });

      refundRecords.push({ razorpayRefundId: refund.id, amount: refundAmount });
      remaining -= refundAmount;
    }

    booking.refunds.push(...refundRecords);
    booking.refundStatus = 'processed';
    booking.paymentStatus = 'refunded';
    await booking.save();

    await sendGuestEmail(
      booking.user.email,
      'Your Refund Has Been Processed',
      `<p>Hi ${booking.user.name},</p>
       <p>Your refund of ₹${booking.refundEligibleAmount} for your cancelled booking has been processed and
       should reflect in your account within 5–7 business days.</p>
       ${booking.creditAmount > 0 ? `<p>The remaining ₹${booking.creditAmount} is held as credit toward a
       future stay — just get in touch with us with proof of this booking when you're ready to rebook.</p>` : ''}`
    );

    res.json({ message: 'Refund processed', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body; // Buffer, thanks to express.raw() in server.js

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString());

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const { bookingId, groupId, type } = payment.notes || {};
      const amount = payment.amount / 100;
      const razorpay_payment_id = payment.id;
      const razorpay_order_id = payment.order_id;

      if (bookingId) {
        const booking = await Booking.findById(bookingId).populate('room', 'roomNumber type').populate('user', 'name email');
        if (booking) {
          const alreadyProcessed = booking.payments.some(p => p.razorpayPaymentId === razorpay_payment_id);
          if (!alreadyProcessed) {
            booking.amountPaid += amount;
            booking.paymentStatus = booking.amountPaid >= booking.totalAmount ? 'paid' : 'partial';
            booking.status = 'confirmed';
            booking.razorpayOrderId = razorpay_order_id;
            booking.razorpayPaymentId = razorpay_payment_id;
            booking.payments.push({ razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id, amount });
            await booking.save();

            await cancelConflictingPendingBookings(booking.room._id, booking.checkIn, booking.checkOut, booking._id);

            await sendAlertEmail(
              `Payment Confirmed via Webhook — ${type === 'full' ? 'Full Payment' : 'Advance Payment'}`,
              `<h3>${booking.user.name} paid ₹${amount}</h3>
               <p><b>Room:</b> ${booking.room.type} (Room ${booking.room.roomNumber})</p>
               <p>Confirmed via Razorpay webhook — server-side fallback, browser may have closed before completing normally.</p>`
            );
          }
        }
      } else if (groupId) {
        const bookings = await Booking.find({ groupId }).populate('room', 'roomNumber type').populate('user', 'name email');
        if (bookings.length > 0) {
          const alreadyProcessed = bookings.some(b => b.payments.some(p => p.razorpayPaymentId === razorpay_payment_id));
          if (!alreadyProcessed) {
            const groupTotal = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
            let distributed = 0;
            for (let i = 0; i < bookings.length; i++) {
              const b = bookings[i];
              const share = i === bookings.length - 1
                ? amount - distributed
                : Math.round(amount * (b.totalAmount / groupTotal));
              distributed += share;

              b.amountPaid += share;
              b.paymentStatus = b.amountPaid >= b.totalAmount ? 'paid' : 'partial';
              b.status = 'confirmed';
              b.razorpayOrderId = razorpay_order_id;
              b.razorpayPaymentId = razorpay_payment_id;
              b.payments.push({ razorpayPaymentId: razorpay_payment_id, razorpayOrderId: razorpay_order_id, amount: share });
              await b.save();

              await cancelConflictingPendingBookings(b.room._id, b.checkIn, b.checkOut, b._id);
            }

            await sendAlertEmail(
              `Group Payment Confirmed via Webhook`,
              `<h3>${bookings[0].user.name} paid ₹${amount} for a ${bookings.length}-room group booking</h3>
               <p>Confirmed via Razorpay webhook — server-side fallback.</p>`
            );
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

module.exports = { createPaymentOrder, verifyPayment, createGroupPaymentOrder, verifyGroupPayment, processCancellationRefund, razorpayWebhook };