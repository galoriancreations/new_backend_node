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

exports.generateRandomString = () => {
  const length = 22;
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
 * Converts a file to a buffer and retrieves its metadata.
 * @param {string} filePath - The path of the file to be converted.
 * @returns {Object|null} - An object containing the file buffer, original name, and mimetype,
 * or null if the conversion fails.
 */
exports.convertFileToMeme = filePath => {
  try {
    console.log(`Converting file at ${filePath}`);

    const buffer = fs.readFileSync(filePath);
    const originalname = path.basename(filePath);
    const mimetype = mime.lookup(filePath) || "application/octet-stream";

    return { buffer, originalname, mimetype };
  } catch (error) {
    console.error(`Failed to convert file at ${filePath}:`, error);
    return null;
  }
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
