import { Twilio } from 'twilio';

// Set up Twilio API credentials
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNTSID,
  process.env.TWILIO_AUTHTOKEN,
  { accountSid: process.env.TWILIO_ACCOUNTSID }
);

// Function to send an article to a subscriber via WhatsApp
export async function sendMessageViaWhatsApp(
  message: string,
  media: [string],
  fullName: string | undefined,
  phoneNumber: string | number
) {
  const messageObj = {
    from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    to: `whatsapp:${phoneNumber}`,
    body: message,
    mediaUrl: media, // Replace with AI generated image URL
  };

  try {
    return await twilioClient.messages.create(messageObj);
  } catch (error) {
    console.error(
      `Error sending article to ${phoneNumber} (${fullName}): ${
        error instanceof Error ? error.message : 'Something went wrong'
      }`
    );
    return error as Error;
  }
}
