const crypto = require('crypto');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Order = require('../models/Order');
const { sendAlertEmail, sendGuestEmail } = require('../utils/sendEmail');

const toDateOnly = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const isRoomAvailable = async (roomId, checkIn, checkOut, excludeBookingId = null) => {
  const query = {
    room: roomId,
    status: { $in: ['confirmed', 'checked-in'] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn }
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const conflicting = await Booking.findOne(query);
  return !conflicting;
};

const cancelConflictingPendingBookings = async (roomId, checkIn, checkOut, confirmedBookingId) => {
  const conflicts = await Booking.find({
    room: roomId,
    status: 'pending',
    _id: { $ne: confirmedBookingId },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn }
  }).populate('user', 'name email').populate('room', 'roomNumber type');

  for (const conflict of conflicts) {
    conflict.status = 'cancelled';
    await conflict.save();

    await sendGuestEmail(
      conflict.user.email,
      'Update on Your Raj Griha Booking',
      `<p>Hi ${conflict.user.name},</p>
       <p>We're sorry — the ${conflict.room.type} room (Room ${conflict.room.roomNumber}) you had a pending
       request for has just been confirmed by another guest for the same dates, so we've had to cancel
       your pending request.</p>
       <p>Please feel free to browse other available rooms on our site, or get in touch and we'll help
       you find something else for your dates.</p>`
    );
  }
};

