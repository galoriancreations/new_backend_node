const fs = require("fs");
const {
  strict_output,
  strict_image,
  strict_audio
} = require("./strict_output");
const { uploadFileToDB } = require("../util/functions");
const { downloadImage } = require("../services/utils");
// const { progressEmitter } = require('../server');

/**
 * Generates a challenge with the given parameters.
 *
 * @param {Object} options - The options for generating the challenge.
 * @param {string} options.creator - The creator of the challenge.
 * @param {string} options.id - The ID of the challenge.
 * @param {string} [options.topic='a topic of your choice'] - The topic of the challenge.
 * @param {number} [options.days=2] - The number of days for the challenge.
 * @param {number} [options.tasks=5] - The number of tasks per day.
 * @param {number} [options.messages=0] - The number of messages per day.
 * @param {number} [options.preDays=0] - The number of pre-days for the challenge.
 * @param {number} [options.preMessages=0] - The number of messages per pre-day.
 * @param {string} [options.language='English'] - The language of the challenge.
 * @param {string} [options.targetAudience='Everyone'] - The target audience of the challenge.
 * @param {number} [options.numAttempts=3] - The number of attempts to generate the challenge.
 * @returns {Object} - The generated challenge.
 */
async function generateChallenge({
  creator,
  id,
  topic = "a topic of your choice",
  days = 2,
  tasks = 5,
  messages = 0,
  preDays = 0,
  preMessages = 0,
  language = "English",
  targetAudience = "General",
  numAttempts = 3,
  voice = "alloy"
}) {
  console.log(`Generating challenge about: ${topic}... this may take a few minutes, depending on the parameters.
(${days} days, ${tasks} tasks per day, ${messages} messages per day, ${preDays} preDays, ${preMessages} messages per preDay, lang: ${language}, target: ${targetAudience})`);

  // const challengeExample = fs.readFileSync(
  //   'GPT/json/input_challenge_example.json',
  //   'utf8'
  // );

  const outputFormat = {
    name: "<challenge name>",
    days: [
      {
        introduction: "<day introduction>",
        tasks: [
          {
            emoji: "<emoji>",
            isBonus: false,
            options: [
              {
                text: "<task>"
              }
            ],
            points: 1,
            time: "<HH:MM:SS>"
          }
        ],
        time: "<HH:MM:SS>",
        title: "<title>",
        image:
          '<description of a relative icon, 4 to 6 words. don\'t use the words "icon", "logo", "symbol", "illustration" or "image">'
      }
    ],
    image:
      '<description of a relative icon, 4 to 6 words. don\'t use the words "icon", "logo", "symbol", "illustration" or "image">'
  };
  if (messages) {
    outputFormat.days[0].messages = [
      {
        content: "<message>",
        time: "<HH:MM:SS>"
      }
    ];
  }
  if (preDays) {
    outputFormat.preDays = [
      {
        messages: [
          {
            content: "<message>",
            time: "<HH:MM:SS>"
          }
        ]
      }
    ];
  }

  const response = await strict_output(
    `You are an helpful assistant that is able to generate a multi-day challenge. image is a description of a relative icon.`,
    // user prompt
    `Generate a challenge with the following parameters: topic: ${topic}, days: ${days}, tasks: ${tasks}, messages: ${messages}, preDays: ${preDays}, preMessages: ${preMessages}, targetAudience: ${targetAudience}`,
    outputFormat,
    {
      num_tries: numAttempts,
      // verbose: true,
      model: process.env.OPENAI_API_FINE_TUNE_MODEL_ID, // fine-tuned model
      temperature: 0.8
    }
  );

  // for testing
  // const response = JSON.parse(fs.readFileSync('GPT/json/challenge_output.json', 'utf8'));

  if (!response || response.error) {
    console.log("Error generating challenge");
    return { error: true, msg: response.error || "Error generating challenge" };
  }

  fs.writeFileSync("GPT/json/challenge_output.json", JSON.stringify(response));

  const challenge = {
    _id: id,
    allowsCopies: true,
    creator,
    active: true,
    createdOn: Date.now(),
    date: new Date().toLocaleDateString("en-GB"),
    declined: false,
    // invite: '', // an invite link to telegram challenge group
    isPublic: false,
    scores: [],
    verified: false,
    language: "English", // TODO: add language selection
    voice,
    ...response
  };

  // check if length of challenge is equal to the number of days and tasks, preDays and preMessages, return error if not
  let errorFlag = false;
  let errorMessage = "Error: challenge length is not equal to: ";
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
    errorMessage = errorMessage.slice(0, -2) + ".";
    console.log(errorMessage);
    return { error: true, response: challenge };
  }

  // add empty messages array if not present to every day in days array to avoid errors in frontend
  if (Array.isArray(challenge.days)) {
    challenge.days.map(day => {
      if (!day.messages) {
        day.messages = [];
      }
      return day;
    });
  }

  return challenge;
}

