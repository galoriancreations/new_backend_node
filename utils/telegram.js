exports.generateRandomCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000);

  return code;
};

// Function to format challenge data into a question and options
exports.formatChallengeData = challenge => {
  const challengeNumber = Object.keys(challenge)[0];
  const tasks = challenge[challengeNumber];
  const question = `Challenge ${challengeNumber}: Select a task to complete:`;
  let options = Object.values(tasks);

  // Truncate options to fit within the 100 character limit
  let totalLength = 0;
  options = options.map(option => {
    const availableLength = 100 - totalLength - (options.length - 1); // Account for commas between options
    if (option.length > availableLength) {
      option = option.substring(0, availableLength - 3) + "...";
    }
    totalLength += option.length + 1; // +1 for the comma
    return option;
  });

  return { question, options };
};
