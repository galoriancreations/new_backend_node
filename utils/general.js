const mime = require("mime-types");
const path = require("path");
const fs = require("fs");
const { User } = require("../models/user");
const crypto = require("crypto");

exports.cleanupTempDir = () => {
  const dirPath = path.join(__dirname, "..", "temp");
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      fs.unlinkSync(filePath);
    });
  }
};

/**
 * Generate a random string of a specified length.
 * @param {number} length - The length of the string to generate.
 * @returns {string} - The generated string.
 */
exports.generateRandomString = (length = 22) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};

/**
 * Generate a random code of a specified length.
 * @param {number} length - The length of the code to generate.
 * @returns {string} - The generated code.
 */
exports.generateRandomCode = (length = 6) => {
  const characters = "0123456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters.charAt(randomIndex);
  }

  return code;
};

/**
 * Calculate the difference between two dates
 *
 * @param {String} date The date to calculate the difference from
 * @returns {Number} The difference in days
 *
 * @example
 * const dayDiff = calculateDayDifference('2021-01-01');
 * console.log(dayDiff); // 10
 */
exports.calculateDayDifference = date => {
  const today = new Date();
  const challengeDate = new Date(date);
  const timeDiff = challengeDate.getTime() - today.getTime();
  const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return dayDiff;
};
