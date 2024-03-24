const { Telegraf } = require("telegraf");
const { User } = require("../models/user");
const { sendEmail } = require("../services/nodemailer");
const { generateRandomCode } = require("../utils/telegram");
const { Challenge } = require("../models/challenge");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("Starting the telegram bot service...");

let waitForVerificationCode = false;
let currentUser = null;
let challengeData = null;

// Function to format challenge data into a question and options
function formatChallengeData(challenge) {
    const challengeNumber = Object.keys(challenge)[0];
    const tasks = challenge[challengeNumber];
    const question = `Challenge ${challengeNumber}: Select a task to complete:`;
    let options = Object.values(tasks);
  
    // Truncate options to fit within the 100 character limit
    let totalLength = 0;
    options = options.map(option => {
      const availableLength = 100 - totalLength - (options.length - 1); // Account for commas between options
      if (option.length > availableLength) 
      {
        option = option.substring(0, availableLength - 3) + '...';
      }
      totalLength += option.length + 1; // +1 for the comma
      return option;
    });
  
    return { question, options };
  }
  
// Start the interaction between the user and the bot 
bot.start(ctx =>
  ctx.reply(
    "Hello, I'm the Ting.Global bot!\nType /connect to connect your account to the bot."
  )
);

bot.help(ctx =>
  ctx.reply("You can connect your account to the bot by typing /connect.")
);

bot.command("connect", async ctx => {
  ctx.reply("Please enter your Ting.Global email or phone number:");
  waitForVerificationCode = false;
});

bot.hears(/.*/, async ctx => {
  const message = ctx.message.text;

  if (!waitForVerificationCode) 
  {
    const user = await User.findOne({
      $or: [{ email: message }, { phone: message }]
    });

    if (!user) return ctx.reply("User not found. Please try again.");

    const code = await generateRandomCode();
    // Get random challenge from database  
    const challenge = await Challenge.findOne({}); 

    // Send to email verification code
    sendEmail({
      to: user.email,
      html: `Your verification code is: ${code}`,
      subject: "Ting Global Bot Verification Code"
    });
    user.telegramCode = code;
    await user.save();

    // Set challenge data to the user format of the poll 
    challengeData = formatChallengeData(challenge.selections[0]); // For example, using the first challenge
    ctx.reply("Please enter the verification code sent to your email:");

    waitForVerificationCode = true;
    currentUser = user;
    console.log(user.telegramCode); // Get verification code

  } 
  else 
  {
    if (currentUser && message == currentUser.telegramCode) 
    {
      if (challengeData) 
      {
        const chatId = ctx.chat.id;
        // Send the poll format to the user interface to allow him to interact and choose the challenge
        ctx.telegram.sendPoll(chatId, challengeData.question, challengeData.options)
          .then(() => {
            console.log('Poll created successfully');
          })
          .catch((err) => {
            console.log('Error creating poll:', err);
          });

        currentUser.telegramConnected = true;
        await currentUser.save();
      } 
      else 
      {
        ctx.reply("Error: Challenge data not found.");
      }
    } 
    else 
    {
      ctx.reply("Incorrect code. Please try again.");
    }

    waitForVerificationCode = false;
    currentUser = null;
    challengeData = null;
  }
});

const launch = () => {
  bot.launch();
};

exports.launch = launch;
