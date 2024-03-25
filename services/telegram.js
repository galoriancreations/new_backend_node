require("dotenv").config();
const { Telegraf } = require("telegraf");
const { User } = require("../models/user");
const { sendEmail } = require("../services/nodemailer");
const { Challenge } = require("../models/challenge");
const {
  generateRandomCode,
  formatChallengeData
} = require("../utils/telegram");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("Starting the telegram bot service...");

let waitForVerificationCode = false;
let currentUser = null;
let challengeData = null;

bot.command("connect", async ctx => {
  ctx.reply("Please enter your Ting.Global email or phone number:");
  waitForVerificationCode = false;
});

bot.hears(/.*/, async ctx => {
  const message = ctx.message.text;

  if (!waitForVerificationCode) {
    const user = await User.findOne({
      $or: [{ email: message }, { phone: message }]
    });

    if (!user)
      return ctx.reply(
        "User not found. Please connect your account first. by typing /connect."
      );

    const code = generateRandomCode();
    // Get random challenge from database
    const challenge = await Challenge.findOne({});

    // Send to email verification code
    sendEmail({
      to: user.email,
      html: `Your verification code is: ${code}`,
      subject: "Ting.Global Bot Verification Code"
    });
    user.telegramCode = code;
    await user.save();

    // Set challenge data to the user format of the poll
    challengeData = formatChallengeData(challenge.selections[0]); // For example, using the first challenge
    ctx.reply("Please enter the verification code sent to your email:");

    waitForVerificationCode = true;
    currentUser = user;
    console.log(user.telegramCode); // Get verification code
  } else {
    if (currentUser && message == currentUser.telegramCode) {
      if (challengeData) {
        const chatId = ctx.chat.id;
        const { question, options } = challengeData;
        // Send the poll format to the user interface to allow him to interact and choose the challenge
        ctx.telegram
          .sendPoll(chatId, question, options)
          .then(() => {
            console.log({ question, options });
            console.log("Poll created successfully");
          })
          .catch(err => {
            console.log("Error creating poll:", err);
          });

        currentUser.telegramConnected = true;
        await currentUser.save();
      } else {
        ctx.reply("Error: Challenge data not found.");
      }
    } else {
      ctx.reply("Incorrect code. Please try again.");
    }

    waitForVerificationCode = false;
    currentUser = null;
    challengeData = null;
  }
});

module.exports = bot;
