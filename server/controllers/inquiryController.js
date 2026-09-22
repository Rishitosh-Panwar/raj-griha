const sendAlertEmail = require('../utils/sendEmail');

// @route POST /api/inquiries/room
// public — "Get in Touch" form on Room Details
const sendRoomInquiry = async (req, res) => {
  try {
    const { name, email, phone, roomType, roomNumber, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required' });
    }

    await sendAlertEmail(
      `Room Inquiry — ${roomType || ''} ${roomNumber || ''}`,
      `<h3>New inquiry from ${name}</h3>
       <p><b>Email:</b> ${email}</p>
       <p><b>Phone:</b> ${phone}</p>
       <p><b>Room:</b> ${roomType || 'Not specified'} ${roomNumber ? `(Room ${roomNumber})` : ''}</p>
       ${message ? `<p><b>Message:</b> ${message}</p>` : ''}`
    );

    res.status(200).json({ message: 'Inquiry sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/inquiries/general
// public — Contact page: reservations, events, weddings, general questions
const sendGeneralInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: 'Name, email, phone, and message are required' });
    }

    await sendAlertEmail(
      `Inquiry — ${subject || 'General'}`,
      `<h3>New inquiry from ${name}</h3>
       <p><b>Email:</b> ${email}</p>
       <p><b>Phone:</b> ${phone}</p>
       <p><b>Subject:</b> ${subject || 'Not specified'}</p>
       <p><b>Message:</b> ${message}</p>`
    );

    res.status(200).json({ message: 'Inquiry sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { sendRoomInquiry, sendGeneralInquiry };