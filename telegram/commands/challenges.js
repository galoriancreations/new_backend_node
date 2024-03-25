const { Markup } = require("telegraf");
const {
  getPublicChallenges,
  getChallengeById,
  getTemplateById
} = require("../../utils/database");
const { getFile } = require("../../utils/files");

exports.botCommandChallenge = async ctx => {
  const challenges = await getPublicChallenges();

  if (!challenges.length) {
    return ctx.reply("No challenges available at the moment.");
  }

  const inlineKeyboard = challenges.map(challenge => [
    Markup.button.callback(challenge.name, `challenge_${challenge.id}`)
  ]);

  await ctx.reply(
    "Here are the available challenges:",
    Markup.inlineKeyboard(inlineKeyboard)
  );
};

exports.botActionChallenge = async ctx => {
  const challengeId = ctx.match[1];
  const challenge = await getChallengeById(challengeId);

  if (!challenge) {
    return ctx.reply("Challenge not found.");
  }

  const template = await getTemplateById(challenge.template);
  if (!template) {
    return ctx.reply("Challenge template not found.");
  }

  ctx.state.selectedChallenge = challenge;
  ctx.state.selectedTemplate = template;

  const image = await getFile(template.image.replace("/uploads/", ""));
  if (!image) {
    return ctx.reply("Error loading the challenge image.");
  }

  await ctx.replyWithPhoto({ source: image }, { caption: challenge.name });
  await this.promptDaySelection(ctx, template.days);
};

exports.promptDaySelection = async (ctx, days) => {
  const inlineKeyboard = days.map((day, i) => [
    Markup.button.callback(day.title, `day_${i}`)
  ]);
  await ctx.reply(
    "Please select a day of the challenge:",
    Markup.inlineKeyboard(inlineKeyboard)
  );
};

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

  const image = await getFile(dayData.image.replace("/uploads/", ""));
  if (image) {
    await ctx.replyWithPhoto({ source: image }, { caption: dayData.title });
  }

  const audio = dayData?.messages[0]?.fileUrl.replace("/uploads/", "");
  if (audio) {
    const audioFile = await getFile(audio);
    if (audioFile) {
      await ctx.replyWithAudio(
        { source: audioFile },
        { caption: dayData.introduction }
      );
    }
  }
};
