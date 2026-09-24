require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

connectDB();

const app = express();

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