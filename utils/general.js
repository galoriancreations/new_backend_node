const mime = require("mime-types");
const path = require("path");
const fs = require("fs");
const { User } = require("../models/user");
const crypto = require("crypto");

// Function to clean up the temp directory
exports.cleanupTempDir = () => {
  const dirPath = path.join(__dirname, "temp");
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
