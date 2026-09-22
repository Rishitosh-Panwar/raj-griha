const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendAlertEmail = async (subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Raj Griha Alerts" <${process.env.EMAIL_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    // Log but never let an email failure break the actual booking/order flow
    console.error('Failed to send alert email:', err.message);
  }
};

const sendGuestEmail = async (toEmail, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Raj Griha" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error('Failed to send guest email:', err.message);
  }
};

module.exports = { sendAlertEmail, sendGuestEmail };