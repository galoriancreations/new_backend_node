const { getPublicChallenges } = require("../../utils/database");

module.exports = async ctx => {
  const challenges = await getPublicChallenges();

  ctx.reply(
    `Here are the available challenges: \n\n${challenges
      .map(challenge => challenge.name)
      .join("\n")}`
  );
};
