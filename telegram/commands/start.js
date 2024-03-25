module.exports = async ctx => {
  const dayData = ctx.state.selectedDay;

  if (!dayData) {
    return ctx.reply("Please select a day first by typing /challenges.");
  }
};