/**
 * Generates a day for a challenge.
 *
 * @param {Object} options - The options for generating the day.
 * @param {string} options.challengeName - The name of the challenge.
 * @param {string} options.challengeIntroduction - The introduction of the first day of the challenge.
 * @param {Object} options.lastDay - The data of the last day in the challenge.
 * @param {number} options.dayIndex - The index of the generated day.
 * @returns {Promise<Object|null>} - A promise that resolves to the generated day object or null if there was an error.
 */
async function generateDay({
  challengeName,
  challengeIntroduction,
  lastDay,
  dayIndex
}) {
  console.log("Generating day with AI... this may take a while.");

  // save day to file
  fs.writeFileSync("GPT/json/input_day.json", JSON.stringify(lastDay));

  const outputFormat = {
    introduction: "<day introduction>",
    tasks: [
      {
        emoji: "<emoji>",
        isBonus: false,
        options: [
          {
            text: "<task>"
          }
        ],
        points: 1,
        time: "<HH:MM:SS>"
      }
    ],
    time: "<HH:MM:SS>",
    title: "<title>",
    image:
      '<description of a relative icon, 4 to 6 words. don\'t use the words "icon", "logo", "symbol", "illustration" or "image">'
  };
  if (lastDay.messages) {
    outputFormat.messages = [
      {
        content: "<day message>",
        time: "<HH:MM:SS>"
      }
    ];
  }

  // delete 'id', 'type', 'fileUrl', image property from lastDay object, check inner objects too
  function removeId(obj) {
    for (const prop in obj) {
      if (
        prop === "id" ||
        prop === "type" ||
        prop === "fileUrl" ||
        prop === "image"
      ) {
        delete obj[prop];
      } else if (typeof obj[prop] === "object") {
        removeId(obj[prop]);
      }
    }
  }
  removeId(lastDay);

  // generate day introduction
  const generatedDay = await strict_output(
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
      model: process.env.OPENAI_API_FINE_TUNE_MODEL_ID, // fine-tuned model
      temperature: 0.8
    }
  );

  if (!generatedDay) {
    console.log("Error generating day");
    return null;
  }

  // console.log(generatedDay);
  // save to file also
  fs.writeFileSync("GPT/json/generatedDay.json", JSON.stringify(generatedDay));

  return generatedDay;
}

/**
 * Replaces images in the challenge object with generated images and updates the image paths.
 * If no image theme is provided, it generates a theme for the images.
 *
 * @param {Object} options - The options for replacing images.
 * @param {Object} options.challenge - The challenge object containing image fields to be replaced.
 * @param {Function} [options.callback=null] - Optional callback function to track progress.
 * @param {string} [options.imageTheme] - The theme for the images.
 *
 * @returns {Promise<void>} - A promise that resolves when all images have been replaced.
 */
