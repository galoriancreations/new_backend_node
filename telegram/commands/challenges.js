const { Markup } = require("telegraf");
const { getPublicChallenges } = require("../../utils/database");

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
