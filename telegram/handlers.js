const { User } = require("../models/user");
const { sendEmail } = require("../services/nodemailer");
const { generateRandomCode } = require("../utils/general");

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

  const code = generateRandomCode();
  user.telegramCode = code;
  await user.save();
  
  const clonedUser = user;
  delete clonedUser.password;
  delete clonedUser.telegramCode;
  delete clonedUser.__v;

  ctx.state.currentUser = clonedUser;
  ctx.state.waitForVerificationCode = true;

  console.log({ code }); // Log the verification code for debugging

  // Send to email verification code
  sendEmail({
    to: user.email,
    html: `Your verification code is: ${code}`,
    subject: "Ting.Global Bot Verification Code"
  });

  ctx.reply("Please enter the verification code sent to your email:");
};

exports.handleVerificationCode = async (ctx, message) => {
  console.log("handleVerificationCode");

  // get user verification code from the database
  const user = await User.findOne({ _id: ctx.state.currentUser._id });

  if (!user) {
    ctx.reply(
      "User not found. Please connect your account first by typing /connect"
    );
    return;
  }

  console.log({ user });
  console.log({ userCode: user.telegramCode });

  if (!ctx.state.currentUser || message != user.telegramCode) {
    ctx.reply("Incorrect code. Please try again.");
    return;
  }

  ctx.state.waitForVerificationCode = false;
  ctx.reply(`Verification successful! Welcome to Ting.Global, ${user.username}!\n\n
You can now select a challenge to participate in. Type /challenges to see the available challenges.`);
};

exports.handleChallengeSelection = async (ctx, message) => {
  console.log("handleChallengeSelection");

  const user = await User.findOne({ _id: ctx.state.currentUser._id });

  if (!user) {
    ctx.reply(
      "User not found. Please connect your account first by typing /connect"
    );
    return;
  }
};
