require("dotenv").config();
const { Telegraf } = require("telegraf");
const {
  handleUserConnection,
  handleVerificationCode
} = require("../utils/telegram");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("Starting the telegram bot service...");

// In-memory data store
const dataStore = {};

// Middleware to set the default data for the context
bot.use((ctx, next) => {
  if (!ctx.from) {
    return next();
  }

  const userId = ctx.from.id;

  // Initialize data for the user if it doesn't exist
  if (!dataStore[userId]) {
    dataStore[userId] = {
      waitForVerificationCode: false,
      currentUser: null,
      challengeData: null
    };
  }

  // Set ctx.state to the user's data
  ctx.state = dataStore[userId];

  return next();
});

// Commands
bot.help(require("../telegram/commands/help"));
bot.start(require("../telegram/commands/start"));
bot.command("connect", require("../telegram/commands/connect"));
bot.command("state", require("../telegram/commands/state")); // Debugging

// Handle all messages
bot.hears(/.*/, async ctx => {
  const message = ctx.message.text;

  console.log(ctx.state);

  if (!ctx.state.waitForVerificationCode) {
    await handleUserConnection(ctx, message);
  } else {
    await handleVerificationCode(ctx, message);
  }
});

module.exports = bot;
