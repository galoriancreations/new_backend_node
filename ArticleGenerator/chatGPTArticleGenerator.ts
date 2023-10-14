require('dotenv').config();

import fs from 'fs';
import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import { Article, strict_output } from './strict_output';
// import schedule from 'node-schedule';

// Set up Twilio API credentials
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNTSID,
  process.env.TWILIO_AUTHTOKEN,
  { accountSid: process.env.TWILIO_ACCOUNTSID }
);

// Set up Nodemailer credentials
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to generate an article using the OpenAI CHATGPT-3 API
async function generateArticle({
  topic = 'a topic of your choice',
  wordsCount = 500,
}) {
  console.log('Generating article...');
  const response = await strict_output(
    `You are a helpful AI that is able to generate articles with title image and text, the length of the text should not be more than ${wordsCount} words, store article in a JSON array`,
    `You are to generate an article about ${topic}.`,
    {
      title: 'title',
      image: 'a link to relative image start with https://',
      text: `text not more than ${wordsCount} words`,
    },
    { verbose: true }
  );

  console.log('GPT Response:');
  console.log(response);

  return response;
}

// Function to send an article to a subscriber via WhatsApp
async function sendArticleViaWhatsApp(
  article: Article,
  phoneNumber: string | number
) {
  const articleString = JSON.stringify(article);
  console.log('Article string:', articleString);

  const message = `Here's your weekly article:\n\n${articleString}`;
  const response = await twilioClient.messages.create({
    body: message,
    from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    to: `whatsapp:${phoneNumber}`,
  });
  console.log(response);
}

// Function to send an article to a subscriber via email
async function sendArticleViaEmail(article: Article, emailAddress: string) {
  const message = {
    from: `${process.env.EMAIL_ADDRESS}`,
    to: emailAddress,
    subject: 'Your Weekly Article',
    text: JSON.stringify(article),
    html: `<html>
    <head>
        <meta charset="utf-8">
        <title>${article.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f2f2f2;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px;">
            <header style="text-align: center;">
                <h1 style="font-size: 36px; color: #333;">${article.title}</h1>
            </header>
            <img src="${article.image}" alt="Article Image" style="display: block; margin: 0 auto; max-width: 100%;">
            <p style="font-size: 18px; color: #666; line-height: 1.5; margin-top: 20px;">${article.text}</p>
        </div>
    </body>
</html>`,
  };
  await transporter.sendMail(message);
}

// Function to generate and send articles to subscribers
async function generateAndSendArticles() {
  // Get a list of subscribers from a database or other source
  const subscribers = [
    {
      name: 'John Doe',
      phoneNumber: '+972521234567',
      emailAddress: 'example@mail.com',
      // name: 'Barel Shraga',
      // phoneNumber: '+972525444634',
      // emailAddress: 'barel123133@gmail.com',
    },
  ];

  // Generate article
  const article = await generateArticle({ wordsCount: 100 });
  // Take the article from the file generated_article.json for less API calls and testing
  // const article: Article = JSON.parse(
  //   fs.readFileSync('ArticleGenerator/genereted_article.json', 'utf8')
  // );
  if (article === null) {
    return console.log('Error generating article');
  }

  // Send the article to each subscriber
  for (const subscriber of subscribers) {
    try {
      // await sendArticleViaWhatsApp(article, subscriber.phoneNumber);
      await sendArticleViaEmail(article, subscriber.emailAddress);
      console.log(`Article sent to ${subscriber.name}`);
    } catch (error) {
      console.error(
        `Error sending article to ${subscriber.name}: ${
          error instanceof Error ? error.message : 'Something went wrong'
        }`
      );
    }
  }
}
generateAndSendArticles();

// Schedule the generateAndSendArticles function to run every Monday at 9:00 AM
/*
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 1; // Monday
rule.hour = 9; // 9:00 AM
rule.minute = 0; // 00 seconds
const job = schedule.scheduleJob(rule, generateAndSendArticles);
console.log('Scheduled job to run every Monday at 9:00 AM');
*/
