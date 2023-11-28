require('dotenv').config();
const fs = require('fs');
const schedule = require('node-schedule');
const { strict_output2 } = require('./strict_output');
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
    `You are a helpful AI tasked with generating a challenge in JSON format. The challenge is based on the following parameters:
    - Topic: ${topic}
    - Duration: ${days} days
    - Number of Tasks: ${tasks}
    - Language: ${language}
    
    The challenge will be structured as a JSON array containing fields: name, days, preDays, image. Here are the specifications for each section:
    
    1. Days Array: 
       - Each day includes: introduction, messages, tasks, time, title, image.
       - Introduction: A brief intro with titles marked as (*title*). Use '\\n' for new lines.
       - Time: When to send the day's content to the user.
       - Image: A description for a DALL-E image prompt related to the day's topic.
    
    2. Messages Array:
       - Content: The message text.
       - Time: When to send the message to the user.
    
    3. Tasks Array:
       - Each task includes: emoji, isBonus, options, points, time.
       - Emoji: To make the task visually appealing.
       - isBonus: Boolean indicating if it's a bonus task.
       - Options: Short, simple choices without the word 'TASK:'.
       - Points: Points awarded for completing the task.
    
    4. PreDays Array:
       - Messages to be read before the challenge starts.
    
    5. Image Description:
       - A text prompt for creating a DALL-E image about the challenge topic.
    
    Example Challenge with 3 days and 2 tasks per day (total of 6 tasks):
    ${challengeExample}
    
    The goal is to educate and connect people globally, making the world better.

    Respond only in JSON format within a 1,190-character limit.`,
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
