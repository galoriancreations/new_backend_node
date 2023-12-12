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
  preMessages = 0,
  language = 'English',
  targetAudience = 'Everyone',
  numAttempts = 3,
}) {
  console.log(`Generating challenge about: ${topic}... this may take a few minutes, depending on the parameters.
(${days} days, ${tasks} tasks per day, ${messages} messages per day, ${preDays} preDays, ${preMessages} messages per preDay, lang: ${language}, target: ${targetAudience})`);

  // const challengeExample = fs.readFileSync(
  //   'GPT/json/input_challenge_example.json',
  //   'utf8'
  // );

  const outputFormat = {
    name: '<challenge name>',
    days: [
      {
        introduction: '<day introduction>',
        tasks: [
          {
            emoji: '<emoji>',
            isBonus: false,
            options: [
              {
                text: '<task>',
              },
            ],
            points: 1,
            time: '<HH:MM:SS>',
          },
        ],
        time: '<HH:MM:SS>',
        title: '<title>',
        image: '<description of a relative image>',
      },
    ],
    image: '<description of a relative image>',
  };
  if (messages) {
    outputFormat.days[0].messages = [
      {
        content: '<message>',
        time: '<HH:MM:SS>',
      },
    ];
  }
  if (preDays) {
    outputFormat.preDays = [
      {
        messages: [
          {
            content: '<message>',
            time: '<HH:MM:SS>',
          },
        ],
      },
    ];
  }

  const response = await strict_output2(
    `You are an helpful assistant that is able to generate a multi-day challenge.
    Challenge length is ${days} days, with ${tasks} tasks per day, ${messages} messages per day,
    ${preDays} preDays, ${preMessages} messages per preDay, lang: ${language}, target: ${targetAudience}.
    The topic of the challenge is ${topic}.
    Each task in the day start with 1 point and increase by 1 point for each task in the day.`,
    // user prompt
    `Generate a challenge with the following parameters: topic: ${topic}, days: ${days}, tasks: ${tasks}, messages: ${messages}, preDays: ${preDays}, preMessages: ${preMessages}, targetAudience: ${targetAudience}`,
    outputFormat,
    {
      num_tries: numAttempts,
      // verbose: true,
      model: 'ft:gpt-3.5-turbo-1106:liminal-village::8UwQb8WJ', // fine-tuned model
    }
  );

  // for testing
  // const response = JSON.parse(fs.readFileSync('GPT/json/challenge_output.json', 'utf8'));

  if (!response) {
    console.error('Error generating challenge');
    return { error: true, response: null };
  }

  fs.writeFileSync('GPT/json/challenge_output.json', JSON.stringify(response));

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
    language: 'English', // TODO: add language selection
    ...response,
  };

  // check if length of challenge is equal to the number of days and tasks, preDays and preMessages, return error if not
  let errorFlag = false;
  let errorMessage = 'Error: challenge length is not equal to: ';
  if (response?.days?.length !== days) {
    errorMessage += `days (${response?.days?.length}), `;
    errorFlag = true;
  }
  if (Array.isArray(response?.days)) {
    if (response.days[0]?.tasks?.length !== tasks) {
      errorMessage += `tasks (${response?.days[0]?.tasks?.length}), `;
      errorFlag = true;
    }
    if (messages && response.days[0]?.messages?.length !== messages) {
      errorMessage += `messages (${response?.days[0]?.messages?.length}), `;
      errorFlag = true;
    }
  }
  if (preDays && Array.isArray(response?.preDays)) {
    if (response.preDays?.length !== preDays) {
      errorMessage += `preDays (${response?.preDays?.length}), `;
      errorFlag = true;
    }
    if (
      preMessages &&
      response?.preDays[0]?.messages?.length !== preMessages
    ) {
      errorMessage += `preMessages (${response?.preDays[0]?.messages?.length}), `;
      errorFlag = true;
    }
  }
  if (errorFlag) {
    errorMessage = errorMessage.slice(0, -2) + '.';
    console.error(errorMessage);
    return { error: true, response: challenge };
  }

  // add empty messages array if not present to every day in days array to avoid errors in frontend
  if (Array.isArray(challenge.days)) {
    challenge.days.map((day) => {
      if (!day.messages) {
        day.messages = [];
      }
      return day;
    });
  }

  // if (
  //   !preDays ||
  //   (Array.isArray(challenge.preDays[0]) && !challenge.preDays[0].messages)
  // ) {
  //   challenge.preDays = [{ messages: [] }];
  // }

  return challenge;
}

async function generateDay({ challengeName, challengeIntroduction, lastDay, dayIndex }) {
  console.log('Generating day with AI... this may take a while.');
  
  // save day to file
  fs.writeFileSync('GPT/json/input_day.json', JSON.stringify(lastDay));

  const outputFormat = {
    introduction: '<day introduction>',
    tasks: [
      {
        emoji: '<emoji>',
        isBonus: false,
        options: [
          {
            text: '<task>',
          },
        ],
        points: 1,
        time: '<HH:MM:SS>',
      },
    ],
    time: '<HH:MM:SS>',
    title: '<title>',
    image: '<description of a relative image>',
  };
  if (lastDay.messages) {
    outputFormat.messages = [
      {
        content: '<message>',
        time: '<HH:MM:SS>',
      },
    ];
  }

  // generate day introduction
  const generatedDay = await strict_output2(
    `You are an helpful assistant that is able to generate a day in a challenge.
    Stay relevant to the challenge name and introduction.
    The point of the first task is 1 and increase by 1 for each task in the day.`,
    // user prompt
    `Generate a day for a challenge with the following parameters.
    challenge name: ${challengeName}.
    introduction of the first day of the challenge: ${challengeIntroduction},
    Last day in the challenge structure: ${lastDay}. Genereate a day for the provided challenge.
    Do not copy the first or last day, but stay relevant to the challenge name and introduction.
    Generated day index is ${dayIndex + 1}`,
    outputFormat,
    {
      num_tries: 3,
      // verbose: true,
      model: 'ft:gpt-3.5-turbo-1106:liminal-village::8UwQb8WJ', // fine-tuned model
    }
  );

  // console.log(generatedDay);
  // save to file also
  fs.writeFileSync('GPT/json/generatedDay.json', JSON.stringify(generatedDay));
  return generatedDay;
}

module.exports = { generateChallenge, generateDay };
