require("dotenv").config();
const { Telegraf } = require("telegraf");
const { handleUserConnection, handleVerificationCode } = require("./handlers");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("Starting the telegram bot service...");

// Middleware to set the default data for the context
bot.use(require("./middleware/state"));

// Middleware to authenticate the user
// bot.use(require("./middleware/auth"));

bot.help(require("./commands/help"));
bot.start(require("./commands/start"));
bot.command("state", require("./commands/state")); // Debugging
bot.command("connect", require("./commands/connect"));
bot.command("challenges", require("./commands/challenges"));

bot.action(/challenge_(.+)/, require("./actions/challenges"));
bot.action(/day_(.+)/, require("./actions/day"));
bot.action(/start_(.+)/, require("./actions/start"));

// Handle all messages
bot.hears(/.*/, async ctx => {
  const message = ctx.message.text;

  if (!ctx.state.currentUser) {
    await handleUserConnection(ctx, message);
  } else if (ctx.state.waitForVerificationCode) {
    await handleVerificationCode(ctx, message);
  } else if (!ctx.state.selectedChallenge) {
    ctx.reply("Please select a challenge first by typing /challenges.");
  }
});

module.exports = bot;