async function replaceImages({ challenge, callback = null, imageTheme }) {
  // for each image field in challenge replace with strict_image
  // if (!imageTheme) {
  //   console.log('No image theme in challenge, generating one...');
  //   imageTheme = await generateImageTheme();
  //   callback(0, 0, imageTheme);
  // }

  // get number of images in challenge and insert to array
  const images = [];
  function countImages(obj) {
    for (const prop in obj) {
      if (prop === "image") {
        images.push(obj);
      } else if (typeof obj[prop] === "object") {
        countImages(obj[prop]);
      }
    }
  }
  countImages(challenge);
  console.log("Number of images in challenge:", images.length);

  for (let i = 0; i < images.length; i++) {
    const obj = images[i];
    const prop = "image";
    if (callback) {
      callback(i + 1, images.length);
    }

    if (!obj[prop]) {
      console.log("No image to replace");
      continue;
    }

    console.log("Replacing image:", obj[prop]);
    // if first image, generate with dall-e-3 model, and use the generated image to edit the rest with dall-e-2 model
    // currenlty not working, so just use dall-e-2 model for all images
    // need to find a way to mask the image to be edited automatically

    // let image;
    // if (!firstImagePath) {
    //   image = await strict_image({ prompt: obj[prop] + theme.instruction });
    //   // save first image path
    //   firstImagePath = await downloadImage({
    //     imageUrl: image[0].url,
    //     downloadPath: `./temp/${Date.now()}-${i + 1}image.png`,
    //     quality: 50,
    //     type: 'png',
    //     tranparency: 0.5,
    //   });
    // } else {
    //   const useDallE3 = false;
    //   image = await strict_image({
    //     prompt: obj[prop] + '\n' + theme.instruction,
    //     model: 'dall-e-' + (useDallE3 ? 3 : 2),
    //     size: useDallE3 ? '1024x1024' : '256x256',
    //     imagePath: firstImagePath,
    //   });
    // }
    const useDallE3 = false;
    // if image has 'icon', 'logo', 'symbol' or 'illustration', 'image' in the prompt, remove it
    let prompt = obj[prop];
    const promptWords = prompt.split(" ");
    const promptWordsFiltered = promptWords.filter(word => {
      const excludedWords = ["icon", "logo", "symbol", "illustration", "image"];
      return !excludedWords.includes(word);
    });
    prompt = promptWordsFiltered.join(" ");

    const image = await strict_image({
      prompt: `minimal art line icon of ${prompt}. in a circle with a yellow background.`,
      imagePath: "./GPT/images/mask_yellow.png",
      // maskPath: './GPT/images/new-logo-mask2.png',
      model: "dall-e-" + (useDallE3 ? 3 : 2),
      size: useDallE3 ? "1024x1024" : "256x256"
    });

    // use uniq id as filename to avoid overwriting
    const filename = `${Date.now()}-${i + 1}image`;

    const imagePath = await downloadImage({
      imageUrl: image[0].url,
      downloadPath: `./temp/${filename}.jpeg`,
      quality: 50,
      type: "jpeg"
    });
    if (!imagePath) {
      console.log("Error downloading image, no image path");
      continue;
    }
    const uploadedFilePath = await uploadFileToDB(imagePath);
    // replace image description with image path
    obj[prop] = uploadedFilePath;
  }

  // /**
  //  * Generates a theme for images.
  //  *
  //  * @returns {Promise<string>} The generated theme instruction.
  //  */
  //   async function generateImageTheme() {
  //     // generate theme for images
  //     const theme = await strict_output(
  //       `To ensure a uniform and visually cohesive series of images from an AI image generator, detailed and consistent instructions are key. Each directive should encompass precise elements like color codes, artistic style, object types, and backgrounds. This level of specificity aids in maintaining a uniform theme across all generated images.
  // For instance, consider this detailed instruction for an icon design:
  // "Create an icon featuring a background in red wine berry color (#8B0000) complemented by a crisp white border. The design should employ simple geometric shapes, and highlight a single accent color of sunny yellow (#FFD700). The primary shape of the icon is a circle, encompassing a central square. Overlay the icon with a singular pop of dark blue color (#00008B), ensuring the color is applied in a brushed texture. Maintain a minimalist aesthetic throughout."
  // This approach ensures each image adheres to a specific aesthetic, color palette, and design principle, resulting in a harmonious set of images.
  // The instruction is for all icons in the set, but each icon should be unique.
  // Instruction should not exceed 300 characters.`,
  //       // user prompt
  //       `Give me instruction of a random theme for a simple and clean icon.`,
  //       { instruction: '<instruction with maximum of 300 caracters>' },
  //       {
  //         model: 'gpt-4',
  //       }
  //     );

  //     return theme.instruction;
  //   }
}

/**
 * Generates audio for each introduction field in the challenge object.
 *
 * @param {Object} challenge - The challenge object.
 * @param {string} [voice='alloy'] - The voice to use for generating audio.
 * @param {Function} [callback=null] - The callback function to be called after generating each audio.
 * @returns {Promise<void>} - A promise that resolves when all audio generation is complete.
 */
async function generateAudio(challenge, voice = "alloy", callback = null) {
  // for each introduction field in challenge message with strict_audio
  // get number of introductions in challenge and insert to array
  const introductions = [];
  function countIntroductions(obj) {
    for (const prop in obj) {
      if (prop === "introduction") {
        introductions.push(obj);
      }
      // maybe need to delete this. no recursive needed here (?)
      // because introduction is always a property in the first level of the object?
      else if (typeof obj[prop] === "object") {
        countIntroductions(obj[prop]);
      }
    }
  }

  countIntroductions(challenge);

  console.log("Number of introductions in challenge:", introductions.length);

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
      voice,
      path: `./temp/${filename}.mp3`
    });

    const uploadedFilePath = await uploadFileToDB(path);

    // save audio to challenge as a message
    obj.messages.unshift({
      type: "audio",
      time: obj.time || "00:00:00",
      content: "",
      isAudio: true,
      file: uploadedFilePath,
      fileUrl: uploadedFilePath
    });

    console.log(
      "Added introduction audio successfully:",
      obj.introduction.slice(0, 50) + "..."
    );
  }
}

module.exports = {
  generateChallenge,
  generateDay,
  replaceImages,
  generateAudio
};
