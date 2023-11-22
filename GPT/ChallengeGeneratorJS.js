require('dotenv').config();
const fs = require('fs');
const schedule = require('node-schedule');
const { strict_output2 } = require('./strict_outputJS');
// const { addChallengeToDb } = require('../database/indexJS');

async function generateChallenge({
  creator,
  id,
  topic = 'a topic of your choice',
  days = 5,
  minTasks = 3,
  maxTasks = 15,
}) {
  console.log(
    `Generating challenge (${days} days, between ${minTasks} to ${maxTasks} tasks)... This may take a while`
  );
  const response = await strict_output2(
    `You are a helpful AI that is able to generate a challenge.
The challenge should be about ${topic}.
The challenge should contain ${days} days.
The challenge should contain between ${minTasks} to ${maxTasks} tasks.
The challenge should be in English.
The challenge is an array of messages and tasks that the user should do in the challenge.
The challenge contain days, preDays, image.

${/* days[] */''}
${/* introduction, messages, tasks, time, title, image */''}
days is an array of days that the user should do in the challenge.
each day contain the next fields: introduction, messages, tasks, time, title.
introduction is a text about the introduction of the day.
time is the time that the day should be sent to the user.
title is the title of the day.
image is an text about image prompt to create with dell-e about the topic of the day.

${/* days[] > messages[] */''}
${/* content, time */''}
messages is an array of messages that the user should read in the challenge.
each field contain the next fields: content, time.
content is the content of the message, time is the time that the message should be sent to the user.

${/* days[] > tasks[] */''}
${/* emoji, isBonus, options[], points, time */''}
tasks is an array of tasks that the user should do in the challenge,
each task contain the next fields: emoji, isBonus, options, points, time.
emoji is the emoji of the task. to be attractive to the students.
isBonus is a boolean that indicate if the task is a bonus task.
options is an array of options that the user should choose from, each option contain the next fields: text.
Keep the text text short and simple, and don't use the word TASK: or inside the text.
points is the points that the user will get if he choose the option.
time is the time that the task should be sent to the user.
Some tasks should be additional bonus and double bonus selection.

${/* days[] > preDays[] */''}
${/* messages[] */''}
preDays is an array, each field contain the next fields: messages.
messages is an array of messages that the user should read in the challenge.
The message contain the next fields: time, content.
The time is the time that the message should be sent to the user.
The content is the content of the message.

${/* image */''}
image is an text about image prompt to create with dell-e about the topic of the challenge.

Example of a challenge with 3 days and 5 tasks:
{
  "days": [
    {
      "introduction": "*Welcome to the first day of the 18 days of Climate Action.*\nGeoengineering Techniques for climate repair - *Stratospheric Aerosol Injection* (SAI) is a theoretical solar geoengineering proposal to spray large quantities of tiny reflective particles into the stratosphere, an upper layer of the Earth’s atmosphere, in order to cool the planet by reflecting sunlight back into space. Read more: https://www.geoengineeringmonitor.org/2021/02/stratospheric_aerosol_injection/\n",
      "messages": [
        {
          "content": "Watch the video: Ina Möller: Governance of Stratospheric Aerosol Injection - https://youtu.be/5BEO4pCvD9k ",
          "time": "18:00:14"
        }
      ],
      "tasks": [
        {
          "emoji": "👍",
          "isBonus": false,
          "options": [
            {
              "text": "If you AGREE that *Stratospheric Aerosol Injection* is part of the solution to reduce Climate Change than mark 👍"
            }
          ],
          "points": 1,
          "time": "18:00:10"
        },
        {
          "emoji": "👎",
          "isBonus": true,
          "options": [
            {
              "text": "If you DON’T AGREE that *Stratospheric Aerosol Injection* is part of the solution to reduce Climate Change than mark 👎"
            }
          ],
          "points": 1,
          "time": "18:00:12"
        }
      ],
      "time": "18:00:08",
      "title": "Stratospheric Aerosol Injection"
    },
    {
      "introduction": "*Welcome to the third day of the Climate Action challenge.*\n*Ocean Surface Iron Fertilization*\nGeoengineering Techniques for climate repair - “Give me half a tanker of iron, and I’ll give you an ice age” may rank as the catchiest line ever uttered by a biogeochemist. The man responsible was the late John Martin, former director of the Moss Landing Marine Laboratory, who discovered that sprinkling iron dust in the right ocean waters could trigger plankton blooms the size of a small city. In turn, the billions of cells produced might absorb enough heat-trapping carbon dioxide to cool the Earth’s warming atmosphere. Read more: https://www.whoi.edu/oceanus/feature/fertilizing-the-ocean-with-iron/ \n",
      "messages": [
        {
          "content": "Figure of Ocean iron fertilization schematic. 1. Iron is added to High Nutrient Low Chlorophyll Regions (HNLCs, i.e. Southern Ocean) where phytoplankton growth is limited by iron availability. 2. Iron stress is relieved, division rates boom, phytoplankton bloom is triggered, drawing down increased CO2 through photosynthesis. 3. After Phytoplankton die, or are consumed, most are remineralized at the surface, recycling nutrients and Carbon. 4. Others sink to depth before being remineralized in the deep ocean on in marine sediments. 5. CO 2 is sequestered at depth for 100s of year before being upwelled to surface (or much longer in sediments) This figure was uploaded by Tyler Rohr\n",
          "time": "18:00:00"
        },
        {
          "content": "*Two hours left to complete today's tasks*\n_Rasing humanity on a new path - it all starts with you_ 🐋🌸🙏",
          "time": "16:00:00"
        },
        {
          "content": "Watch the video: OCB2021 Negative Emissions: Review and synthesis of \"Ocean Iron Fertilization Experiments\" - https://youtu.be/yXFXUj6Nqlw \n",
          "time": "18:00:00"
        }
      ],
      "tasks": [
        {
          "emoji": "🔴",
          "isBonus": false,
          "options": [
            {
              "text": "If you AGREE that *iron fertilization* is part of the solution to reduce Climate Change than mark 🤸‍♀"
            }
          ],
          "points": 1,
          "time": "18:00:00"
        },
        {
          "emoji": "🔵",
          "isBonus": true,
          "options": [
            {
              "text": "If you DON’T AGREE that *iron fertilization* is part of the solution to reduce Climate Change than mark 🚴"
            }
          ],
          "points": 1,
          "time": "18:00:00"
        }
      ],
      "time": "18:00:00",
      "title": "Ocean Surface Iron Fertilization"
    },
    {
      "image": "Universal basic income",
      "introduction": "*Welcome to the fourth day of the Climate Action challenge.*\n*Universal basic income* (UBI) is a government-guaranteed payment that each citizen receives. It is also called a citizen’s income, guaranteed minimum income, or basic income.\nThe intention behind the payment is to provide enough to cover the basic cost of living and establish a sense of financial security for everyone. The concept is also seen as a way to offset job losses caused by technology. Learn more about how it works, its pros and cons, and what it might look like in the U.S.\nRead more: https://www.thebalance.com/universal-basic-income-4160668 \n\n",
      "messages": [
        {
          "content": "*Two hours left to complete today's tasks*\n_Rasing humanity on a new path - it all starts with you_ 🐋🌸🙏",
          "time": "16:00:00"
        },
        {
          "content": "UBI Image: https://www.theguardian.com/commentisfree/2020/may/03/universal-basic-income-coronavirus-shocks ",
          "time": "18:00:00"
        },
        {
          "content": " Watch video: Andrew Yang Makes the Case for Universal Basic Income - https://youtu.be/TABoe_wLPYc ",
          "time": "18:00:00"
        }
      ],
      "tasks": [
        {
          "emoji": "📕",
          "isBonus": false,
          "options": [
            {
              "text": "If you AGREE that UBI is part of the solution to reduce Climate Change than mark 📕"
            }
          ],
          "points": 1,
          "time": "18:00:00"
        },
        {
          "emoji": "💻",
          "isBonus": true,
          "options": [
            {
              "text": "If you DON’T AGREE that UBI is part of the solution to reduce Climate Change than mark 💻"
            }
          ],
          "points": 1,
          "time": "18:00:00"
        }
      ],
      "time": "18:00:00",
      "title": "Universal Basic Income"
    },
    {
      "image": "future of humanity",
      "introduction": "*Welcome to the 18th Day of the Challenge – For the FUTURE OF HUMANITY*\nA lovely week to all of you all and thank you for persevering and succeeding on this amazing journey. I sincerely hope that you will continue to challenge yourself and that you will also lead many others to Climate Action.\nTrue, as you understand, it was just a quick and sweet tasting, a trailer for a movie called Life, in which we are not only the viewers but also the actors, who are looking for meaning, growth for achievements and a better world for all of us.\n \nThis is your year. Ask, declare, listen, smile more, start living, and see how you manage to grow each day with the choices and decisions you make, the way you spend your time, the people you hang out with and how you feel at any given moment.\nFor me, sustainability is first and foremost listening to the inner self, heart and mind, for me sustainability is living in the beings I have chosen for myself, joy, giving and listening, it all comes down to that.\nI want to thank you again for participating in the challenge,\nWe are almost done ... another step and we reached the depths of this small and big journey.\nIn fact let's walk 18 festive steps, a reminder of our joint journey together. Imagine what kind of world you would like to live in? I would love to hear that in the group or in private,\n\"You may say I'm dreamer\nBut I'm not the only one\nI hope one day you will join me\nAnd the world will be as one\" ~ John Lenon",
      "messages": [
        {
          "content": "Challenge 18 @Ting.Global is supported by people like you, we receive no public or private funding so if you enjoyed the 18 Days Journey show us you believe in the work that we do and help us raise awareness about the challenges humanity faces so we can reach more people. https://www.paypal.com/donate/?hosted_button_id=9VPU46W3U8EK6",
          "time": "18:18:18"
        },
        {
          "content": "*Two hours left to complete today's tasks*\n_Rasing humanity on a new path - it all starts with you_ 🐋🌸🙏",
          "time": "16:00:00"
        }
      ],
      "tasks": [
        {
          "emoji": "📽",
          "isBonus": false,
          "options": [
            {
              "text": "*The task for today* - Send this group a video or written message, preferably a video. Introduce yourself, most of you do not know each other and it will be exciting to know who was part of the energy that supported us all. Describe your experience from these 18 days of sustainability and leadership: emotions, observations, signs, surprises, what has changed inside and outside of you and so on. If you want to resonate something in the universe this is the time! If you have interesting ideas and projects share them here, this is important because this group may have people who are interested in what you do, the services you offer or your ideas. Be creative and real when you describe yourself, do not be ashamed, the stage is all yours. | 🎥"
            },
            {
              "text": "*Your 1-2 min TED talk* - Send this group a video you uploaded to your social media. Introduce with your own unique style and voice on the topic of Climate Action that you care the most. If you want to resonate something in the universe this is the time! If you have interesting ideas and projects share them here, this is important because this group may have people who are interested in what you do, the services you offer or your ideas. Be creative and real when you describe yourself, do not be ashamed, the stage is all yours. Important notice: The views for your video will be as extra points you and your team receives. |🎥"
            }
          ],
          "points": 1,
          "time": "18:00:00"
        }
      ],
      "time": "18:00:00",
      "title": "\"H+\": Future of Humanity"
    }
  ],
  "image": "journey of change",
  "language": "English",
  "name": "Climate Action",
  "preDays": [
    {
      "messages": [
        {
          "content": "Further clarification friends,\nEvery day at 18:00, the daily task will be sent to you. Try to feel committed and connected to the process - you have 24 hours to do it and mark in the group you did it... *there is no need to be especially available every day at 18:00* 🌏🥥⚽💚🐋📱💸",
          "time": "18:00:00"
        },
        {
          "content": "*Bonus Task* - Welcome. For every 5 new players you invite that join the group, you will be awarded with 18 Ting points. Ready? ",
          "time": "12:00:00"
        }
      ]
    },
    {
      "messages": [
        {
          "content": "I am Sharon Gal-Or and I would like to invite you to take part in an amazing 18-day process of Climate Action!\nI know for some of you this is not the first time, but it is still very important to do the exercises.\nI am sure that in light of the changing situation in the world, the awareness of performing the exercises will be different.\nThis is a time when inner fears often float, so I guess on some days some of you will experience less pleasant moments. I have no doubt that maintaining a high level of awareness through performing the exercises will allow us to cope more easily 🌸\nStarting tonight, and every day, I will send the tasks to be completed the next day.\nThe process requires loyalty to yourself and the group so commit to yourself and the group. *At the end of the practice, mark with emojis and share your thoughts* 🌻🌼🌸🌺🌹🌷💐🌾 ❤️❤️❤️❤️❤️.\nAs always, anyone who needs support or explanations is welcome to send messages in private to the group leader.\nMay we all have an amazing and growing process of Sustainability & Leadership. \nSharon Gal-Or",
          "time": "18:00:00"
        },
        {
          "content": "*Bonus Task* - Welcome. For every 5 new players you invite that join the group, you will be awarded with 18 Ting points. Ready? ",
          "time": "18:00:04"
        },
        {
          "content": "Are you ready to step outside your comfort zone? Do you want to make a difference in the world around you? Come be a part of the movement that is raising awareness of issues like sustainability and stability. Participation in the challenge helps to bring communities and individuals together and to increase understanding of the hot topics on the global agenda.\n\nThe change begins in us!\nSharon Gal-Or\n\nTing.Global",
          "time": "18:00:06"
        }
      ]
    }
  ]
}

The goal of the challenge is to educate and connect people around the world, and to bring the world to be a better place.
Store the challenge in a JSON array.`,
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
      ]
    }
    // {
    // verbose: true,
    // model: 'gpt-4',
    // }
  );
  if (!response) {
    console.error('Error generating challenge');
    return;
  }
  console.log(response);
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
    // template: '', // check the template idea
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
    minTasks: 30,
    maxTasks: 60,
  });
  if (challenge) {
    // addChallengeToDb(challenge);
    console.log('Challenge successfully added to database');
  } else {
    console.error('Error adding challenge to database, challenge is ');
  }
}

// generateAndAddChallenge();

// // Schedule Article sendArticleToAllSubscribers() to run every Monday at 9:00 AM
// const rule = new schedule.RecurrenceRule();
// rule.dayOfWeek = 1; // Monday
// rule.hour = 9; // 9:00 AM
// rule.minute = 0; // 00 seconds
// const job = schedule.scheduleJob(rule, () => generateChallenge());
// console.log('Scheduled challenge generator job to run every Monday at 9:00 AM');

module.exports = { generateChallenge };
