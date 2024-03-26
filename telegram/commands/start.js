module.exports = async ctx => {
  const { selectedDay } = ctx.state;

  if (!selectedDay) {
    return ctx.reply("Please select a day first by typing /challenges.");
  }

  await ctx.reply(
    "Please choose an action:",
    Markup.inlineKeyboard([
      Markup.button.callback("Start the day", "start_day"),
      Markup.button.callback("Skip the day", "skip_day")
    ])
  );

  await ctx.reply(`Message of the day: ${selectedDay.messages[1].content}`);
};
