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
  html: string,
  to: string,
  attachments?: { filename: string; path: string; cid: string }[]
) {
  const message: nodemailer.SendMailOptions = {
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
    return error as Error;
  }
}
