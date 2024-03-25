const { Challenge } = require("../models/challenge");
const { User } = require("../models/user");
const { sendEmail } = require("../services/nodemailer");

exports.generateRandomCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000);

  return code;
};

// Function to format challenge data into a question and options
exports.formatChallengeData = challenge => {
  const challengeNumber = Object.keys(challenge)[0];
  const tasks = challenge[challengeNumber];
  const question = `Challenge ${challengeNumber}: Select a task to complete:`;
  let options = Object.values(tasks);

  // Truncate options to fit within the 100 character limit
  let totalLength = 0;
  options = options.map(option => {
    const availableLength = 100 - totalLength - (options.length - 1); // Account for commas between options
    if (option.length > availableLength) {
      option = option.substring(0, availableLength - 3) + "...";
    }
    totalLength += option.length + 1; // +1 for the comma
    return option;
  });

  return { question, options };
};

exports.handleUserConnection = async (ctx, message) => {
  console.log("handleUserConnection");

  const user = await User.findOne({
    $or: [{ email: message }, { phone: message }]
  });

  if (!user) {
    return ctx.reply(
      "User not found. Please connect your account first. by typing /connect."
    );
  }

  const code = this.generateRandomCode();
  user.telegramCode = code;
  await user.save();

  console.log(code); // Log the verification code

  // Get random challenge from database
  const challenge = await Challenge.findOne({});

  // Send to email verification code
  sendEmail({
    to: user.email,
    html: `Your verification code is: ${code}`,
    subject: "Ting.Global Bot Verification Code"
  });

  // Set challenge data to the user format of the poll
  ctx.state.challengeData = this.formatChallengeData(challenge.selections[0]); // For example, using the first challenge
  ctx.reply("Please enter the verification code sent to your email:");

  ctx.state.waitForVerificationCode = true;
  ctx.state.currentUser = user;
  ctx.state.currentUser.telegramCode = code;
};

exports.handleVerificationCode = async (ctx, message) => {
  console.log("handleVerificationCode");

  if (ctx.state.currentUser && message == ctx.state.currentUser.telegramCode) {
    if (ctx.state.challengeData) {
      ctx.state.waitForVerificationCode = false;

      const chatId = ctx.chat.id;
      const { question, options } = ctx.state.challengeData;
      await this.sendPoll(ctx, chatId, question, options);
    } else {
      ctx.reply("Error: Challenge data not found.");
    }
  } else {
    ctx.reply("Incorrect code. Please try again.");
    ctx.state.waitForVerificationCode = true;
  }
};

exports.sendPoll = async (ctx, chatId, question, options) => {
  try {
    await ctx.telegram.sendPoll(chatId, question, options);
    console.log({ question, options });
    console.log("Poll created successfully");
  } catch (err) {
    console.log("Error creating poll:", err);
  }
};
