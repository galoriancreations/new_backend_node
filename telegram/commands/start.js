const bot = require("./services/telegram");

bot.start(ctx =>
  ctx.reply(
    "Hello, I'm the Ting.Global bot!\nType /connect to connect your account to the bot."
  )
);
