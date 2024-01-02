const axios = require("axios");
const sharp = require("sharp");
const mime = require("mime-types");
const path = require("path");
const fs = require("fs");
const uniqid = require("uniqid");
const { Uploads } = require("../models/uploads");

/**
 * Uploads a file to the server.
 * @param {Object} req - The request object containing the file to be uploaded.
 * @param {Object} req.files - The file object to be uploaded.
 * @param {Object} req.files.file - The file to be uploaded.
 * @returns {Promise<string|null>} - A promise that resolves to the path of the uploaded file, or null if there was an error.
 */
exports.uploadFile = async req => {
  const { file } = req.files;
  const filetype = file.name.split(".").at(-1);
  const originalName = file.name.split(".")[0];
  const filename = originalName + "_" + uniqid();
  const fullFileName = filename + "." + filetype;
  const folderPath = "./uploads/" + filename;
  const filePath = folderPath + "." + filetype;
  await file.mv(filePath);
  return "/uploads/" + fullFileName;
};

/**
 * Uploads a file to the database.
 * @param {Object} file - The file object to be uploaded.
 * @param {string} file.originalname - The original name of the file.
 * @param {Buffer} file.buffer - The file content as a Buffer object.
 * @param {string} file.mimetype - The MIME type of the file.
 * @returns {Promise<Object|null>} - A promise that resolves to the uploaded file object in the database, or null if the file object is invalid.
 */
exports.uploadFileToDB = async file => {
  if (!file || !file.originalname || !file.buffer || !file.mimetype) {
    console.log("Invalid file object");
    return null;
  }

  const fileInDB = await Uploads.create({
    name: file.originalname,
    data: file.buffer,
    contentType: file.mimetype
  });

  return fileInDB;
};

/**
 * Downloads an image from a given URL and saves it to the specified download path.
 * The image can be compressed and converted to different formats using the Sharp library.
 *
 * @param {Object} options - The options for downloading and compressing the image.
 * @param {string} options.imageUrl - The URL of the image to download.
 * @param {string} options.downloadPath - The path where the downloaded image will be saved.
 * @param {number} [options.quality=50] - The quality of the compressed image (0-100).
 * @param {string} [options.type='jpeg'] - The output image format (jpeg, png, webp, tiff, avif, heif, raw, gif).
 * @param {number} [options.tranparency=1] - The transparency level of the output image (0-1).
 *
 * @returns {Promise<string|null>} A promise that resolves with the download path if successful, or null if there was an error.
 */
exports.downloadImage = async ({
  imageUrl,
  downloadPath,
  quality = 50,
  type = "jpeg",
  tranparency = 1
}) => {
  // download image and compress with sharp
  try {
    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "arraybuffer"
    });

    // convert response data to Buffer
    const buffer = Buffer.from(response.data, "binary");

    // compress image based on type
    switch (type) {
      case "jpeg":
        await sharp(buffer).jpeg({ quality }).toFile(downloadPath);
        break;
      case "png":
        const tempPath = `./temp/${Date.now()}-temp.png`;
        await sharp(buffer).png({ quality }).toFile(tempPath);
        await sharp(tempPath).ensureAlpha(tranparency).toFile(downloadPath);
        break;
      case "webp":
        await sharp(buffer).webp({ quality }).toFile(downloadPath);
        break;
      case "tiff":
        await sharp(buffer).tiff({ quality }).toFile(downloadPath);
        break;
      case "avif":
        await sharp(buffer).avif({ quality }).toFile(downloadPath);
        break;
      case "heif":
        await sharp(buffer).heif({ quality }).toFile(downloadPath);
        break;
      case "raw":
        await sharp(buffer).raw({ quality }).toFile(downloadPath);
        break;
      case "gif":
        await sharp(buffer).gif({ quality }).toFile(downloadPath);
        break;
      default:
        console.error(`Invalid image type: ${type}`);
        return null;
    }

    // console.log(`Image downloaded as ${downloadPath}`);
    return downloadPath;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error downloading image: ${error.message}`);
    }
    fs.unlink(downloadPath, () => {});
    return null;
  }
};

// Function to clean up the temp directory
function cleanupTempDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const filePath = path.join(dirPath, file);
      fs.unlinkSync(filePath);
    });
  }
}

// Clean up the temp directory when the application starts
const tempDir = path.join(__dirname, "temp");
cleanupTempDir(tempDir);
