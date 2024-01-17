const { Challenge } = require("../models/challenge");
const { Template } = require("../models/template");
const { User } = require("../models/user");
const { Draft } = require("../models/draft");
const { generateRandomString } = require("../util/functions");

exports.saveTemplate = async (req, res) => {
  try {
    console.log("saveTemplate from controllers/editor.js");

    const data = req.body;
    console.log({ data });
    const currentUser = req.user._id;
    const user = await User.findOne({ _id: currentUser });
    const isAdmin = req.user.isAdmin;

    const templateData = data.templateData;
    let templateId = data.templateId;

    templateData.creator = currentUser;
    console.log({ currentUser });
    templateData.lastSave = new Date();

    // if templateId is null, generate a new one
    if (!templateId) {
      templateId = "t_" + generateRandomString();
    }
    templateData._id = templateId;
    templateData.id = templateId;

    // if admin, set template to public
    if (isAdmin) {
      templateData.isPublic = true;
    }

    // check if template exists in db
    const existingTemplate = await Template.findOne({ _id: templateId });
    if (existingTemplate) {
      console.log("updating existing template:", templateData._id);
      // update existing template
      await Template.updateOne({ _id: templateId }, { $set: templateData });
      const index = user.templates.indexOf(templateId);
      if (index === -1) {
        user.templates.push(templateId);
      } else {
        user.templates[index] = templateId;
      }
    } else {
      // create a new template
      console.log("creating new template:", templateData._id);
      console.log("templateId:", templateId);
      await Template.create(templateData);
      user.templates.push(templateId);
    }

    await user.save();
    return res.json({ logged_in_as: currentUser, templateId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "error accured" });
  }
};

exports.saveDraft = async (req, res) => {
  // for now, set draftId to null
  return res.json({ draftId: null });
};

exports.getTemplateData = async (req, res) => {
  try {
    const templateId = req.body.data;
    if (!templateId) {
      return res.status(400).json({ error: "Missing templateId" });
    }
    console.log({ templateId });
    // check if template exists in db
    const existingTemplate = await Template.findOne({ _id: templateId });
    if (!existingTemplate) {
      // return 404 if template not found
      return res.status(404).json({ error: "Template not found" });
    }

    // return template data
    return res.json(existingTemplate);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "error accured" });
  }
};

exports.deleteDraft = async (req, res) => {
  // for now, set draftId to null
  return res.json({ draftId: null });
};

exports.createChallenge = async (req, res) => {
  console.log("createChallenge from controllers/editor.js");

  const data = req.body.challengeData;
  console.log({ data });
  const current_user = req.user._id;
  const user = await User.findOne({ _id: current_user });
  const isAdmin = req.user.isAdmin;
  let verifyNow = false;

  const templateId = data.templateId;
  const challengeData = {
    template: templateId,
    selections: data.selections,
    name: data.name,
    date: data.date
  };

  challengeData.active = false;
  challengeData.declined = false;

  if (!("isPublic" in challengeData)) {
    challengeData.isPublic = true;
  }
  challengeData.createdOn = Date.now();
  challengeData.creator = current_user;
  challengeData.scores = {};

  const challengeId = "c_" + generateRandomString();
  challengeData._id = challengeId;

  const template = await Template.findOne({ _id: templateId });

  if (!template) {
    return res
      .status(400)
      .json({ msg: `No template found with this ID: ${templateId}` });
  }

  let image = null;
  if (template.image && template.image.length > 0) {
    image = template.image.slice(1);
  }

  if (isAdmin || template.isPublic) {
    challengeData.verified = true;
    verifyNow = true;
  } else {
    challengeData.verified = false;
  }

  // Temporary code
  verifyNow = true;
  challengeData.verified = true;

  user.challenges.push(challengeId);
  user.createdChallenges.push(challengeId);
  await Challenge.insertMany(challengeData);

  if (verifyNow) {
    console.log(`::: VERIFING Challenge ${challengeId}`);
    //// const [verified, err] = verifyChallenge(challengeId, challengeData.creator, challengeData.name, image, challengeData.date);
    //// console.log(`::: VERIFIED ${verified}, ${err}`);
  }

  const draftId = data.draftId;

  await Draft.deleteOne({ _id: draftId });
  user["drafts"] = user["drafts"].filter(draft => draft !== draftId);

  const groupID = "g_" + generateRandomString();

  const username = user.username ? user.username : "Jhon Doe";
  const groupChatInfo = {
    _id: groupID,
    challengeID: challengeId,
    invite: "",
    name: `${challengeData.name} group chat`,
    users: [{ userid: user._id, role: "admin", username: username }],
    messages: [],
    botMessage: [{ text: "welcome to the group", ind: 0 }],
    emoji: [],
    scored: []
  };
  user.groups.push({
    _id: groupID,
    name: `${challengeData.name} group chat`
  });

  // await GroupsDB.insertMany(groupChatInfo);
  const arrayItemID = "A_" + generateRandomString();
  const challengeItem = {
    _id: arrayItemID,
    challengeID: challengeId,
    groupID: groupID
  };
  // await ChallengeArray.insertMany(challengeItem);
  await user.save();
  return res.json({ groupChatInfo });
};
