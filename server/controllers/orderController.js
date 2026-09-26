const Order = require('../models/Order');
const Booking = require('../models/Booking');
const MenuItem = require('../models/MenuItem');
const { sendAlertEmail } = require('../utils/sendEmail');

const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const activeBooking = await Booking.findOne({ user: req.user._id, status: 'checked-in' })
      .populate('room', 'roomNumber type');

    if (!activeBooking) {
      return res.status(403).json({ message: 'You need to be checked in to place an order' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const entry of items) {
      const menuItem = await MenuItem.findById(entry.menuItemId);
      if (!menuItem || !menuItem.available) {
        return res.status(400).json({ message: `${menuItem?.name || 'An item'} is no longer available` });
      }
      const quantity = Math.max(1, Number(entry.quantity) || 1);
      totalAmount += menuItem.price * quantity;
      orderItems.push({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity });
    }

    const order = await Order.create({
      user: req.user._id,
      booking: activeBooking._id,
      items: orderItems,
      totalAmount,
      source: 'online'
    });

    const itemsHtml = orderItems.map(i => `<li>${i.quantity} × ${i.name} — ₹${i.price * i.quantity}</li>`).join('');
    await sendAlertEmail(
      `New Food Order — Room ${activeBooking.room.roomNumber}`,
      `<h3>New order from ${req.user.name}</h3>
       <p><b>Room:</b> ${activeBooking.room.type} ${activeBooking.room.roomNumber}</p>
       <ul>${itemsHtml}</ul>
       <p><b>Total: ₹${totalAmount}</b></p>`
    );

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .populate('user', 'name')
      .populate({ path: 'booking', populate: { path: 'room', select: 'roomNumber type' } })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/orders/offline
// admin — for walk-in / in-person orders, added to a guest's tab
const createOfflineOrder = async (req, res) => {
  try {
    const { bookingId, items } = req.body;

    if (!bookingId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Booking and items are required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    let totalAmount = 0;
    const orderItems = [];

    for (const entry of items) {
      const menuItem = await MenuItem.findById(entry.menuItemId);
      if (!menuItem) return res.status(400).json({ message: 'Invalid menu item' });
      const quantity = Math.max(1, Number(entry.quantity) || 1);
      totalAmount += menuItem.price * quantity;
      orderItems.push({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity });
    }

    const order = await Order.create({
      user: booking.user,
      booking: booking._id,
      items: orderItems,
      totalAmount,
      source: 'offline',
      status: 'served' // offline orders are logged after the fact, already served
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route GET /api/orders/booking/:bookingId
// admin — all orders tied to one stay, for the checkout bill
const getOrdersForBooking = async (req, res) => {
  try {
    const orders = await Order.find({ booking: req.params.bookingId }).sort({ createdAt: 1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus, createOfflineOrder, getOrdersForBooking };