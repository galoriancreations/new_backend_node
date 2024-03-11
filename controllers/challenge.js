const { Challenge } = require("../models/challenge");
const { Template } = require("../models/template");

exports.getPublicTemplateID = async (req, res) => {
  try {
    const names = req.body;
    console.log({ names });
    console.log({ userLang: req.user.language });
    const template = await Template.findOne(
      {
        name: { $in: names },
        // isPublic: true
      },
      { language: 1, name: 1 }
    );
    console.log({ templateId: template?._id });

    if (!template) {
      return res.status(404).json({ msg: "No public template found" });
    }

    return res.status(200).json(template._id);
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

    let final = await Promise.all(
      challenges.map(async challenge => {
        const templateId = challenge.template;
        const template = await Template.findOne(
          { _id: templateId },
          { language: 1 }
        );
        if (template !== null) {
          challenge.language = template.language;
          challenge.dayDiff = calculateDayDifference(challenge.date);
          if (challenge.dayDiff <= 0) {
            return challenge;
          }
        }
      })
    );
    // final has undefined values, need to filter them, can't be done in the map
    final = final.filter(challenge => challenge !== undefined);
    // also sort method doesn't work in the map
    final.sort((a, b) => b.dayDiff - a.dayDiff);

    for (let i = 0; i < final.length; i++) {
      const creator = await UsersTest.findOne(
        // Crash sometimes because creator is null, need to check
        { _id: final[i]?.creator },
        { organization: 1, fullName: 1, username: 1 }
      );

      if (!creator) {
        final[i].creator = "unknown";
        continue;
      }

      final[i].creator =
        creator.organization || creator.fullName || creator.username;
    }

    return res.status(200).json(final);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
};
