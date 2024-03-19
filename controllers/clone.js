const { User } = require("../models/user");
const { Template } = require("../models/template");
const { generateRandomString } = require("../utils/general");
const { updateUserInDB } = require("../utils/database");

exports.cloneTemplate = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId });
    const current_user = user._id;

    const isAdmin = user["isAdmin"];

    let final = {};
    // let userData = {};
    // const userDoc = user.toObject();
    // for (let key in userDoc) {
    //   if (userDoc.hasOwnProperty(key)) {
    //     userData[key] = userDoc[key];
    //   }
    // }
    // final["logged_in_as"] = current_user;
    let originId = req.body.cloneTemplate;
    let originTemplate = await Template.findOne({_id: `${originId}` });

    if (
      originTemplate === null ||
      (user["templates"].find(val => val === originId) === undefined &&
        !originTemplate["isPublic"])
    ) {
      return res.status(404).json({ msg: `Template not found ${originId}` });
    }
    let newTemplate = {};

    const originDoc = originTemplate.toObject();
    for (let key in originDoc) {
      newTemplate[`${key}`] = originTemplate[`${key}`];
    }

    let newId = "t_" + generateRandomString();
    newTemplate["_id"] = newId;
    newTemplate["isPublic"] = originTemplate["isPublic"] && isAdmin;
    newTemplate["name"] = `${originTemplate["name"]} (copy)`;
    newTemplate["creator"] = current_user;
    await Template.create(newTemplate);
    let temp = {
      _id: newId,
      name: newTemplate["name"],
      isPublic: newTemplate["isPublic"]
    };
    user["templates"] = [...user["templates"], temp];
    updateUserInDB(user);
    let excludedKeys = ["days", "preDays", "preMessages"];

    for (let key in newTemplate) {
      if (!excludedKeys.includes(key)) {
        newTemplate[key] = newTemplate[key];
      }
    }

    newTemplate["creator"] = user["phone"];
    Object.assign(final, { newTemplate });
    console.log(newTemplate);
    return res.status(200).json( final );
  } catch (error) {
    console.error(error);
    return res.status(400).json({ msg: "Internal server error" });
  }
};
