const { getFileNoPath } = require("../helpers");

exports.botActionDay = async ctx => {
  const dayIndex = Number(ctx.match[1]);
  const { selectedChallenge: challenge, selectedTemplate: template } =
    ctx.state;

  if (!challenge) {
    return ctx.reply("Please select a challenge first by typing /challenges.");
  }

  if (dayIndex < 0 || dayIndex >= template.days.length) {
    return ctx.reply("Invalid day selected.");
  }

  const dayData = template.days[dayIndex];

  await ctx.reply(
    `You have selected day #${dayIndex + 1} of the challenge: ${challenge.name}`
  );

  const image = await getFileNoPath(dayData.image);
  if (image) {
    await ctx.replyWithPhoto({ source: image }, { caption: dayData.title });
  }

  const audio = await getFileNoPath(dayData?.messages[0]?.fileUrl);
  if (audio) {
    await ctx.replyWithAudio(
      { source: audio },
      { caption: dayData.introduction }
    );
  }

  ctx.state.selectedDay = dayData;

  await ctx.reply("Please type /start to start the day.");
};
