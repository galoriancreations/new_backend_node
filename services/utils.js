const axios = require('axios');
const sharp = require('sharp');
const mime = require('mime-types');
const path = require('path');
const fs = require('fs');

const downloadImage = async (imageUrl, downloadPath) => {
  // download image and compress with sharp
  try {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    // convert response data to Buffer
    const buffer = Buffer.from(response.data, 'binary');

    // compress image
    await sharp(buffer).jpeg({ quality: 50 }).toFile(downloadPath);

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

function convertFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const originalname = path.basename(filePath);
    const mimetype = mime.lookup(filePath) || 'application/octet-stream';

    return { buffer, originalname, mimetype };
  } catch (error) {
    console.error(`Failed to convert file at ${filePath}:`, error);
    return null;
  }
}

module.exports = { downloadImage, convertFile };
