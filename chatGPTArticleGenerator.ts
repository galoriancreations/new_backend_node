require('dotenv').config();

import OpenAI from 'openai';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
// import schedule from 'node-schedule';

// Need to set up OpenAI API credentials
const openai = new OpenAI({
  // organization: "YOUR_ORG_ID",
  apiKey: process.env.OPENAI_API_KEY,
});

// Set up Twilio API credentials
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNTSID,
  process.env.TWILIO_AUTHTOKEN,
  { accountSid: process.env.TWILIO_ACCOUNTSID }
);

// Set up Nodemailer credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Define a function to generate an article using the OpenAI CHATGPT-3 API
async function generateArticle({
  topic = 'a topic of your choice',
  wordsCount = 500,
}) {
  console.log('generateArticle');

  const prompt = `Write an article about: ${topic}.
  The article should have a title, image, and text.
  The text of the article should be at ${wordsCount} words.
  The image should be a link to a related image that starts with https://.`;
  console.log('prompt:', prompt);

  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
  });

  console.log('response');
  console.log(response);

  return response.choices[0].message.content!;
}

// define a function to genereate an article when click on button and log it
async function generateArticleLog() {
  const article = await generateArticle({ wordsCount: 100 });
  console.log(article);
  return article;
}
// generateArticleLog();

// define a function to genereate an article and save it in a file via fs
async function generateArticleFile() {
  const article = await generateArticle({ wordsCount: 100 });
  fs.writeFile('genereted_article.txt', article, (err) => {
    if (err) throw err;
    console.log('The article has been saved in file article_chatgpt.txt!');
  });
  return article;
}
// generateArticleFile();

// Define a function to send an article to a subscriber via WhatsApp
async function sendArticleViaWhatsApp(
  article: string,
  phoneNumber: string | number
) {
  const message = `Here's your weekly article:\n\n${article}`;
  const response = await twilioClient.messages.create({
    body: message,
    from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    to: `whatsapp:${phoneNumber}`,
  });
  console.log(response);
}

// Define a function to send an article to a subscriber via email
async function sendArticleViaEmail(article: string, emailAddress: string) {
  const message = {
    from: 'YOUR_EMAIL_ADDRESS',
    to: emailAddress,
    subject: 'Your Weekly Article',
    text: article,
  };
  await transporter.sendMail(message);
}

// Define a function to generate and send articles to subscribers
async function generateAndSendArticles() {
  // Get a list of subscribers from a database or other source
  const subscribers = [
    {
      name: 'John Doe',
      phoneNumber: '+972521234567',
      // phoneNumber: '+972525444634',
      emailAddress: 'example@mail.com', // Need to set up Nodemailer credentials
    },
  ];

  // Generate an article
  // const article = await generateArticle({ wordsCount: 100 });

  // Take the article from the file generated_article.txt for less API calls and testing
  const article = fs.readFileSync('genereted_article.txt', 'utf8');

  // Send the article to each subscriber
  for (const subscriber of subscribers) {
    try {
      await sendArticleViaWhatsApp(article, subscriber.phoneNumber);
      // Need to set up Nodemailer credentials
      // await sendArticleViaEmail(article, subscriber.emailAddress);
      console.log(`Article sent to ${subscriber.name}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Error sending article to ${subscriber.name}: ${error.message}`
        );
      } else {
        console.error(`Error sending article to ${subscriber.name}`);
      }
    }
  }
}
generateAndSendArticles();

/*
// Schedule the generateAndSendArticles function to run every Monday at 9:00 AM
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 1; // Monday
rule.hour = 9; // 9:00 AM
rule.minute = 0; // 00 seconds
const job = schedule.scheduleJob(rule, generateAndSendArticles);
console.log('Scheduled job to run every Monday at 9:00 AM');
*/
