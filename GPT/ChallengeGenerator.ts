require('dotenv').config();

import fs from 'fs';
import { strict_output } from './strict_output';
import schedule from 'node-schedule';
import { generateRandomString } from '../services/utils';
import { addChallengeToDb } from '../database';

type FluidObject = {
  [key: string]: {
    [key: string]: string;
  };
};

export type ChallengeOutput = {
  name: string;
  selections: FluidObject;
};

export type Challenge = ChallengeOutput & {
  _id: string;
  active: boolean;
  createdOn: Number;
  creator: string;
  date: string;
  declined: Boolean;
  invite: string;
  isPublic: Boolean;
  scores: FluidObject;
  channels: FluidObject;
  template: string;
  verified: Boolean;
  days: any[];
  preMessages: any[];
  preDays: any[];
};

export async function generateChallenge(topic = 'a topic of your choise') {
  console.log('Generating challenge... This may take a while');

  const response = (await strict_output(
    `You are a helpful AI that is able to generate challenge with number of selections (5 to 20 selections),
Each selection contain between 3 and 5 tasks.
Some selection should have additional bonus and double bonus tasks.
The bonus and double bonus tasks starts with 3 collision emojis at the start of the text and a capital words
at the beginning of the task and 3 collision emojis at the end. (for example: 💥💥💥 BONUS 💥💥💥 or 💥💥💥 DOUBLE BONUS 💥💥💥).
You should not add double bonus tasks without bonus tasks exists first at the same selection.
The text of the tasks should contain a title of the task, like in the exmaple, start and end with *.
The text of the tasks should contain emojis and text to be more attractive to students.
Keep the tasks short and simple, and don't use the word TASK: inside the task text.
Example of a selection in a challenge:
{
    "name": "International SDG's",
    "selections": {
      "1": {
          "1": "*Watch the TED talk* - Jody Williams: A realistic vision for world peace | & reflect on what you saw and share in the discussion group something new that you learned. I invite you to contact members of the challenge group whose phone number ends with the same number as yours and discuss with them the issue of social justice - cool? https://youtu.be/FD6CqD1kV8s | 🗽",
          "2": "*Looking Back* - Look back at your task notebook and read all the tasks you have performed. Check to see if you have any gaps in the challenges or anything to add. | 🔍",
          "3": "*Sophie's song* - Read the story you will find below at least two or three times and then write down your personal reflections and thoughts in a notebook and even better - share the group if you want everything that comes to your mind to write that fits the spirit of things. | 👑",
          "4": "💥💥💥 Bonus 💥💥💥   Players from the same team that will upload a shared video within the next 24 hours, on one of the goals you have been exposed to so far, will recieve bonus points.\n\n* It is possible that one will be in front of the camera and the other will write, produce and accompany.",
          "5": "💥💥💥 Double Bonus 💥💥💥   Players from different teams that will upload a shared video within the next 24 hours, on one of the goals you have been exposed to so far, will recieve double bonus points.\n\n* It is possible that one will be in front of the camera and the other will write, produce and accompany."
      },
    }
}
The goal of the challenge is to educate and connect people around the world, and to bring the world to be a better place.
Store the challenge in a JSON array.`,
    `You are to generate a challenge about ${topic}.`,
    {
      name: 'challenge name',
      selections: {
        selectionNumber: {
          taskNumber: 'task text',
        },
      },
    },
    { verbose: true }
  )) as ChallengeOutput;

  if (!response) {
    console.error('Error generating challenge');
    return;
  }

  console.log(response);

  const challenge = {
    _id: 'c_' + generateRandomString(),
    active: true,
    createdOn: Date.now(),
    creator: 'AI Generated Challenge',
    date: new Date().toLocaleDateString('en-US'),
    declined: false,
    invite: 'AI Generated Challenge', // an invite link to telegram challenge group
    isPublic: true,
    scores: {},
    channels: {},
    template: '', // check the template idea
    verified: false,
    days: [],
    preMessages: [],
    preDays: [],
    ...response,
  } as Challenge;

  fs.writeFileSync('GPT/challenge_output.json', JSON.stringify(challenge));

  return challenge;
}

async function generateAndAddChallenge() {
  const challenge = await generateChallenge();
  if (challenge) {
    addChallengeToDb(challenge);
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
