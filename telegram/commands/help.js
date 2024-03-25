const bot = require("./services/telegram");

bot.help(ctx =>
  ctx.reply("You can connect your account to the bot by typing /connect.")
);
