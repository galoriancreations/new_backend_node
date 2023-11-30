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
  targetAudience = 'Everyone',
}) {
  console.log(
    `Generating challenge with the topic: ${topic} (${days} days, ${tasks} tasks per day, target: ${targetAudience})... This may take a while.`
  );

  const challengeExample = fs.readFileSync(
    'GPT/json/input_challenge_example.json',
    'utf8'
  );

  const response = await strict_output2(
    `You are an advanced AI programmed to generate a multi-day challenge in JSON format, based on the following parameters:
    - Topic: ${topic}
    - Duration: ${days} days
    - Number of Tasks per Day: ${tasks}
    - Language: ${language}
    - Target Audience: ${targetAudience}
  
  The challenge should be structured as a JSON object containing fields: name, days, image, language. The detailed structure is as follows:
  
  1. Name:
     - Title of the challenge.
  
  2. Days Array:
     - An array with each element representing a day in the challenge.
     - Each day includes: introduction, messages, tasks, time, title, image.
     - Ensure content diversity across different days.
  
  3. Image Description:
     - A DALL-E image prompt description related to the overall theme.
  
  4. Language:
     - The language in which the challenge is presented.
  
  Each 'day' object in the days array should include:
     a. Introduction: A brief introduction, emphasizing titles with asterisks.
     b. Time: The specific time for releasing the day's content, in HH:MM:SS format.
     c. Image: A related DALL-E image prompt description.
     d. Messages: An array of messages, each with content and a specific time.
     e. Tasks: An array of tasks, each with emoji, isBonus, options, points, time.

  Each 'task' object in the tasks array should include:
      a. Emoji: A related emoji.
      b. IsBonus: A boolean indicating whether the task is a bonus task.
      c. Options: An array of options, each with text. each option is a task that can be complete.
      d. Points: The number of points awarded for completing the task. (first task of the day is worth 1 points, second task is worth 2 points, third task is worth 3 points, etc.)
  
  The tasks should be engaging, related to ${topic}, and suitable for the ${targetAudience}. The challenge aims to educate and connect people globally.
  
  Ensure the JSON structure is consistent and scalable for the specified number of days and tasks.`,
    // user prompt:
    `Generate a challenge about ${topic}. targeting ${targetAudience}.
    It should span ${days} days with ${tasks} tasks per day.
    The language of the challenge is ${language}.`,
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

  fs.writeFile(
    'GPT/json/challenge_output.json',
    JSON.stringify(response),
    (err) => {
      if (err) return console.error(err);
      else console.log('Output saved to GPT/json/challenge_output.json');
    }
  );

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