const createBooking = async (req, res) => {
  try {
    const { type, roomId, checkIn, checkOut, adults, children, mealPlan, phone } = req.body;

    if ((!type && !roomId) || !checkIn || !checkOut || !adults) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    if (!req.user.phone) {
      if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) {
        return res.status(400).json({ message: 'A valid phone number is required to book', needsPhone: true });
      }
      req.user.phone = phone;
      await req.user.save();
    }

    const plan = ['EP', 'CP', 'MAP'].includes(mealPlan) ? mealPlan : 'EP';
    const checkInDate = toDateOnly(checkIn);
    const checkOutDate = toDateOnly(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    let room;

    if (roomId) {
      room = await Room.findById(roomId);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      const available = await isRoomAvailable(roomId, checkInDate, checkOutDate);
      if (!available) return res.status(409).json({ message: 'Room is not available for these dates' });
    } else {
      const candidates = await Room.find({ type, status: { $ne: 'maintenance' } });
      for (const candidate of candidates) {
        const available = await isRoomAvailable(candidate._id, checkInDate, checkOutDate);
        if (available && Number(adults) + Number(children || 0) <= candidate.capacity) {
          room = candidate;
          break;
        }
      }
      if (!room) return res.status(409).json({ message: `No ${type} rooms available for these dates` });
    }

    if (Number(adults) + Number(children || 0) > room.capacity) {
      return res.status(400).json({ message: 'Guest count exceeds room capacity' });
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const priceByPlan = { EP: room.priceEP, CP: room.priceCP, MAP: room.priceMAP };
    const totalGuests = Number(adults) + Number(children || 0);
    const isFullOccupancy = totalGuests >= room.capacity;
    const perNightPrice = priceByPlan[plan] + (isFullOccupancy ? (room.extraGuestCharge || 0) : 0);
    const totalAmount = nights * perNightPrice;

    const booking = await Booking.create({
      user: req.user._id,
      room: room._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      mealPlan: plan,
      guests: { adults, children: children || 0 },
      totalAmount
    });

    await sendAlertEmail(
      `New Booking — ${room.type} Room`,
      `<h3>New booking from ${req.user.name}</h3>
       <p><b>Email:</b> ${req.user.email}</p>
       <p><b>Phone:</b> ${req.user.phone || 'Not provided'}</p>
       <p><b>Room:</b> ${room.type} (Room ${room.roomNumber})</p>
       <p><b>Dates:</b> ${checkInDate.toDateString()} → ${checkOutDate.toDateString()} (${nights} nights)</p>
       <p><b>Plan:</b> ${plan}</p>
       <p><b>Guests:</b> ${adults} Adults, ${children || 0} Children</p>
       <p><b>Total:</b> ₹${totalAmount}</p>`
    );

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createGroupBooking = async (req, res) => {
  try {
    const { rooms, checkIn, checkOut, phone } = req.body;

    if (!rooms || rooms.length === 0 || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Rooms and dates are required' });
    }

    if (!req.user.phone) {
      if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) {
        return res.status(400).json({ message: 'A valid phone number is required to book', needsPhone: true });
      }
      req.user.phone = phone;
      await req.user.save();
    }

    const checkInDate = toDateOnly(checkIn);
    const checkOutDate = toDateOnly(checkOut);
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const groupId = crypto.randomBytes(6).toString('hex');
    const createdBookings = [];

    for (const entry of rooms) {
      const room = await Room.findById(entry.roomId);
      if (!room) return res.status(404).json({ message: 'One of the selected rooms was not found' });

      const totalGuests = Number(entry.adults) + Number(entry.children || 0);
      if (totalGuests > room.capacity) {
        return res.status(400).json({ message: `${room.type} ${room.roomNumber} can't hold ${totalGuests} guests` });
      }

      const available = await isRoomAvailable(entry.roomId, checkInDate, checkOutDate);
      if (!available) {
        return res.status(409).json({ message: `${room.type} ${room.roomNumber} is not available for these dates` });
      }
    }

    for (const entry of rooms) {
      const room = await Room.findById(entry.roomId);
      const plan = ['EP', 'CP', 'MAP'].includes(entry.mealPlan) ? entry.mealPlan : 'EP';
      const priceByPlan = { EP: room.priceEP, CP: room.priceCP, MAP: room.priceMAP };
      const totalGuests = Number(entry.adults) + Number(entry.children || 0);
      const isFullOccupancy = totalGuests >= room.capacity;
      const perNightPrice = priceByPlan[plan] + (isFullOccupancy ? (room.extraGuestCharge || 0) : 0);
      const totalAmount = nights * perNightPrice;

      const booking = await Booking.create({
        user: req.user._id,
        room: entry.roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        mealPlan: plan,
        guests: { adults: entry.adults, children: entry.children || 0 },
        totalAmount,
        groupId
      });
      createdBookings.push(booking);
    }

    const roomLines = createdBookings.map((b, i) =>
      `<li>Room booking ${i + 1}: ${b.mealPlan} plan, ${b.guests.adults} Adults, ${b.guests.children} Children — ₹${b.totalAmount}</li>`
    ).join('');
    const groupTotal = createdBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    await sendAlertEmail(
      `New Group Booking — ${createdBookings.length} Rooms`,
      `<h3>New group booking from ${req.user.name}</h3>
       <p><b>Email:</b> ${req.user.email}</p>
       <p><b>Phone:</b> ${req.user.phone || 'Not provided'}</p>
       <p><b>Dates:</b> ${checkInDate.toDateString()} → ${checkOutDate.toDateString()} (${nights} nights)</p>
       <ul>${roomLines}</ul>
       <p><b>Grand Total: ₹${groupTotal}</b></p>`
    );

    res.status(201).json({ groupId, bookings: createdBookings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getGroupBooking = async (req, res) => {
  try {
    const bookings = await Booking.find({ groupId: req.params.groupId, user: req.user._id })
      .populate('room', 'roomNumber type images');
    if (bookings.length === 0) return res.status(404).json({ message: 'Group booking not found' });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room', 'roomNumber type priceEP priceCP priceMAP images')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('room', 'roomNumber type')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('room');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = booking.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    if (status === 'checked-in') {
      await Room.findByIdAndUpdate(booking.room, { status: 'occupied' });
    } else if (status === 'checked-out' || status === 'cancelled') {
      await Room.findByIdAndUpdate(booking.room, { status: 'available' });
    } else if (status === 'confirmed') {
      await cancelConflictingPendingBookings(booking.room, booking.checkIn, booking.checkOut, booking._id);
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user', 'name email').populate('room', 'roomNumber type');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a booking that is ${booking.status}` });
    }

    const daysUntilCheckIn = Math.ceil((new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60 * 24));

    let refundMessage;
    if (booking.amountPaid > 0 && daysUntilCheckIn > 10) {
      const cashRefund = Math.round(booking.amountPaid * 0.5);
      const credit = booking.amountPaid - cashRefund;
      booking.refundEligibleAmount = cashRefund;
      booking.creditAmount = credit;
      booking.refundStatus = 'pending';
      refundMessage = `You're eligible for a ₹${cashRefund} refund, plus ₹${credit} credit toward a future stay.`;
    } else if (booking.amountPaid > 0) {
      booking.refundEligibleAmount = 0;
      booking.creditAmount = 0;
      booking.refundStatus = 'not_applicable';
      refundMessage = 'As this is within 10 days of check-in, this booking is not eligible for a refund.';
    } else {
      refundMessage = 'No payment was made on this booking.';
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    if (booking.refundStatus === 'pending') {
      await sendAlertEmail(
        `Refund Due — ${booking.room.type} Room ${booking.room.roomNumber}`,
        `<h3>${booking.user.name} cancelled a paid booking</h3>
         <p><b>Cash refund due:</b> ₹${booking.refundEligibleAmount}</p>
         <p><b>Credit for future stay:</b> ₹${booking.creditAmount}</p>
         <p>Process this refund from the admin Booking Management page.</p>`
      );
    }

    await sendGuestEmail(
      booking.user.email,
      'Your Raj Griha Booking Has Been Cancelled',
      `<p>Hi ${booking.user.name},</p>
       <p>Your booking for the ${booking.room.type} room (Room ${booking.room.roomNumber}) has been cancelled.</p>
       <p>${refundMessage}</p>`
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const checkAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'checkIn and checkOut are required' });
    }

    const available = await isRoomAvailable(req.params.id, toDateOnly(checkIn), toDateOnly(checkOut));
    res.json({ available });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyActiveBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      user: req.user._id,
      status: 'checked-in'
    })
      .populate('room', 'roomNumber type')
      .sort({ createdAt: -1 });

    res.json(booking || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getBookingBill = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room', 'roomNumber type');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const orders = await Order.find({ booking: booking._id });
    const foodTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      booking,
      orders,
      roomTotal: booking.totalAmount,
      foodTotal,
      grandTotal: booking.totalAmount + foodTotal
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const checkoutBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'checked-in') {
      return res.status(400).json({ message: 'Only a checked-in booking can be checked out' });
    }

    booking.status = 'checked-out';
    booking.paymentStatus = 'paid';
    await booking.save();

    await Order.updateMany({ booking: booking._id }, { paymentStatus: 'paid' });
    await Room.findByIdAndUpdate(booking.room, { status: 'available' });

    res.json({ message: 'Guest checked out and bill settled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createBooking,
  createGroupBooking,
  getGroupBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  checkAvailability,
  getMyActiveBooking,
  getBookingBill,
  checkoutBooking,
  cancelConflictingPendingBookings
};