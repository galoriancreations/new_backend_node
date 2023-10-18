import nodemailer from 'nodemailer';

// Set up Nodemailer credentials
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send an article to a subscriber via email
export async function sendMessageViaEmail(
  messageHtml: string,
  emailAddress: string,
  text = ''
) {
  const message = {
    from: `${process.env.EMAIL_ADDRESS}`,
    to: emailAddress,
    subject: 'Your Weekly Article',
    text: JSON.stringify(text),
    html: messageHtml,
  };

  try {
    return await transporter.sendMail(message);
  } catch (error) {
    console.error(
      `Error sending email to ${emailAddress}: ${
        error instanceof Error ? error.message : 'Something went wrong'
      }`
    );
    return error;
  }
}
