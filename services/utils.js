const axios = require('axios');
const sharp = require('sharp');
const mime = require('mime-types');
const path = require('path');
const fs = require('fs');

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
const downloadImage = async ({
  imageUrl,
  downloadPath,
  quality = 50,
  type = 'jpeg',
  tranparency = 1,
}) => {
  // download image and compress with sharp
  try {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    // convert response data to Buffer
    const buffer = Buffer.from(response.data, 'binary');

    // compress image based on type
    switch (type) {
      case 'jpeg':
        await sharp(buffer).jpeg({ quality }).toFile(downloadPath);
        break;
      case 'png':
        const tempPath = `./temp/${Date.now()}-temp.png`;
        await sharp(buffer).png({ quality }).toFile(tempPath);
        await sharp(tempPath).ensureAlpha(tranparency).toFile(downloadPath);
        break;
      case 'webp':
        await sharp(buffer).webp({ quality }).toFile(downloadPath);
        break;
      case 'tiff':
        await sharp(buffer).tiff({ quality }).toFile(downloadPath);
        break;
      case 'avif':
        await sharp(buffer).avif({ quality }).toFile(downloadPath);
        break;
      case 'heif':
        await sharp(buffer).heif({ quality }).toFile(downloadPath);
        break;
      case 'raw':
        await sharp(buffer).raw({ quality }).toFile(downloadPath);
        break;
      case 'gif':
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
function convertFileToMeme(filePath) {
  try {
    console.log(`Converting file at ${filePath}`);
    
    const buffer = fs.readFileSync(filePath);
    const originalname = path.basename(filePath);
    const mimetype = mime.lookup(filePath) || 'application/octet-stream';

    return { buffer, originalname, mimetype };
  } catch (error) {
    console.error(`Failed to convert file at ${filePath}:`, error);
    return null;
  }
}

module.exports = { downloadImage, convertFileToMeme };
