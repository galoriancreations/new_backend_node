require('dotenv').config();
const fs = require('fs');
const schedule = require('node-schedule');
const { strict_output2 } = require('./strict_outputJS');
// const { addChallengeToDb } = require('../database/indexJS');

async function generateChallenge({
  creator,
  id,
  topic = 'a topic of your choice',
  days = 2,
  tasks = 2,
  language = 'English',
}) {
  console.log(
    `Generating challenge with the topic: ${topic} (${days} days, ${tasks} tasks)... This may take a while.`
  );

  const challengeExample = fs.readFileSync(
    'GPT/json/input_challenge_example.json',
    'utf8'
  );

  const response = await strict_output2(
    `You are a helpful AI that is able to generate a challenge.
The challenge should be about ${topic}.
The challenge should contain ${days} days.
The challenge should contain ${tasks} tasks.
The challenge should be in English.
The challenge is an array of messages and tasks that the user should do in the challenge.
The challenge contain days, preDays, image.

${/* days[] */ ''}
${/* introduction, messages, tasks, time, title, image */ ''}
days is an array of days that the user should do in the challenge.
each day contain the next fields: introduction, messages, tasks, time, title.
introduction is the introduction of the day. introduction titles marks with *. (*title*).
to enter a new line in the introduction or any other text use \\n.
time is the time that the day should be sent to the user.
title is the title of the day.
image is a text about image prompt to create with dell-e about the topic of the day.

${/* days[] > messages[] */ ''}
${/* content, time */ ''}
messages are an array of messages that the user should read in the challenge.
each field contain the next fields: content, time.
content is the content of the message, time is the time that the message should be sent to the user.

${/* days[] > tasks[] */ ''}
${/* emoji, isBonus, options[], points, time */ ''}
tasks is an array of tasks that the user should do in the challenge,
each task contain the next fields: emoji, isBonus, options, points, time.
emoji is the emoji of the task. to be attractive to the students.
isBonus is a boolean that indicate if the task is a bonus task.
options is an array of options that the user should choose from, each option contain the next fields: text.
Keep the text text short and simple, and don't use the word TASK: or inside the text.
points is the points that the user will get if he choose the option.
time is the time that the task should be sent to the user.
Some tasks should be additional bonus and double bonus selection.

${/* days[] > preDays[] */ ''}
${/* messages[] */ ''}
preDays is an array, each field contain the next fields: messages.
messages is an array of messages that the user should read in the challenge.
The message contain the next fields: time, content.
The time is the time that the message should be sent to the user.
The content is the content of the message.

${/* image */ ''}
image is a text about image prompt to create with dell-e about the topic of the challenge.

Example of a challenge with 3 days and 5 tasks:

${challengeExample}

The goal of the challenge is to educate and connect people around the world, and to bring the world to be a better place.
Store the challenge in a JSON array.
Respond only with the JSON array, and provide the complete JSON tree.
No text outside the JSON.

Don't exceed the 1,190-character limit in the json.`,
    `You are to generate a challenge about ${topic}.`,
    {
      name: '<challenge name>',
      days: [
        {
          introduction: '<introduction>',
          messages: [
            {
              content: '<message>',
              time: '<time>',
            },
          ],
          tasks: [
            {
              emoji: '<emoji>',
              isBonus: false,
              options: [
                {
                  text: '<option>',
                },
              ],
              points: 1,
              time: '<time>',
            },
          ],
          time: '<time>',
          title: '<title>',
        },
      ],
    },
    {
      // verbose: true,
      // model: 'gpt-4',
    }
  );
  
  // for testing
  // const response = JSON.parse(fs.readFileSync('GPT/json/challenge_output.json', 'utf8'));

  if (!response) {
    console.error('Error generating challenge');
    return;
  }

  fs.writeFile('GPT/json/challenge_output.json', JSON.stringify(response), (err) => {
    if (err) return console.error(err);
    else console.log('Output saved to GPT/json/challenge_output.json');
  });
    
  const challenge = {
    _id: id,
    allowsCopies: true,
    creator,
    active: true,
    createdOn: Date.now(),
    date: new Date().toLocaleDateString('en-GB'),
    declined: false,
    // invite: '', // an invite link to telegram challenge group
    isPublic: false,
    scores: [],
    verified: false,
    days: [],
    preMessages: [],
    preDays: [],
    language,
    ...response,
  };

  return challenge;
}

// // Schedule Article sendArticleToAllSubscribers() to run every Monday at 9:00 AM
// const rule = new schedule.RecurrenceRule();
// rule.dayOfWeek = 1; // Monday
// rule.hour = 9; // 9:00 AM
// rule.minute = 0; // 00 seconds
// const job = schedule.scheduleJob(rule, () => generateChallenge());
// console.log('Scheduled challenge generator job to run every Monday at 9:00 AM');

module.exports = { generateChallenge };
