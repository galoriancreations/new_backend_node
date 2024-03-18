const { Challenge } = require("../models/challenge");
const { Template } = require("../models/template");
const { calculateDayDifference } = require('../utils/general');

exports.getPublicTemplateID = async (req, res) => {
  try {
    console.log("getPublicTemplateID from controller/challenge.js");

    const { data: names, language } = req.body;

    let template = await Template.findOne(
      {
        name: { $in: names },
        language,
        // isPublic: true
      },
      { language: 1, name: 1 }
    );
    
    if (!template) {
      template = await Template.findOne(
        {
          name: { $in: names },
          language: 'English',
          // isPublic: true
        },
        { language: 1, name: 1 }
      );
    };

    
    if (!template || !template._id) {
      return res.status(404).json({ msg: "No public template found" });
    }
    console.log({ templateId: template._id });

    return res.json(template._id);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getChallengesByName = async (req, res) => {
  try {
    console.log("getChallengesByName from controller/challenge.js");

    const names = req.body;

    const challenges = await Challenge.find(
      { name: { $in: names }, platforms: { $exists: true } },
      { days: 0, preMessages: 0, preDays: 0, selections: 0, scores: 0 }
    );

    const final = await Promise.all(
      challenges.map(async challenge => {
        const template = await Template.findById(challenge.template, {
          language: 1
        });
        if (template) {
          challenge.language = template.language;
          challenge.dayDiff = calculateDayDifference(challenge.date);
          if (challenge.dayDiff > 0) {
            return null;
          }
          const creator = await UsersTest.findById(challenge.creator, {
            organization: 1,
            fullName: 1,
            username: 1
          });
          challenge.creator = creator
            ? creator.organization || creator.fullName || creator.username
            : "unknown";
          return challenge;
        }
      })
    );

    const filteredAndSortedChallenges = final
      .filter(challenge => challenge !== null)
      .sort((a, b) => b.dayDiff - a.dayDiff);

    return res.json(filteredAndSortedChallenges);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
};
