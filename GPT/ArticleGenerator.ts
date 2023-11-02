require('dotenv').config();

import fs from 'fs';
import { strict_image, strict_output } from './strict_output';
import { UsersTest } from '../database';
import schedule from 'node-schedule';
import { sendMessageViaWhatsApp } from '../services/twilio';
import { sendMessageViaEmail } from '../services/nodemailer';
import https from 'https';

export type Article = {
  title: string;
  image: string;
  text: string;
};

// Function to generate an article using the OpenAI CHATGPT-3 API
async function generateArticle({
  topic = 'a topic of your choice',
  wordsCount = 500,
}) {
  console.log('Generating article...');

  const response = (await strict_output(
    `You are a helpful AI that is able to generate articles with title and text, the length of the text should not be more than ${wordsCount} words, store article in a JSON array.`,
    `You are to generate an article about ${topic}.`,
    {
      title: '<title>',
      text: `<text with no more than ${wordsCount} words>`,
    }
    // { verbose: true }
  )) as Article;

  return response;
}

async function generateAndSaveImage(prompt: string) {
  console.log(`Generete image (prompt: ${prompt})`);

  // create image
  const blob = await strict_image(prompt);
  const imageBlob = blob[0].url;

  // download image to local storage
  const imagePath = `GPT/images/${prompt}.jpg`;
  const file = fs.createWriteStream(imagePath);
  https
    .get(imageBlob as string, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Image downloaded as ${prompt}`);
      });
    })
    .on('error', (err) => {
      fs.unlink(imagePath, () => {});
      console.error(`Error downloading image: ${err.message}`);
    });

  return imageBlob;
}

// Function to generate and send articles to subscribers
export async function sendArticle(
  article: Article,
  subscribers: { fullName?: string; phone?: string; email?: string }[]
) {
  console.log(`Sending article to ${subscribers.length} subscribers`);

  // Send the article to each subscriber
  for (const subscriber of subscribers) {
    let messageBuffer = `Sent article to ${subscriber.fullName}`;

    if (subscriber.phone) {
      const message = `Ting Global Weekly Article\nHere's your weekly article:\n\n${article.title}\n\n${article.text}\n\nThis article was generated by Ting Global's AI Article Generator`;
      try {
        const whatsAppMessageResponse = await sendMessageViaWhatsApp(
          message,
          [article.image],
          subscriber.fullName,
          subscriber.phone
        );
        if (whatsAppMessageResponse instanceof Error) {
          throw new Error(
            `Error sending article via WhatsApp to subscriber ${subscriber.fullName} (${subscriber.phone})`
          );
        }

        messageBuffer += ` (Whatsapp: ${subscriber.phone})`;
      } catch (error) {
        console.error(
          `Error sending article to ${subscriber.fullName} (${
            subscriber.phone
          }): ${
            error instanceof Error ? error.message : 'Something went wrong'
          }`
        );
      }
    }

    if (subscriber.email) {
      const message = `<html lang="en">
<head>
<meta charset="utf-8">
    <title>${article.title}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f2f2f2; text-align: center;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px;">
        <header style="text-align: center;">
            <h1 style="font-size: 36px; color: #333;">${article.title}</h1>
        </header>
        <img src="${article.image}" alt="Article Image" style="display: block; margin: auto; max-width: 100%;">
        <p style="font-size: 18px; color: #666; line-height: 1.5; margin-top: 20px;">${article.text}</p>
    </div>
</body>
</html>`;
      try {
        const emailMessageResponse = await sendMessageViaEmail(
          message,
          subscriber.email
        );

        if (emailMessageResponse instanceof Error) {
          throw new Error(
            `Error sending article via email to subscriber ${subscriber.fullName} (${subscriber.email})`
          );
        }
        messageBuffer += ` (email: ${subscriber.email})`;
      } catch (error) {
        console.error(
          `Error sending article to ${subscriber.fullName} (${
            subscriber.phone
          }): ${
            error instanceof Error ? error.message : 'Something went wrong'
          }`
        );
      }
    }
    console.log(messageBuffer);
  }
  console.log('Done sending article to subscribers');
}

const fetchAllArticleSubscribedUsers = async () => {
  const users = await UsersTest.find(
    { articleSubscribed: true },
    { _id: 0, fullName: 1, phone: 1, email: 1 }
  );

  return users;
};

// Function that log all subscribed users that subscribe to article
async function sendArticleToAllSubscribers(
  topic = 'a topic of your choice',
  wordsCount = 100
) {
  const users = await fetchAllArticleSubscribedUsers();

  // Generate article
  const article = await generateArticle({ topic, wordsCount });

  // Take the article from the file generated_article.json for less API calls and testing
  // const article: Article = JSON.parse(
  //   fs.readFileSync('GPT/genereted_article.json', 'utf8')
  // );

  if (article === null) {
    return console.log('Error generating article');
  }

  // Generate image for article
  const image = await generateAndSaveImage(article.title);
  if (!image) {
    return console.log(`Error generating image (prompt: ${article.title})`);
  }
  article.image = image;

  const mappedUsers = users.map((user) => ({
    fullName: user?.fullName,
    phone: user?.phone,
    email: user?.email,
  }));

  sendArticle(article, mappedUsers);
}
sendArticleToAllSubscribers();

// Schedule Article sendArticleToAllSubscribers() to run every Monday at 9:00 AM
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 1; // Monday
rule.hour = 9; // 9:00
rule.minute = 0; // 00 seconds
const job = schedule.scheduleJob(rule, () => sendArticleToAllSubscribers());
console.log('Scheduled article generator job to run every Monday at 9:00');
