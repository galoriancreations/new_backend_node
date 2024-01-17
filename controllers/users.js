const { User } = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloneDeep = require("clone-deep");
const { Template } = require("../models/template");
const { Challenge } = require("../models/challenge");

exports.registerUser = async (req, res) => {
  try {
    const {
      username,
      phone,
      fullName,
      organization,
      country,
      memberName,
      memberRole,
      email,
      language,
      accountType,
      password
    } = req.body;
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ msg: "This username already exists" });
    }
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ msg: "A user with this phone nummer already exists" });
    }
    const user = new User({
      username,
      phone,
      fullName,
      organization,
      country,
      memberName,
      memberRole,
      email,
      language,
      accountType
    });
    user.password = await bcrypt.hash(password, 12);
    const createdUser = await user.save();
    const clonedUser = cloneDeep(createdUser._doc);
    delete clonedUser.password;
    const token = jwt.sign({ user: clonedUser }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d"
    });
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + 1);
    res
      .status(201)
      .json({ user: clonedUser, access_token: token, exp: expiresIn });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error accured" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("login req.body", req.body);
    const user = await User.findOne({ phone });
    if (!user) {
      return res
        .status(401)
        .json({ msg: "Phone number or password are incorrect" });
    }
    console.log("user phone", user.phone);
    if (user.password) {
      const isPasswordMatching = await bcrypt.compare(password, user.password);
      if (!isPasswordMatching) {
        return res
          .status(401)
          .json({ message: "Phone number or password are incorrect" });
      }
    }
    const clonedUser = cloneDeep(user._doc);
    delete clonedUser.password;
    const token = jwt.sign({ user: clonedUser }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d"
    });
    const expiresIn = new Date();
    expiresIn.setDate(expiresIn.getDate() + 1);
    return res.json({ user: clonedUser, access_token: token, exp: expiresIn });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error accured" });
  }
};
exports.editProfile = async (req, res) => {
  try {
    console.log("editProfile from controllers/users.js");

    const allowedChanges = [
      "username",
      "phone",
      "email",
      "fullName",
      "image",
      "language",
      "memberName",
      "memberRole",
      "organization",
      "city",
      "country"
    ];

    const user = await User.findOne({ _id: req.user._id });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const newData = req.body;

    allowedChanges.forEach(key => {
      if (newData.hasOwnProperty(key)) {
        user[key] = newData[key];
      }
    });

    await user.save();

    const userDoc = user.toObject();
    const userData = { ...userDoc };

    const userDrafts = {};

    if (userData.hasOwnProperty("drafts")) {
      for (let draftID in userData.drafts) {
        let result = await findDraftInDB(draftID);
        if (result != null) {
          userDrafts[draftID] = {
            _id: result._id,
            name: result.name,
            language: result.language
          };
          if (result.hasOwnProperty("challengeId")) {
            userDrafts[draftID].challengeId = result.challengeId;
          }
        }
      }
    }
    userData.drafts = userDrafts;

    userData.challenges = {};

    const createdChallenges = {};

    if (userData.hasOwnProperty("createdChallenges")) {
      for (let i = 0; i < userData.createdChallenges.length; i++) {
        const challengeId = userData.createdChallenges[i];
        const challenge = await Challenge.findOne({ _id: challengeId });
        if (challenge != null) {
          const templateId = challenge.template;
          const template = await Template.findOne({ _id: templateId });
          if (template != null) {
            challenge.name = template.name;
            challenge.language = template.language;
            if (template.hasOwnProperty("dayMargin")) {
              challenge.dayMargin = template.dayMargin;
            }
            createdChallenges[challengeId] = challenge;
          }
        }
      }
    }

    userData.createdChallenges = createdChallenges;

    const final = {
      logged_in_as: req.user._id,
      user: userData
    };

    console.log("final", final);
    return res.json(final);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error occurred" });
  }
};

exports.getAvailableTemplates = async (req, res) => {
  try {
    console.log("getAvailableTemplates from controllers/users.js");

    const user = await User.findOne({ _id: req.user._id });
    const publicTemplates = await Template.find({ isPublic: true });
    const userPrivateTemplates = await Template.find({
      _id: { $in: user.templates },
      isPublic: false
    });

    const templates = publicTemplates
      .concat(userPrivateTemplates)
      .filter(val => val != null);
    return res.json({ templates });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error occurred" });
  }
};

exports.getPublicTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ isPublic: true });
    return res.json({ templates });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error accured" });
  }
};
