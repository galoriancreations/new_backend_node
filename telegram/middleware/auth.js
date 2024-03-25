const User = require("../../models/user");

// Middleware to authenticate the user
module.exports = async (ctx, next) => {
  console.log("auth middleware");

  if (!ctx.from) {
    return next();
  }

  const userId = ctx.from.id;

  // Check if the user is already authenticated
  if (!ctx.state.currentUser) {
    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return ctx.reply(
        "User not found. Please connect your account first by typing /connect."
      );
    }

    ctx.state.currentUser = user;
  }

  return next();
};

/*

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
  ctx.state.currentUser = user; // It's important to set the currentUser before adding the code to the user
  ctx.state.waitForVerificationCode = true;
  user.telegramCode = code;
  await user.save();

  console.log({ code }); // Log the verification code for debugging

  // Send to email verification code
  sendEmail({
    to: user.email,
    html: `Your verification code is: ${code}`,
    subject: "Ting.Global Bot Verification Code"
  });

  ctx.reply("Please enter the verification code sent to your email:");
};
*/
