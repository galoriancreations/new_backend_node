// In-memory data store
const dataStore = {};

/**
 * Middleware to set the default data for the context
 * @param {Object} ctx - The context object
 * @param {Function} next - The next middleware function
 */
module.exports = async (ctx, next) => {
  if (!ctx.from) {
    return next();
  }

  const userId = ctx.from.id;

  // Initialize data for the user if it doesn't exist
  if (!dataStore[userId]) {
    dataStore[userId] = {
      waitForVerificationCode: false,
      currentUser: null,
      selectedChallenge: null,
      selectedTemplate: null,
      selectedDay: null
    };
  }

  // Set ctx.state to the user's data
  ctx.state = dataStore[userId];

  return next();
};
