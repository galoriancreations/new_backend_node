module.exports = async ctx => {
  ctx.reply("Please enter your Ting.Global email or phone number:");
  ctx.state.waitForVerificationCode = false;
  // ctx.state.currentUser = null;
};
