const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: {
    type: String,
    required: function () { return !this.googleId; }, // Google users don't need a password
    minlength: 8,
    select: false
  },
  role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
  phone: { type: String, trim: true, default: null },
  department: { type: String, trim: true },
  googleId: { type: String, default: null },
  emailVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  pendingEmail: { type: String, default: null },
emailChangeOtp: { type: String, select: false },
emailChangeOtpExpires: { type: Date, select: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);