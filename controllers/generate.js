const fs = require("fs");
const { User } = require("../models/user");
const { Template } = require("../models/template");
const { progressEmitter } = require("./progress");
const { generateRandomString } = require("../utils/general");
const {
  generateChallenge,
  replaceImages,
  generateAudio
} = require("../GPT/ChallengeGenerator");

exports.generateTemplate = async (req, res) => {
  console.log("generateTemplate from controller/generate.js");

  // delay of 1 sec for letting the client render the progress bar
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    // try 3 times to create template with ai
    const maxAttempts = 3;
    progressEmitter.emit("progressAttemptsChanged", 0, maxAttempts);
    // create array to store failed templates
    const templates = [];
    for (let i = 0; i < maxAttempts; i++) {
      // update progress attempts
      progressEmitter.emit("progressAttemptsChanged", i + 1, maxAttempts);

      //! simulate attempts for testing
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      // if (i + 1 == maxAttempts) {
      //   //! loop 4 times to simulate images progress
      //   for (let j = 0; j < 4; j++) {
      //     progressEmitter.emit('progressAttemptsChanged', j + 1, 4, 'images');
      //     await new Promise((resolve) => setTimeout(resolve, 2000));
      //   }
      //   for (let j = 0; j < 4; j++) {
      //     progressEmitter.emit('progressAttemptsChanged', j + 1, 4, 'audios');
      //     await new Promise((resolve) => setTimeout(resolve, 2000));
      //   }
      //   return;
      // } else {
      //   continue;
      // }

      console.log(
        `Server attempt ${i + 1} of ${maxAttempts} to create template with AI`
      );

      const user = await User.findById(req.user._id);
      const current_user = user._id;

      // cancel if user not in same page
      if (String(current_user) !== req.body.creator) {
        console.log("User not in same page, cancelling");
        throw "User not in same page, cancelling";
      }

      // get data
      const {
        topic,
        days,
        tasks,
        messages,
        preDays,
        preMessagesPerDay,
        language,
        targetAudience,
        voice
      } = req.body;

      // create template
      const templateId = "t_" + generateRandomString();
      let template = await generateChallenge({
        creator: current_user,
        id: templateId,
        topic,
        days,
        tasks,
        messages,
        preDays,
        preMessages: preMessagesPerDay,
        language: "English", // only english supported for now
        targetAudience,
        numAttempts: 3,
        voice
      });

      if (template?.error) {
        console.error("Failed to create template with AI");
        if (template.response) {
          templates.push(template.response);
        }
        if (i + 1 === maxAttempts) {
          // take the template with the most days
          template =
            templates.length > 1
              ? templates.reduce((prev, current) =>
                  prev.days.length > current.days.length ? prev : current
                )
              : templates[0];
          console.log(
            `No more attempts left, returning template with the most days (#${
              i + 1
            }/${maxAttempts})`
          );
        } else {
          console.log("Trying again");
          continue;
        }
      }

      if (!template || !template.days || !template.days.length) {
        throw template.msg || "Failed to create template with AI";
      }

      // generate images
      await replaceImages({
        challenge: template,
        imageTheme: template.imageTheme,
        callback: (numReplaced, total, theme) => {
          if (theme) {
            console.log("Added imageTheme:", theme);
            return (template.imageTheme = theme);
          }
          progressEmitter.emit(
            "progressAttemptsChanged",
            numReplaced,
            total,
            "images"
          );
        }
      });

      // generate audio for introdction
      await generateAudio(template, voice, (numReplaced, total) => {
        progressEmitter.emit(
          "progressAttemptsChanged",
          numReplaced,
          total,
          "audios"
        );
      });

      // add template to db
      await Template.create(template);

      // add template to user
      const temp = {
        _id: templateId,
        name: template.name,
        isPublic: template.isPublic
      };
      user.templates = [...user.templates, temp];
      //   updateUserInDB(user);

      fs.writeFileSync("GPT/json/failed.json", JSON.stringify(templates));

      // return template
      console.log("Template created successfully");
      return res.status(200).json({ template });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ msg: error });
  }
};
