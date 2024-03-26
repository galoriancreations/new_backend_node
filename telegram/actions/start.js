module.exports = async ctx => {
  const { selectedDay } = ctx.state;

  if (!selectedDay) {
    return ctx.reply("Please select a day first by typing /challenges.");
  }

  await ctx.reply(`You have started the day: ${selectedDay.title}`);
};
