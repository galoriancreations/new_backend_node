const { Template } = require("../models/template");
const { User } = require("../models/user");
const { generateRandomString } = require("../util/functions");

exports.saveTemplate = async (req, res) => {
  const data = req.body;
  console.log(`data is: ${data}`);
  const current_user = req.user._id;
  const isAdmin = req.user.isAdmin;
  let user = await User.findOne({ _id: current_user });

  let templateId = data.templateId;
  console.log(`template id is: ${templateId}`);
  let templateData = data.templateData;

  templateData.creator = current_user;
  templateData.lastSave = new Date();

  if (templateId == null) {
    templateId = `t_${generateRandomString()}`;
    templateData._id = templateId;
    if (!isAdmin) {
      templateData.isPublic = false;
    }
    const template = await Template.create(templateData);
    user.templates.push(template._id);
  } else {
    const existingTemplate = await Template.findById(templateId);
    if (existingTemplate) {
      // Update the existing template
      await Template.updateOne({ _id: templateId }, templateData);
    } else {
      // Create a new template
      templateData.isPublic = false;
      const template = await Template.create(templateData);
      user.templates.push(template._id);
    }
  }

  await user.save();

  return res.json({
    logged_in_as: current_user,
    templateId
  });
};

exports.saveDraft = async (req, res) => {
  return res.json({ draftId: null });
};
