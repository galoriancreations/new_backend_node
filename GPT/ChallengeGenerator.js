const fs = require('fs');
const {
  strict_output2,
  strict_image,
  strict_audio,
} = require('./strict_output');
const { uploadFileToDB } = require('../database');
const { downloadImage, convertFile } = require('../services/utils');
// const { progressEmitter } = require('../server');

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
    `You are an helpful assistant that is able to generate a multi-day challenge.`,
    // user prompt
    `Generate a challenge with the following parameters: topic: ${topic}, days: ${days}, tasks: ${tasks}, messages: ${messages}, preDays: ${preDays}, preMessages: ${preMessages}, targetAudience: ${targetAudience}`,
    outputFormat,
    {
      num_tries: numAttempts,
      // verbose: true,
      model: 'ft:gpt-3.5-turbo-1106:liminal-village::8VmPuhFf', // fine-tuned model
      temperature: 0.8,
    }
  );

  // for testing
  // const response = JSON.parse(fs.readFileSync('GPT/json/challenge_output.json', 'utf8'));

  if (!response) {
    console.log('Error generating challenge');
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
    if (preMessages && response?.preDays[0]?.messages?.length !== preMessages) {
      errorMessage += `preMessages (${response?.preDays[0]?.messages?.length}), `;
      errorFlag = true;
    }
  }
  if (errorFlag) {
    errorMessage = errorMessage.slice(0, -2) + '.';
    console.log(errorMessage);
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

  return challenge;
}

async function generateDay({
  challengeName,
  challengeIntroduction,
  lastDay,
  dayIndex,
}) {
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
        content: '<day message>',
        time: '<HH:MM:SS>',
      },
    ];
  }

  // delete 'id', 'type', 'fileUrl', image property from lastDay object, check inner objects too
  function removeId(obj) {
    for (const prop in obj) {
      if (
        prop === 'id' ||
        prop === 'type' ||
        prop === 'fileUrl' ||
        prop === 'image'
      ) {
        delete obj[prop];
      } else if (typeof obj[prop] === 'object') {
        removeId(obj[prop]);
      }
    }
  }
  removeId(lastDay);

  // generate day introduction
  const generatedDay = await strict_output2(
    `You are a helpful assistant that is able to generate a day in a challenge.
Stay relevant to the challenge name and introduction.
The point of the first task is 1 and increase by 1 for each task in the day.`,
    // user prompt
    `Generate a day for a challenge with the following parameters.
challenge name: ${challengeName}
Introduction of the first day of the challenge: ${challengeIntroduction}
Last day in the challenge data: ${JSON.stringify(lastDay)}
Genereate a day for the provided challenge.
Do not copy the first or last day, but stay relevant to the challenge name and introduction.
Generated day index is ${dayIndex + 1}`,
    outputFormat,
    {
      num_tries: 3,
      // verbose: true,
      model: 'ft:gpt-3.5-turbo-1106:liminal-village::8VmPuhFf', // fine-tuned model
      temperature: 0.8,
    }
  );

  if (!generatedDay) {
    console.log('Error generating day');
    return false;
  }

  // console.log(generatedDay);
  // save to file also
  fs.writeFileSync('GPT/json/generatedDay.json', JSON.stringify(generatedDay));

  return generatedDay;
}

async function replaceImages(challenge, callback = null) {
  // for each image field in challenge replace with strict_image
  // get number of images in challenge and insert to array
  const images = [];
  function countImages(obj) {
    for (const prop in obj) {
      if (prop === 'image') {
        images.push(obj);
      } else if (typeof obj[prop] === 'object') {
        countImages(obj[prop]);
      }
    }
  }
  countImages(challenge);
  console.log('Number of images in challenge:', images.length);

  for (let i = 0; i < images.length; i++) {
    const obj = images[i];
    const prop = 'image';
    if (callback) {
      callback(i + 1, images.length);
    }

    if (!obj[prop]) {
      console.log('No image to replace');
      continue;
    }

    console.log('Replacing image:', obj[prop]);
    const image = await strict_image(obj[prop]);
    const { url } = image[0];
    // use uniq id as filename to avoid overwriting
    const filename = `${Date.now()}-${i + 1}image`;
    const imagePath = await downloadImage(url, `./temp/${filename}.jpeg`);
    if (!imagePath) {
      console.log('Error downloading image, no image path');
      continue;
    }
    // convert image to meme
    const meme = convertFile(imagePath);
    // upload image to database
    const fileDB = await uploadFileToDB(meme);
    // replace image description with image path
    obj[prop] = `/uploads/${fileDB._id}`;
  }
}

async function generateAudio(challenge, callback = null) {
  // for each introduction field in challenge message with strict_audio
  // get number of introductions in challenge and insert to array
  const introductions = [];
  function countIntroductions(obj) {
    for (const prop in obj) {
      if (prop === 'introduction') {
        introductions.push(obj);
      }
      // maybe need to delete this. no recursive needed here (?)
      else if (typeof obj[prop] === 'object') {
        countIntroductions(obj[prop]);
      }
    }
  }

  countIntroductions(challenge);

  console.log('Number of introductions in challenge:', introductions.length);

  for (let i = 0; i < introductions.length; i++) {
    const obj = introductions[i];
    if (callback) {
      callback(i + 1, introductions.length);
    }

    if (!obj.introduction) {
      console.log(`No introduction to generate audio (#${i + 1})`);
      continue;
    }

    const filename = `${Date.now()}-${i + 1}audio`;
    // generate audio
    const path = await strict_audio({
      input: obj.introduction,
      path: `./temp/${filename}.mp3`,
    });

    // convert audio
    console.log('Converting audio:', path);
    const meme = convertFile(path);

    // upload audio to database
    const fileDB = await uploadFileToDB(meme);

    // save audio to challenge as message
    obj.messages.unshift({
      type: 'audio',
      time: obj.time || '00:00:00',
      content: '',
      fileUrl: `/uploads/${fileDB._id}`,
    });

    console.log('Added introduction audio successfully:', obj.introduction);
  }
}

module.exports = {
  generateChallenge,
  generateDay,
  replaceImages,
  generateAudio,
};
