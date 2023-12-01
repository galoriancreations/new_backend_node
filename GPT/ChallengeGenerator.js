require('dotenv').config();
const fs = require('fs');
const { strict_output2 } = require('./strict_output');
// const { addChallengeToDb } = require('../database/indexJS');

async function generateChallenge({
  creator,
  id,
  topic = 'a topic of your choice',
  days = 2,
  tasks = 5,
  messages = 0,
  preDays = 0,
  preMessagesPerDay = 0,
  language = 'English',
  targetAudience = 'Everyone',
}) {

  console.log(`Generating challenge about: ${topic}... this may take a few minutes, depending on the parameters.
(${days} days, ${tasks} tasks per day, ${messages} messages per day, ${preDays} preDays, ${preMessagesPerDay} messages per preDay, lang: ${language}, target: ${targetAudience})`);
  
  const challengeExample = fs.readFileSync(
    'GPT/json/input_challenge_example.json',
    'utf8'
  );

  const response = await strict_output2(
    `You are an advanced AI programmed to generate a multi-day challenge in JSON format, based on the following parameters:
Topic: ${topic}
Days: ${days}
Tasks/Day: ${tasks}
Messages/Day: ${messages}
PreDays: ${preDays}, with messages
PreMessages/PreDay: ${preMessagesPerDay}
Language: ${language}
Audience: ${targetAudience}

The challenge should be structured as a JSON object containing fields: name, days, image, language. The detailed structure is as follows:

1. 'name':
- Title of the challenge. no more than 21 characters.

2. 'days':
- An array with each element representing a day in the challenge.
- Each day includes: introduction, messages, tasks, time, title, image.
- Ensure content diversity across different days.

Each 'day' object in the days array should include:
a. Introduction: A brief introduction.
b. Time: The specific time for releasing the day's content, in HH:MM:SS format.
c. Image: Description of the image.
d. Messages: An array of messages, each with content and a specific time.
e. Tasks: An array of tasks, each with emoji, isBonus, options, points, time.

Each 'task' object in the tasks array should include:
a. Emoji: A related emoji.
b. IsBonus: A boolean indicating whether the task is a bonus task.
c. Options: An array of tasks, each with text. (1 task)
d. Points: The number of points awarded for completing the task. (first task of the day is worth 1 points, second task of the same day is worth 2 points etc.)

3. 'preDays':
- An array with each element representing the days before the challenge starts.
- Each pre day includes: messages.
- Each message includes: content, time.

4. 'image':
- Prompt description a related image to the overall theme.

5. 'language':
- The language in which the challenge is presented.

The tasks should be engaging, creative, collaborative wth other participants, related to ${topic}, and suitable for the ${targetAudience}. The challenge aims to educate and connect people globally.

Ensure the JSON structure is consistent and scalable for the specified number of days and tasks.

Emphasize text with asterisks.`,
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
    preDays: [],
    language,
    ...response,
  };

  return challenge;
}

module.exports = { generateChallenge };
