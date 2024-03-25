const fs = require("fs");
const crypto = require("crypto");
const { User } = require("../models/user");
const { Uploads } = require("../models/uploads");
const { Draft } = require("../models/draft");
const { Challenge } = require("../models/challenge");
const { Template } = require("../models/template");

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

exports.findDraftInDB = async id =>
  await Draft.findOne({ _id: id }, { days: 0, preMessages: 0, preDays: 0 });

exports.getPublicChallenges = async () =>
  await Challenge.find({ isPublic: true });

exports.getChallengeById = async id => await Challenge.findById(id);

exports.getTemplateById = async id => await Template.findById(id);
