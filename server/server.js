require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.set('trust proxy', 1);

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./controllers/paymentController').razorpayWebhook);

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(o => o.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const makeLimiter = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
    ...extra,
  });

const apiLimiter = makeLimiter(
  15 * 60 * 1000, 1000,
  'Too many requests. Please slow down and try again shortly.'
);

const loginLimiter = makeLimiter(
  15 * 60 * 1000, 10,
  'Too many failed login attempts. Please try again in 15 minutes.',
  { skipSuccessfulRequests: true }
);

const emailSendLimiter = makeLimiter(
  60 * 60 * 1000, 15,
  'Too many requests. Please try again in an hour.'
);

const inquiryLimiter = makeLimiter(
  60 * 60 * 1000, 8,
  'Too many messages sent. Please try again in an hour.'
);

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/signup', emailSendLimiter);
app.use('/api/auth/resend-otp', emailSendLimiter);
app.use('/api/auth/forgot-password', emailSendLimiter);
app.use('/api/auth/change-email/request', emailSendLimiter);
app.use('/api/inquiries', inquiryLimiter);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

app.get('/', (req, res) => {
  res.send('Raj Griha API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));