const express = require('express');
const router = express.Router();
const { signup, verifyOtp, resendOtp, login, googleAuth, logout, getMe, updatePhone, updateProfile, requestEmailChange, verifyEmailChange } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/phone', protect, updatePhone);
router.put('/profile', protect, updateProfile);
router.post('/change-email/request', protect, requestEmailChange);
router.post('/change-email/verify', protect, verifyEmailChange);

module.exports = router;