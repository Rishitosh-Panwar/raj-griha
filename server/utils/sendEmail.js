const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'Raj Griha <alerts@rajgriha.com>';

const sendAlertEmail = async (subject, html) => {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
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
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error('Failed to send guest email:', err.message);
  }
};

module.exports = { sendAlertEmail, sendGuestEmail };