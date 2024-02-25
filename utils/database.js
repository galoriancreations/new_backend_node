const fs = require("fs");
const { User } = require("../models/user");
const { Uploads } = require("../models/uploads");
const crypto = require("crypto");

exports.updateUserInDB = async user => {
  await User.updateOne({ _id: `${user["_id"]}` }, { $set: user });
};

exports.uploadToDB = async (fullFileName, filePath, file) => {
  const fileData = fs.readFileSync(filePath);
  const md5 = crypto.createHash("md5").update(fileData).digest("hex");

  return await Uploads.create({
    name: fullFileName,
    data: fileData,
    contentType: file.mimetype,
    md5
  });
};
