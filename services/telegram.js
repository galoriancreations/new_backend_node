const { Telegraf } = require("telegraf");
const { User } = require("../models/user");
const { sendEmail } = require("../services/nodemailer");
const { generateRandomCode } = require("../utils/telegram");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("Starting the telegram bot service...");

let waitForVerificationCode = false;
let currentUser = null;

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

  if (!waitForVerificationCode) {
    // Get user from the database by email or phone number
    const user = await User.findOne({
      $or: [{ email: message }, { phone: message }]
    });

    if (!user) {
      ctx.reply("User not found. Please try again.");
      return;
    }

    // Generate and send the code to the user's email
    const code = generateRandomCode();

    sendEmail({
      html: `Your verification code is: ${code}`,
      to: user.email,
      subject: "Ting.Global Bot Verification Code"
    });

    // Save the code in the database
    user.telegramCode = code;
    await user.save();

    // Prompt the user to enter the verification code
    ctx.reply("Please enter the verification code sent to your email:");

    // Set the state to wait for verification code
    waitForVerificationCode = true;
    currentUser = user;
  } else {
    // Verify the code
    if (currentUser && message == currentUser.telegramCode) {
      ctx.reply(
        "Verification successful! Your account is now connected to the bot."
      );
      // Update user's account to mark as connected (if needed)
      currentUser.telegramConnected = true;
      await currentUser.save();
    } else {
      ctx.reply("Incorrect code. Please try again.");
    }

    // Reset the state
    waitForVerificationCode = false;
    currentUser = null;
  }
});

// launch the bot
const launch = () => {
  bot.launch();
};

exports.launch = launch;
