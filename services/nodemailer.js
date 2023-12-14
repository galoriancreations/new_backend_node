const nodemailer = require('nodemailer');

// Set up Nodemailer credentials
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send an article to a subscriber via email
async function sendMessageViaEmail(html, to, attachments) {
  const message = {
    from: `${process.env.EMAIL_ADDRESS}`,
    to,
    subject: 'Your Weekly Article',
    html,
    attachments,
  };

  try {
    return await transporter.sendMail(message);
  } catch (error) {
    console.error(
      `Error sending email to ${to}: ${
        error instanceof Error ? error.message : 'Something went wrong'
      }`
    );
    return error;
  }
}
