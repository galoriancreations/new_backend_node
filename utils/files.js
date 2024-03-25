const fs = require("fs");
const axios = require("axios");
const sharp = require("sharp");
const uniqid = require("uniqid");
const mime = require("mime");
const path = require("path");
const { uploadToDB } = require("./database");
const { Uploads } = require("../models/uploads");

/**
 * Uploads a file to the server.
 * @param {Object} req - The request object containing the file to be uploaded.
 * @param {Object} req.files - The file object to be uploaded.
 * @param {Object} req.files.file - The file to be uploaded.
 * @returns {Promise<string|null>} - A promise that resolves to the path of the uploaded file, or null if there was an error.
 */
exports.uploadFile = async req => {
  if (!req.files || !req.files.file) {
    throw new Error("No file provided");
  }

  const { file } = req.files;
  const [originalName, filetype] = file.name.split(".");
  const filename = `${originalName}_${uniqid()}`;
  const fullFileName = `${filename}.${filetype}`;
  const folderPath = `temp/${filename}`;
  const filePath = `${folderPath}.${filetype}`;

  await file.mv(filePath);
  await uploadToDB(fullFileName, filePath, file);

  return `/uploads/${fullFileName}`;
};

/**
 * Uploads a file to the database.
 * @param {Object} file - The file object to be uploaded.
 * @param {string} file.originalname - The original name of the file.
 * @param {Buffer} file.buffer - The file content as a Buffer object.
 * @param {string} file.mimetype - The MIME type of the file.
 * @returns {Promise<Object|null>} - A promise that resolves to the uploaded file object in the database, or null if the file object is invalid.
 */
exports.uploadFileToDB = async filePath => {
  const meme = this.convertFileToBuffer(filePath);
  if (!meme || !meme.originalname || !meme.buffer || !meme.mimetype) {
    throw new Error("Invalid file object");
  }

  await uploadToDB(meme.originalname, filePath, meme);
  return `/uploads/${meme.originalname}`;
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
  if (fs.existsSync(downloadPath)) {
    console.log(`Image already exists at ${downloadPath}`);
    return downloadPath;
  }

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

/**
 * Converts a file to a buffer and retrieves its metadata.
 * @param {string} filePath - The path of the file to be converted.
 * @returns {Object|null} - An object containing the file buffer, original name, and mimetype,
 * or null if the conversion fails.
 */
exports.convertFileToBuffer = filePath => {
  try {
    const buffer = fs.readFileSync(filePath);
    const originalname = path.basename(filePath);
    const mimetype = mime.getType(filePath) || "application/octet-stream";

    return { buffer, originalname, mimetype };
  } catch (error) {
    console.error(`Failed to convert file at ${filePath}:`, error);
    return null;
  }
};

/**
 * Retrieves the data of a file from the database or the temp directory.
 * @param {string} name - The ID of the file to retrieve.
 * @returns {Object|null} - The file data object containing the file content and content type,
 * or null if the file is not found.
 */
exports.getFileData = async name => {
  const tempDir = path.resolve(__dirname, "..", "temp");
  const tempFilePath = path.join(tempDir, name);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  if (fs.existsSync(tempFilePath)) {
    console.log("File found in temp directory:", name);
    return {
      data: fs.readFileSync(tempFilePath),
      contentType: mime.getType(tempFilePath) || "application/octet-stream"
    };
  }

  const file = await Uploads.findOne({ name: name });
  if (!file || !file.data) {
    console.log("File not found:", name);
    return null;
  }

  console.log("File found in database:", name);
  fs.writeFileSync(tempFilePath, file.data);

  return {
    data: file.data,
    contentType: file.contentType
  };
};

exports.getFile = async fileId => {
  // check if file exists in temp if not check in db and save in temp
  if (!fs.existsSync("temp")) {
    fs.mkdirSync("temp");
  }

  let fileData;
  const tempFilePath = path.join("temp", fileId);
  if (!fs.existsSync(tempFilePath)) {
    const file = await Uploads.findOne({ name: fileId });
    if (!file || !file.data) {
      console.log("File not found:", fileId);
      return null;
    }
    fs.writeFileSync(tempFilePath, file.data);
    fileData = file.data;
  } else {
    // read the file from the temp directory
    fileData = fs.readFileSync(tempFilePath);
  }

  return fileData;
};
