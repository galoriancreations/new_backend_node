require('dotenv').config();

import fs from 'fs';
import schedule from 'node-schedule';
import { strict_output } from './strict_output';
import { addChallengeToDb } from '../../database';
import { generateRandomString } from '../../services/utils';
import { type Challenge, type ChallengeOutput } from '../types';

export async function generateChallenge({
  topic = 'a topic of your choise',
  minSelections = 3,
  MaxSelections = 5,
}) {
  console.log(
    `Generating challenge (between ${minSelections} to ${MaxSelections} selections)... This may take a while`
  );

  const response: ChallengeOutput = await strict_output(
    `You are a helpful AI that is able to generate a challenge with ${minSelections} to ${MaxSelections} selections,
Selection is a task that the user should do in the challenge.
${/*Each selection contain between 3 to 5 tasks.*/ ''}
You need to create a minimum of ${minSelections} selections at least and maximum of ${MaxSelections} selections.
Each selection should have a day, text, emoji and score.
Some selection should be additional bonus and double bonus selection.
Bonus and double bonus selections should be the last selections in the array.
The bonus and double bonus selection, should starts with 3 collision emojis at the start of the selection text and a capital words at the beginning of the selection text and 3 collision emojis at the end. (for example: 💥💥💥 BONUS 💥💥💥 or 💥💥💥 DOUBLE BONUS 💥💥💥).
You should not add double bonus selection without a bonus selection exists first.
The title of the selection text should contain a title of the selection, like in the exmaple, start and end with *.
The selection should contain emoji to be more attractive to the students.
Each selection should have a score between 1 to 10, depends on the difficulty of the selection.
Keep the selection text short and simple, and don't use the word TASK: or SELECTION: inside the selection text.
Example of 5 selections in a challenge in JSON format:
{
  "name": "International SDG's",
  "selections": [
    {
      "day": "1",
      "text": "*Watch the TED talk* - Jody Williams: A realistic vision for world peace | & reflect on what you saw and share in the discussion group something new that you learned. I invite you to contact members of the challenge group whose phone number ends with the same number as yours and discuss with them the issue of social justice - cool? https://youtu.be/FD6CqD1kV8s",
      "emoji": "🗽",
      "score": "1"
    },
    {
      "day": "2",
      "text": "*Looking Back* - Look back at your task notebook and read all the tasks you have performed. Check to see if you have any gaps in the challenges or anything to add.",
      "emoji": "🔍",
      "score": "3"
    },
    {
      "day": "3",
      "text": "*Sophie's song* - Read the story you will find below at least two or three times and then write down your personal reflections and thoughts in a notebook and even better - share the group if you want everything that comes to your mind to write that fits the spirit of things.",
      "emoji": "👑"
      "score": "3"
    },
    {
      "day": "4",
      "text": "💥💥💥 Bonus 💥💥💥   Players from the same team that will upload a shared video within the next 24 hours, on one of the goals you have been exposed to so far, will recieve bonus points.\n\n* It is possible that one will be in front of the camera and the other will write, produce and accompany.",
      "emoji": "📹"
    },
    {
      "day": "5",
      "text": "💥💥💥 Double Bonus 💥💥💥   Players from different teams that will upload a shared video within the next 24 hours, on one of the goals you have been exposed to so far, will recieve double bonus points.\n\n* It is possible that one will be in front of the camera and the other will write, produce and accompany.",
      "emoji": "🎞️"
    }
  ]
}
The goal of the challenge is to educate and connect people around the world, and to bring the world to be a better place.
Store the challenge in a JSON array.`,
    `You are to generate a challenge about ${topic}.`,
    {
      name: '<challenge name>',
      selections: [
        {
          day: '<task day>',
          text: '<task text>',
          emoji: '<task emoji>',
          score: '<task score>',
        },
      ],
    },
    {
      // verbose: true,
      model: 'gpt-4',
    }
  );

  if (!response) {
    console.error('Error generating challenge');
    return;
  }

  console.log(response);

  const challenge: Challenge = {
    _id: 'c_' + generateRandomString(),
    active: true,
    createdOn: Date.now(),
    creator: 'AI Generated Challenge',
    date: new Date().toLocaleDateString('en-US'),
    declined: false,
    invite: '', // an invite link to telegram challenge group
    isPublic: false,
    scores: [],
    template: '', // check the template idea
    verified: false,
    days: [],
    preMessages: [],
    preDays: [],
    ...response,
  };

  fs.writeFileSync('GPT/challenge_output.json', JSON.stringify(challenge));

  return challenge;
}

async function generateAndAddChallenge() {
  const challenge = await generateChallenge({
    minSelections: 30,
    MaxSelections: 60,
  });
  if (challenge) {
    // addChallengeToDb(challenge);
    console.log('Challenge successfully added to database');
  } else {
    console.error('Error adding challenge to database, challenge is undefined');
  }
}
generateAndAddChallenge();

// // Schedule Article sendArticleToAllSubscribers() to run every Monday at 9:00 AM
// const rule = new schedule.RecurrenceRule();
// rule.dayOfWeek = 1; // Monday
// rule.hour = 9; // 9:00 AM
// rule.minute = 0; // 00 seconds
// const job = schedule.scheduleJob(rule, () => generateChallenge());
// console.log('Scheduled challenge generator job to run every Monday at 9:00 AM');
