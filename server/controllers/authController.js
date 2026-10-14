const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendGuestEmail } = require('../utils/sendEmail');

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

const isValidPassword = (password) => /^(?=.*\d).{8,}$/.test(password);

// Cryptographically secure 6-digit code (Math.random is predictable)
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const OTP_COOLDOWN_MS = 60 * 1000;                   // minimum gap between codes for one account
const UNVERIFIED_LIFETIME_MS = 24 * 60 * 60 * 1000;  // unverified accounts auto-delete after this

const isOnCooldown = (user) =>
  !!user.lastOtpSentAt && Date.now() - new Date(user.lastOtpSentAt).getTime() < OTP_COOLDOWN_MS;
const cleanEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const maskEmail = (email = '') => {
  const [local = '', domain = ''] = String(email).split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};

// Logs the event, client IP and a masked email. Never logs codes, passwords or full addresses.
const logAuth = (req, event, email) => {
  console.log('[AUTH]', JSON.stringify({ event, ip: req.ip, email: maskEmail(email), at: new Date().toISOString() }));
};

const sendOtpEmail = async (toEmail, otp) => {
  try {
    await sendGuestEmail(
      toEmail,
      'Your Raj Griha verification code',
      `<p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`
    );
    return true;
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    return false;
  }
};

// @route POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, password, phone } = req.body;
    const email = cleanEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    if (typeof name !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Invalid input' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include at least one number' });
    }

    let user = await User.findOne({ email });
    if (user && user.emailVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (user && isOnCooldown(user)) {
      return res.status(429).json({ message: 'A code was just sent. Please wait a minute before trying again.' });
    }

    const cleanPhone = typeof phone === 'string' ? phone.trim() : undefined;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const unverifiedExpiresAt = new Date(Date.now() + UNVERIFIED_LIFETIME_MS);

    if (user) {
      user.name = name;
      user.password = hashedPassword;
      user.phone = cleanPhone || user.phone;
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.lastOtpSentAt = new Date();
      user.unverifiedExpiresAt = unverifiedExpiresAt;
      await user.save();
    } else {
      user = await User.create({
        name, email, password: hashedPassword, phone: cleanPhone,
        role: 'customer', emailVerified: false, otp, otpExpires,
        lastOtpSentAt: new Date(), unverifiedExpiresAt
      });
    }

    const emailSent = await sendOtpEmail(email, otp);
    logAuth(req, 'signup-code-requested', email);
    if (!emailSent) {
      return res.status(200).json({
        message: 'Account created, but we couldn\'t send the verification email right now. Please use "Resend code" in a moment.',
        email
      });
    }

    res.status(200).json({ message: 'Verification code sent to your email', email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const otpAttempts = new Map();

const verifyOtp = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const { otp } = req.body;
    if (!email || typeof otp !== 'string' || !otp) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const attemptKey = email;
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
    user.unverifiedExpiresAt = undefined; // real account now: never auto-delete
    await user.save();
    logAuth(req, 'email-verified', email);

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
    const email = cleanEmail(req.body.email);
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Account not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Account already verified' });
    if (isOnCooldown(user)) {
      return res.status(429).json({ message: 'Please wait a minute before requesting another code.' });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.lastOtpSentAt = new Date();
    user.unverifiedExpiresAt = new Date(Date.now() + UNVERIFIED_LIFETIME_MS);
    await user.save();
    otpAttempts.delete(email); // a fresh code gets a fresh set of attempts

    const emailSent = await sendOtpEmail(email, otp);
    logAuth(req, 'resend-code-requested', email);
    if (!emailSent) {
      return res.status(500).json({ message: 'Could not send the email right now — please try again shortly' });
    }

    res.json({ message: 'Verification code resent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const genericResponse = { message: 'If that email is registered, a reset code has been sent' };

    const user = await User.findOne({ email }).select('+password');
    // Unverified accounts never get a reset code. Anyone could create one for an address they
    // don't own, which would turn this form into a second email-sending channel.
    if (!user || !user.emailVerified) return res.json(genericResponse);
    if (isOnCooldown(user)) return res.json(genericResponse);

    if (user.googleId && !user.password) {
      user.lastOtpSentAt = new Date();
      await user.save();
      await sendGuestEmail(
        email,
        'Sign in to Raj Griha with Google',
        `<p>Hi ${user.name},</p>
         <p>Your Raj Griha account uses Google Sign-In, so it doesn't have a password to reset.
         Just choose "Continue with Google" on the login page.</p>`
      );
      logAuth(req, 'reset-google-notice', email);
      return res.json(genericResponse);
    }

    const otp = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.lastOtpSentAt = new Date();
    await user.save();
    otpAttempts.delete(`reset:${email}`);

    await sendOtpEmail(email, otp);
    logAuth(req, 'reset-code-requested', email);
    res.json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const { otp, newPassword } = req.body;
    if (!email || typeof otp !== 'string' || !otp || typeof newPassword !== 'string' || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include at least one number' });
    }

    const attemptKey = `reset:${email}`;
    const attempts = otpAttempts.get(attemptKey) || 0;
    if (attempts >= 5) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
    }

    const user = await User.findOne({ email }).select('+resetPasswordOtp +resetPasswordOtpExpires');
    if (!user || !user.resetPasswordOtp || user.resetPasswordOtp !== otp || user.resetPasswordOtpExpires < new Date()) {
      otpAttempts.set(attemptKey, attempts + 1);
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    otpAttempts.delete(attemptKey);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();
    logAuth(req, 'password-reset', email);

    res.json({ message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const email = cleanEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password || typeof password !== 'string') {
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

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      const emailMatch = await User.findOne({ email: payload.email });

      if (emailMatch && emailMatch.googleId && emailMatch.googleId !== payload.sub) {
        return res.status(409).json({ message: 'This email is linked to a different account. Please contact us for help.' });
      }

      if (emailMatch) {
        if (!emailMatch.emailVerified) {
          emailMatch.password = undefined;
          emailMatch.name = payload.name;
          emailMatch.phone = null;
          emailMatch.otp = undefined;
          emailMatch.otpExpires = undefined;
          emailMatch.resetPasswordOtp = undefined;
          emailMatch.resetPasswordOtpExpires = undefined;
        }
        emailMatch.googleId = payload.sub;
        emailMatch.emailVerified = true;
        emailMatch.unverifiedExpiresAt = undefined; // verified now: never auto-delete
        await emailMatch.save();
        user = emailMatch;
      } else {
        user = await User.create({
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          role: 'customer',
          emailVerified: true
        });
      }
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
const requestEmailChange = async (req, res) => {
  try {
    const newEmail = cleanEmail(req.body.newEmail);
    if (!newEmail) return res.status(400).json({ message: 'New email is required' });
    if (isOnCooldown(req.user)) {
      return res.status(429).json({ message: 'Please wait a minute before requesting another code.' });
    }

    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ message: 'That email is already in use' });

    const otp = generateOtp();
    req.user.pendingEmail = newEmail;
    req.user.emailChangeOtp = otp;
    req.user.emailChangeOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    req.user.lastOtpSentAt = new Date();
    await req.user.save();

    const emailSent = await sendOtpEmail(newEmail, otp);
    logAuth(req, 'email-change-code-requested', newEmail);
    if (!emailSent) {
      return res.status(500).json({ message: 'Could not send the email right now — please try again shortly' });
    }

    res.json({ message: 'Verification code sent to your new email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/change-email/verify
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

module.exports = { signup, verifyOtp, resendOtp, login, googleAuth, logout, getMe, updatePhone, updateProfile, requestEmailChange, verifyEmailChange, forgotPassword, resetPassword };