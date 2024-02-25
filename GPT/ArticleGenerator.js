require('dotenv').config();

const schedule = require('node-schedule');
const { UsersTest } = require('../database/indexJS');
const { sendMessageViaEmail } = require('../services/nodemailer');
// const { sendMessageViaWhatsApp } = require('../services/twilio');
const { strict_image, strict_output } = require('./strict_output');
const { downloadImage } = require("../utils/files");

/**
 * Generates an article based on the given topic and word count.
 * @param {Object} options - The options for generating the article.
 * @param {string} options.topic - The topic of the article.
 * @param {number} options.wordsCount - The desired word count for the article.
 * @returns {Promise<Object>} - A promise that resolves to the generated article.
 */
async function generateArticle({
  topic = 'a topic of your choice',
  wordsCount = 500,
}) {
  console.log('Generating article...');

  const response = await strict_output(
    `You are a helpful AI that is able to generate articles with title, imagePrompt and text.
The length of the text should not be more than ${wordsCount} words.
The imagePrompt should be a prompt for the AI to generate an image that is related to the article.
Topics for articles can be about environmental awareness, cultural understanding, mindfulness, art, history, science, community service, and global issues awareness and more.`,
    `You are to generate an article about ${topic}.`,
    {
      title: '<title>',
      imagePrompt: '<image prompt>',
      text: `<text with no more than ${wordsCount} words>`,
    }
  );

  return response;
}

/**
 * Generates and saves an image based on the given prompt.
 *
 * @param {string} prompt - The prompt for generating the image.
 * @returns {Promise<string|null>} - A promise that resolves to the path of the downloaded image, or null if there was an error generating the image.
 */
async function generateAndSaveImage(prompt) {
  console.log(`Genereting image (prompt: ${prompt})`);

  // create image
  const [image] = await strict_image(prompt);
  const imageUrl = image.url;
  if (!imageUrl) {
    console.error('Error generating image');
    return null;
  }

  // download image to local storage
  const downloadPath = `./temp/${prompt}.jpeg`;
  const downloadPathRes = await downloadImage({ imageUrl, downloadPath });
  return downloadPathRes;
}

/**
 * Sends an article to subscribers via WhatsApp and email.
 * @param {Object} article - The article to be sent.
 * @param {Array} subscribers - The list of subscribers.
 * @param {string} subscribers.fullName - The full name of the subscriber.
 * @param {string} subscribers.phone - The phone number of the subscriber.
 * @param {string} subscribers.email - The email address of the subscriber.
 * @returns {Promise<void>} - A promise that resolves when the article has been sent to all subscribers.
 */
async function sendArticle(article, subscribers = { fullName, phone, email }) {
  console.log(`Sending article to ${subscribers.length} subscribers`);

  // Send the article to each subscriber
  for (const subscriber of subscribers) {
    let messageBuffer = `Sent article to ${subscriber.fullName}`;

    // Switching to Telegram
    // do nothing for now.
    if (false) {
      // if (subscriber.phone) {
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
      const imageName = 'article.jpg';
      const message = `
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${article.title}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f2f2f2;">
    <div style="margin: 0 auto; background-color: #fff; padding: 20px;">
        <header style="text-align: center;">
            <h1 style="font-size: 36px; color: #333;">${article.title}</h1>
        </header>
        <img src="cid:${imageName}" alt="Article Image" style="display: block; margin: auto; max-width: 400px;">
        <p style="text-align: center; font-size: 18px; color: #666; line-height: 1.5; margin-top: 20px;">${article.text}</p>
        <p style="margin-top: 30px; font-size: 14px; color: #999;">This article was generated by Ting Global's AI Article Generator</p>
    </div>
</body>
</html>`;
      try {
        const emailMessageResponse = await sendMessageViaEmail(
          message,
          subscriber.email,
          [{ filename: imageName, path: article.image, cid: imageName }]
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

/**
 * Sends an article to all subscribers.
 *
 * @param {string} [topic='a topic of your choice'] - The topic of the article.
 * @param {number} [wordsCount=100] - The number of words in the article.
 * @returns {void}
 */
async function sendArticleToAllSubscribers(
  topic = 'a topic of your choice',
  wordsCount = 100
) {
  const users = await fetchAllArticleSubscribedUsers();

  // Generate article
  const articleOutput = await generateArticle({ topic, wordsCount });

  // Take the article from the file generated_article.json for less API calls and testing
  // const article: Article = JSON.parse(
  //   fs.readFileSync('GPT/json/genereted_article.json', 'utf8')
  // );

  if (articleOutput === null) {
    return console.log('Error generating article');
  }

  // Generate image for article
  const image = await generateAndSaveImage(articleOutput.imagePrompt);
  if (!image) {
    return console.log(
      `Error generating image (prompt: ${articleOutput.imagePrompt})`
    );
  }
  const article = {
    title: articleOutput.title,
    text: articleOutput.text,
    image,
  };

  const mappedUsers = users.map((user) => ({
    fullName: user?.fullName,
    phone: user?.phone,
    email: user?.email,
  }));

  sendArticle(article, mappedUsers);
}

let job;
/**
 * Schedules an article generator job to run at a specified day and time.
 * If a job is already scheduled, it will be cancelled before scheduling a new one.
 * @param {number} [dayOfWeek=1] - The day of the week to run the job (0-6, where 0 is Sunday and 6 is Saturday).
 * @param {number} [hour=9] - The hour of the day to run the job (0-23).
 * @param {number} [minute=0] - The minute of the hour to run the job (0-59).
 * @returns {Promise<void>} - A promise that resolves when the job is scheduled.
 */
const scheduleArticleJob = async (dayOfWeek = 1, hour = 9, minute = 0) => {
  if (job) {
    job.cancel();
    console.log('Cancelled previous article generator job');
  } else {
    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = dayOfWeek; // 1: Monday
    rule.hour = hour; // 9: 9:00
    rule.minute = minute; // 0: 00 seconds
    job = schedule.scheduleJob(rule, () => sendArticleToAllSubscribers());
    console.log('Scheduled article generator job to run every Monday at 9:00');
  }
};

module.exports = {
  scheduleArticleJob,
  sendArticleToAllSubscribers,
  sendArticle,
};
