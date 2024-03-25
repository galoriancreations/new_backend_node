require("dotenv").config();
const { Telegraf } = require("telegraf");
const { handleUserConnection, handleVerificationCode } = require("./handlers");

const state = require("./middleware/state");
const help = require("./commands/help");
const start = require("./commands/start");
const connect = require("./commands/connect");
const { botCommandChallenge } = require("./commands/challenges");
const { botActionChallenge } = require("./actions/challenges");
const { botActionDay } = require("./actions/day");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("Starting the telegram bot service...");

// Middleware to set the default data for the context
bot.use(require("./middleware/state"));

// Middleware to authenticate the user
// bot.use(require("./middleware/auth"));

bot.help(help);
bot.start(start);
bot.command("state", state); // Debugging
bot.command("connect", connect);
bot.command("challenges", botCommandChallenge);

bot.action(/challenge_(.+)/, botActionChallenge);
bot.action(/day_(.+)/, botActionDay);

// Handle all messages
bot.hears(/.*/, async ctx => {
  const message = ctx.message.text;

  console.log(ctx.state);

  if (!ctx.state.currentUser) {
    await handleUserConnection(ctx, message);
  } else if (ctx.state.waitForVerificationCode) {
    await handleVerificationCode(ctx, message);
  } else if (!ctx.state.selectedChallenge) {
    ctx.reply("Please select a challenge first by typing /challenges.");
  }
});

module.exports = bot;
