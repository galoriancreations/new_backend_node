require("dotenv").config();
const { Telegraf } = require("telegraf");
const {
  handleUserConnection,
  handleVerificationCode
} = require("./handlers");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("Starting the telegram bot service...");

// Middleware to set the default data for the context
bot.use(require("./middleware/state"));

// Middleware to authenticate the user
// bot.use(require("./middleware/auth"));

// Commands
bot.command("state", require("./commands/state")); // Debugging
bot.help(require("./commands/help"));
bot.start(require("./commands/start"));
bot.command("connect", require("./commands/connect"));
bot.command("challenges", require("./commands/challenges"));

// Handle all messages
bot.hears(/.*/, async ctx => {
  const message = ctx.message.text;

  console.log(ctx.state);

  if (!ctx.state.currentUser) {
    await handleUserConnection(ctx, message);
  } else if (ctx.state.waitForVerificationCode) {
    await handleVerificationCode(ctx, message);
  } else if (!ctx.state.selectedChallenge) {
    // await 
  }
});

module.exports = bot;
