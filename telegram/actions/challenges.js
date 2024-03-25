const { Markup } = require("telegraf");
const { getChallengeById, getTemplateById } = require("../../utils/database");
const { getFileNoPath } = require("../helpers");

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

  const image = await getFileNoPath(template.image);
  if (image) {
    await ctx.replyWithPhoto({ source: image }, { caption: challenge.name });
  }

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
