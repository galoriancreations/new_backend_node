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

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

type Article = {
  title: string;
  image: string;
  text: string;
};

// Define a function to generate an article using the OpenAI CHATGPT-3 API
async function generateArticle({
  topic = 'a topic of your choice',
  wordsCount = 500,
}) {
  console.log('Generating article...');
  const response = await strict_output(
    `You are a helpful AI that is able to generate articles with title image and text, the length of the text should not be more than ${wordsCount} words, store article in a JSON array`,
    `Write an article about: ${topic}.`,
    {
      title: 'title',
      image: 'a link to relative image start with https://',
      text: `text not more than ${wordsCount} words`,
    }
  );

  console.log('GPT Response:');
  console.log(response);

  return response;
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = '',
  output_value_only: boolean = false,
  model: string = 'gpt-3.5-turbo',
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
): Promise<Article | null> {
  // if the user input is in a list, we also process the output as a list of json
  const list_input: boolean = Array.isArray(user_prompt);
  // if the output format contains dynamic elements of < or >, then add to the prompt to handle dynamic elements
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  // if the output format contains list elements of [ or ], then we add to the prompt to handle lists
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  // start off with no error message
  let error_msg: string = '';

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    // if output_format contains dynamic elements, process it accordingly
    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    // if input is in a list format, ask it to generate json in a list
    if (list_input) {
      output_format_prompt += `\nGenerate a list of json, one json for each input element.`;
    }

    // Use OpenAI to get a response
    const response = await openai.chat.completions.create({
      temperature: temperature,
      model: model,
      messages: [
        {
          role: 'system',
          content: system_prompt + output_format_prompt + error_msg,
        },
        { role: 'user', content: user_prompt.toString() },
      ],
    });

    let res: string =
      response.choices[0].message?.content?.replace(/'/g, '"') ?? '';

    // ensure that we don't replace away apostrophes in text
    res = res.replace(/(\w)"(\w)/g, "$1'$2");

    if (verbose) {
      console.log(
        'System prompt:',
        system_prompt + output_format_prompt + error_msg
      );
      console.log('\nUser prompt:', user_prompt);
      console.log('\nGPT response:', res);
    }

    // try-catch block to ensure output format is adhered to
    try {
      let output: any = JSON.parse(res);

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error('Output format not in a list of json');
        }
      } else {
        output = [output];
      }

      // check for each element in the output_list, the format is correctly adhered to
      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          // unable to ensure accuracy of dynamic output header, so skip it
          if (/<.*?>/.test(key)) {
            continue;
          }

          // if output field missing, raise an error
          if (!(key in output[index])) {
            throw new Error(`${key} not in json output`);
          }

          // check that one of the choices given for the list of words is an unknown
          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            // ensure output is not a list
            if (Array.isArray(output[index][key])) {
              output[index][key] = output[index][key][0];
            }
            // output the default category (if any) if GPT is unable to identify the category
            if (!choices.includes(output[index][key]) && default_category) {
              output[index][key] = default_category;
            }
            // if the output is a description format, get only the label
            if (output[index][key].includes(':')) {
              output[index][key] = output[index][key].split(':')[0];
            }
          }
        }

        // if we just want the values for the outputs
        if (output_value_only) {
          output[index] = Object.values(output[index]);
          // just output without the list if there is only one element
          if (output[index].length === 1) {
            output[index] = output[index][0];
          }
        }
      }

      return list_input ? output : output[0];
    } catch (e) {
      error_msg = `\n\nResult: ${res}\n\nError message: ${e}`;
      console.log('An exception occurred:', e);
      console.log('Current invalid json format:', res);
    }
  }

  return null;
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
  if (article === null) {
    return console.log('Error generating article');
  }
  const articleString = JSON.stringify(article);
  fs.writeFile('genereted_article.json', articleString, (err) => {
    if (err) throw err;
    console.log('The article has been saved in file article_chatgpt.json!');
  });
  return article;
}
generateArticleFile();

// Define a function to send an article to a subscriber via WhatsApp
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

// Define a function to send an article to a subscriber via email
async function sendArticleViaEmail(article: Article, emailAddress: string) {
  const message = {
    from: 'YOUR_EMAIL_ADDRESS',
    to: emailAddress,
    subject: 'Your Weekly Article',
    text: JSON.stringify(article),
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
  const article = await generateArticle({ wordsCount: 100 });
  if (article === null) {
    return console.log('Error generating article');
  }

  // Take the article from the file generated_article.txt for less API calls and testing
  // const article = fs.readFileSync('genereted_article.txt', 'utf8');

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
// generateAndSendArticles();

// Schedule the generateAndSendArticles function to run every Monday at 9:00 AM
/*
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 1; // Monday
rule.hour = 9; // 9:00 AM
rule.minute = 0; // 00 seconds
const job = schedule.scheduleJob(rule, generateAndSendArticles);
console.log('Scheduled job to run every Monday at 9:00 AM');
*/
