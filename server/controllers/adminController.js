const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

// @route GET /api/admin/stats
// admin only
const getStats = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const totalBookings = await Booking.countDocuments();

    const revenueAgg = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const totalCustomers = await User.countDocuments({ role: 'customer' });

    const recentBookings = await Booking.find()
      .populate('user', 'name')
      .populate('room', 'roomNumber type')
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      totalRooms,
      occupiedRooms,
      occupancyRate,
      totalBookings,
      totalRevenue,
      totalCustomers,
      recentBookings
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getStats };