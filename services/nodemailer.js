const nodemailer = require("nodemailer");

// Set up Nodemailer credentials
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Sends an email via Nodemailer
 * @param {string} html - HTML content of the email
 * @param {string} to - Email address of the recipient
 * @param {string} subject - Subject of the email
 * @param {array} attachments - Array of attachments
 * @returns {Promise} Promise representing the result of sending the email
 */
exports.sendEmail = async ({ html, to, subject, attachments }) => {
  const message = {
    from: `${process.env.EMAIL_ADDRESS}`,
    to,
    subject,
    html,
    attachments
  };

  try {
    return await transporter.sendMail(message);
  } catch (error) {
    console.error(
      `Error sending email to ${to}: ${
        error instanceof Error ? error.message : "Something went wrong"
      }`
    );
    return error;
  }
};
