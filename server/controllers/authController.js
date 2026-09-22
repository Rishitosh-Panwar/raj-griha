const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const sendAlertEmail = require('../utils/sendEmail'); // reused for generic email sending
const nodemailer = require('nodemailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sendTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

// Password rule: at least 8 characters, at least one digit, no uppercase requirement
const isValidPassword = (password) => /^(?=.*\d).{8,}$/.test(password);

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Sends the OTP directly to the SIGNING-UP USER's email — different from sendAlertEmail,
// which always goes to the hotel's ALERT_EMAIL. This needs its own transporter call.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"Raj Griha" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Raj Griha verification code',
    html: `<p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`,
  });
};

// @route POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include at least one number' });
    }

    let user = await User.findOne({ email });
    if (user && user.emailVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (user) {
      // Existing but unverified — update their details and resend a fresh OTP
      user.name = name;
      user.password = hashedPassword;
      user.phone = phone || user.phone;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      user = await User.create({
        name, email, password: hashedPassword, phone,
        role: 'customer', emailVerified: false, otp, otpExpires
      });
    }

    await sendOtpEmail(email, otp);
    res.status(200).json({ message: 'Verification code sent to your email', email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const otpAttempts = new Map(); // simple in-memory rate limit; resets on server restart

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and code are required' });

    const attemptKey = email.toLowerCase();
    const attempts = otpAttempts.get(attemptKey) || 0;
    if (attempts >= 5) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
    }

    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (!user.otp || user.otp !== otp || user.otpExpires < new Date()) {
      otpAttempts.set(attemptKey, attempts + 1);
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    otpAttempts.delete(attemptKey);
    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Account already verified' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);
    res.json({ message: 'Verification code resent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.googleId && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please continue with Google.' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email first', needsVerification: true, email: user.email });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Missing Google credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        role: 'customer',
        emailVerified: true
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.emailVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  } catch (err) {
    res.status(500).json({ message: 'Google sign-in failed', error: err.message });
  }
};

// @route POST /api/auth/logout
const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', '', { maxAge: 0, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
  res.json({ message: 'Logged out' });
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// @route PUT /api/auth/phone
// used by the booking flow to save a guest's phone number the first time it's collected
const updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!/^\+?[0-9]{7,15}$/.test(phone || '')) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }
    req.user.phone = phone;
    await req.user.save();
    res.json({ phone: req.user.phone });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route PUT /api/auth/profile
// customer — update name and phone, no verification needed
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (name) req.user.name = name;
    if (phone !== undefined) {
      if (phone && !/^\+?[0-9]{7,15}$/.test(phone)) {
        return res.status(400).json({ message: 'Please enter a valid phone number' });
      }
      req.user.phone = phone;
    }
    await req.user.save();
    res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, phone: req.user.phone });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/change-email/request
// customer — sends an OTP to the NEW email address before it's accepted
const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: 'New email is required' });

    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ message: 'That email is already in use' });

    const otp = generateOtp();
    req.user.pendingEmail = newEmail;
    req.user.emailChangeOtp = otp;
    req.user.emailChangeOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await req.user.save();

    await sendOtpEmail(newEmail, otp);
    res.json({ message: 'Verification code sent to your new email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/change-email/verify
// customer — confirms the OTP and actually swaps the email over
const verifyEmailChange = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select('+emailChangeOtp +emailChangeOtpExpires');

    if (!user.pendingEmail || !user.emailChangeOtp) {
      return res.status(400).json({ message: 'No email change in progress' });
    }
    if (user.emailChangeOtp !== otp || user.emailChangeOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailChangeOtp = undefined;
    user.emailChangeOtpExpires = undefined;
    await user.save();

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { signup, verifyOtp, resendOtp, login, googleAuth, logout, getMe, updatePhone, updateProfile, requestEmailChange, verifyEmailChange };