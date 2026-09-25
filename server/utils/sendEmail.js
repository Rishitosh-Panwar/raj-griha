const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4, // force IPv4 — Render's network can't reach Gmail over IPv6
  connectionTimeout: 10000, // fail within 10s instead of hanging for minutes
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