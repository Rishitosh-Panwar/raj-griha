const Room = require('../models/Room');
const Booking = require('../models/Booking');
const cloudinary = require('../config/cloudinary');

const getRooms = async (req, res) => {
  try {
    const { type, minPrice, maxPrice, capacity } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (capacity) filter.capacity = { $gte: Number(capacity) };
    if (minPrice || maxPrice) {
      filter.priceEP = {};
      if (minPrice) filter.priceEP.$gte = Number(minPrice);
      if (maxPrice) filter.priceEP.$lte = Number(maxPrice);
    }

    const rooms = await Room.find(filter).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const createRoom = async (req, res) => {
  try {
    const { roomNumber, type, priceEP, priceCP, priceMAP, capacity, amenities, description } = req.body;

    const existing = await Room.findOne({ roomNumber });
    if (existing) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    const images = (req.files || []).map(file => ({
      url: file.path,
      publicId: file.filename
    }));

    const room = await Room.create({
      roomNumber, type, priceEP, priceCP, priceMAP, capacity,
      amenities: amenities ? JSON.parse(amenities) : [],
      description,
      images
    });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const { roomNumber, type, priceEP, priceCP, priceMAP, capacity, amenities, description, status } = req.body;

    if (roomNumber) room.roomNumber = roomNumber;
    if (type) room.type = type;
    if (priceEP) room.priceEP = priceEP;
    if (priceCP) room.priceCP = priceCP;
    if (priceMAP) room.priceMAP = priceMAP;
    if (capacity) room.capacity = capacity;
    if (amenities) room.amenities = JSON.parse(amenities);
    if (description) room.description = description;
    if (status) room.status = status;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({ url: file.path, publicId: file.filename }));
      room.images.push(...newImages);
    }

    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    for (const img of room.images) {
      await cloudinary.uploader.destroy(img.publicId);
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteRoomImage = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    await cloudinary.uploader.destroy(req.params.publicId);
    room.images = room.images.filter(img => img.publicId !== req.params.publicId);
    await room.save();

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route GET /api/rooms/search
// public — groups physical rooms into bookable "types" with live availability counts
const searchAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, type, capacity, maxPrice, mealPlan } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'checkIn and checkOut are required' });
    }

    const filter = { status: { $ne: 'maintenance' } };
    if (type) filter.type = type;
    if (capacity) filter.capacity = { $gte: Number(capacity) };

    const allRooms = await Room.find(filter);

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const blockedBookings = await Booking.find({
      status: { $in: ['confirmed', 'checked-in'] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate }
    }).select('room');
    const blockedRoomIds = new Set(blockedBookings.map(b => b.room.toString()));

    const availableRooms = allRooms.filter(r => !blockedRoomIds.has(r._id.toString()));

    const groups = {};
    for (const room of availableRooms) {
      const priceField = mealPlan === 'CP' ? 'priceCP' : mealPlan === 'MAP' ? 'priceMAP' : 'priceEP';
      if (maxPrice && room[priceField] > Number(maxPrice)) continue;

      if (!groups[room.type]) {
        groups[room.type] = {
          type: room.type,
          capacity: room.capacity,
          priceEP: room.priceEP,
          priceCP: room.priceCP,
          priceMAP: room.priceMAP,
          amenities: room.amenities,
          images: room.images,
          availableCount: 0,
          sampleRoomId: room._id
        };
      }
      groups[room.type].availableCount += 1;
      if (room.capacity > groups[room.type].capacity) groups[room.type].capacity = room.capacity;
    }

    res.json(Object.values(groups));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getRooms, getRoomById, createRoom, updateRoom, deleteRoom, deleteRoomImage, searchAvailableRooms
};