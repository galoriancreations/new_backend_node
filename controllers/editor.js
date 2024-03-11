const { Challenge } = require("../models/challenge");
const { Template } = require("../models/template");
const { User } = require("../models/user");
const { Draft } = require("../models/draft");
const { Group } = require("../models/group");
const { ChallengeArray } = require("../models/challenge-array");
const { generateRandomString } = require("../utils/general");

exports.saveTemplate = async (req, res) => {
  try {
    console.log("saveTemplate from controllers/editor.js");

    const data = req.body;
    const currentUser = req.user._id;
    const user = await User.findOne({ _id: currentUser });
    const isAdmin = req.user.isAdmin;

    const templateData = data.templateData;
    let templateId = data.templateId;

    templateData.creator = currentUser;
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
    return res.status(500).json({ msg: "error occurred" });
  }
};

exports.getTemplateData = async (req, res) => {
  try {
    console.log("getTemplateData from controllers/editor.js");

    const templateId = req.body.data;
    if (!templateId) {
      return res.status(400).json({ error: "Missing templateId" });
    }
    console.log({ templateId });

    const existingTemplate = await Template.findOne({ _id: templateId });
    console.log("Query result:", existingTemplate);

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json(existingTemplate);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error occurred" });
  }
};

exports.saveDraft = async (req, res) => {
  console.log("saveDraft from controllers/editor.js");
  // for now, set draftId to null
  return res.json({ draftId: null });
};

exports.deleteDraft = async (req, res) => {
  console.log("deleteDraft from controllers/editor.js");
  // for now, set draftId to null
  return res.json({ draftId: null });
};

exports.createChallenge = async (req, res) => {
  try {
    console.log("createChallenge from controllers/editor.js");

    const data = req.body.challengeData;
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
    challengeData.scores = [];

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
    user.save();

    await Challenge.create(challengeData);

    // if (verifyNow) {
    //   console.log(`::: VERIFING Challenge ${challengeId}`);
    //   const [verified, err] = verifyChallenge(challengeId, challengeData.creator, challengeData.name, image, challengeData.date);
    //   console.log(`::: VERIFIED ${verified}, ${err}`);
    // }

    const draftId = data.draftId;

    await Draft.deleteOne({ _id: draftId });
    user.drafts = user.drafts.filter(draft => draft !== draftId);

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

    await Group.create(groupChatInfo);
    const arrayItemID = "A_" + generateRandomString();
    const challengeItem = {
      _id: arrayItemID,
      challengeID: challengeId,
      groupID: groupID
    };
    await ChallengeArray.create(challengeItem);
    await user.save();
    return res.json({ groupChatInfo });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error occurred" });
  }
};

exports.getChallengeData = async (req, res) => {
  try {
    console.log("getChallengeData from controllers/editor.js");

    const challengeId = req.body.data;
    let challengeData = await Challenge.findOne({ _id: challengeId });

    if (!challengeData) {
      return res
        .status(404)
        .json({ msg: `Challenge ${challengeId} was not found` });
    }

    const templateData = await Template.findOne({
      _id: challengeData.template
    });

    if (!templateData) {
      return res
        .status(400)
        .json({ msg: `Template ${challengeData.template} was not found` });
    }

    // Update challenge data with template data
    const templateFields = [
      "name",
      "image",
      "language",
      "isPublic",
      "allowCopies",
      "dayMargin",
      "preDays",
      "days"
    ];
    templateFields.forEach(field => {
      if (templateData[field]) {
        challengeData[field] = templateData[field];
      }
    });

    // Default allowCopies to false if not present in templateData
    if (!templateData.hasOwnProperty("allowCopies")) {
      challengeData.allowCopies = false;
    }

    // Update task selections
    if (challengeData.selections) {
      for (let day of challengeData.days) {
        for (let task of day.tasks) {
          const dayId = day.id;
          const taskId = task.id;

          if (
            challengeData.selections[dayId] &&
            challengeData.selections[dayId][taskId]
          ) {
            task.selection = challengeData.selections[dayId][taskId];
          } else if (task.options && task.options.length > 0) {
            task.selection = task.options[0].text;
          } else {
            task.selection = null;
          }
        }
      }
    }

    res.status(200).json(challengeData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error occurred" });
  }
};

exports.deleteChallenge = async (req, res) => {
  try {
    console.log("deleteChallenge from controllers/editor.js");
    const { challengeId } = req.body;

    const user = await User.findOne({ _id: req.user._id });

    if (!user.isAdmin && !user.createdChallenges.includes(challengeId)) {
      return res
        .status(404)
        .json({ msg: `No challenge found with this ID: ${challengeId}` });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res
        .status(404)
        .json({ msg: `No challenge found with this ID: ${challengeId}` });
    }

    await Challenge.deleteOne({ _id: challengeId });

    user.createdChallenges = user.createdChallenges.filter(
      id => id.toString() !== challengeId
    );
    user.challenges = user.challenges.filter(
      id => id.toString() !== challengeId
    );

    await user.save();

    res.status(200).json({
      msg: `Successfully deleted challenge: ${challengeId}`,
      challengeId: challengeId
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error occurred" });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    console.log("deleteTemplate from controllers/editor.js");

    const { templateId } = req.body;
    const idsFromReq = req.body.templateIds;
    const user = await User.findOne({ _id: req.user._id });
    const { isAdmin, templates } = user;

    let templateIds = Array.isArray(idsFromReq) ? idsFromReq : [templateId];
    const msg =
      templateIds.length > 1
        ? `Successfully deleted templates: ${templateIds}`
        : `Successfully deleted template: ${templateIds[0]}`;

    if (
      !isAdmin &&
      !templateIds.every(id =>
        templates.some(templateId => templateId.toString() === id)
      )
    ) {
      return res.status(404).json({ msg: `Template not found ${templateIds}` });
    }

    await Template.deleteMany({ _id: { $in: templateIds } });

    user.templates = templates.filter(
      templateId => !templateIds.includes(templateId.toString())
    );

    await user.save();

    res.status(200).json({ msg, templateIds: templateIds });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error occurred" });
  }
};
