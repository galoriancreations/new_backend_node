module.exports = async ctx =>
  ctx.reply(`[DEBUG] Your current state is: ${JSON.stringify(ctx.state, null, 2)}`);
