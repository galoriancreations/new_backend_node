const { Router } = require("express");
const multer = require("multer");
const upload = multer({ storage });

const router = Router();

router.post("/", upload.single("image"), async (req, res) => {
  //i cant use hasOwnProperty method like i use in below
  // instead i using Object.hasOwn
  if (Object.hasOwn(req.body, "register")) {
    const image = {
      name: "",
      data: "",
      contentType: ""
    };

    if (req.file) {
      // Read the uploaded file as a Buffer
      const fileBuffer = req.file.buffer;
      // Convert the Buffer to a Base64-encoded string
      const base64Data = fileBuffer.toString("base64");
      // structure how image will be stored in DB
      image.name = req.file.originalname;
      image.data = base64Data;
      image.contentType = req.file.mimetype;

      console.log("photo uploaded");
    }
    //parse body from JSON to object
    let parseredRegister = JSON.parse(req.body.register);

    //check all propertise of parseredRegister object:
    for (const keyTest in parseredRegister) {
      console.log(`${keyTest}: ${parseredRegister[keyTest]}`);
    }

    let _username = parseredRegister.username;
    let _phone = parseredRegister.phone;
    _phone = _phone.replace("+", "");
    //if a name dosent already exists in DB
    if ((await User.findOne({ username: `${_username}` })) == null) {
      //if a phone dosent already exists in DB
      if ((await User.findOne({ phone: `${_phone}` })) == null) {
        let temp = {
          _id: _phone,
          username: _username,
          phone: _phone,
          fullName: parseredRegister.fullName,
          organization: parseredRegister.organization,
          country: parseredRegister.country,
          memberName: "",
          memberRole: "",
          email: parseredRegister.email,
          language: parseredRegister.language,
          accountType: parseredRegister.accountType,
          templates: [],
          drafts: [],
          challenges: [],
          createdChallenges: [],
          players: [],
          isAdmin: false,
          image: image
        };
        console.log("API: all properties for a new user assigned");
        //add new user to DB
        addUserToDb(temp);
        let [token, exp] = getToken(temp.phone);
        res.status(200).json({ access_token: token, exp: exp, user: temp });
      } else {
        res
          .status(200)
          .json("Oops! This phone is already taken,\nplease choose another :)");
        return;
      }
    } else {
      res
        .status(200)
        .json(
          "Oops! This username is already taken,\nplease choose another :)"
        );
      return;
    }
  } else {
    if (req.body.hasOwnProperty("getTopPlayers")) {
      const players = await Player.find();
      let newPlayers = players.map(player => playerData(player));
      if (newPlayers.length > 18) {
        newPlayers = newPlayers.slice(0, 18);
      }
      newPlayers.sort((a, b) => b.totalScore - a.totalScore);
      function playerData(player) {
        const pData = {};
        const keys = ["userName", "fullName", "phone", "totalScore", "stats"];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (player._doc.hasOwnProperty(key)) {
            pData[key] = player._doc[key];
          } else {
            pData[key] = null;
          }
        }
        return pData;
      }
      res.status(200).json(newPlayers);
    } else if (req.body.hasOwnProperty("checkUsername")) {
      let check = await User.findOne({
        username: `${req.body.checkUsername}`
      });
      let [result, message] = [false, ""];
      if (check == null) {
        [result, message] = [
          true,
          `Great! you can register with username: ${req.body.checkUsername}`
        ];
      } else {
        [result, message] = [
          false,
          "Oops! This username is already taken,\nplease choose another :)"
        ];
      }
      res.status(200).json({ result: result, msg: message });
    }

    if (req.body.hasOwnProperty("checkPhone")) {
      let phoneNum = req.body.checkPhone;
      phoneNum = phoneNum.replace("+", "");
      let check = await User.findOne({ phone: `${phoneNum}` });
      let [result, message] = [false, ""];
      if (check == null) {
        [result, message] = [
          true,
          `Great! you can register with this phone: ${req.body.checkPhone}`
        ];
      } else {
        [result, message] = [
          false,
          "Oops! This phone is already taken,\nplease choose another :)"
        ];
      }
      res.status(200).json({ result: result, msg: message });
    }

    if (req.body.hasOwnProperty("register")) {
      let _username = req.body.register.username;
      let _phone = req.body.register.phone;
      _phone = _phone.replace("+", "");
      if ((await User.findOne({ username: `${_username}` })) == null) {
        if ((await User.findOne({ phone: `${_phone}` })) == null) {
          let temp = {
            _id: _phone,
            username: _username,
            phone: _phone,
            fullName: req.body.register.fullName,
            organization: req.body.register.organization,
            country: req.body.register.country,
            memberName: "",
            memberRole: "",
            email: req.body.register.email,
            language: req.body.register.language,
            accountType: req.body.register.accountType,
            templates: [],
            drafts: [],
            challenges: [],
            createdChallenges: [],
            players: [],
            isAdmin: false
          };
          console.log("work");
          addUserToDb(temp);

          let [token, exp] = getToken(temp.phone);

          res.status(200).json({ access_token: token, exp: exp, user: temp });
        } else {
          res
            .status(200)
            .json(
              "Oops! This phone is already taken,\nplease choose another :)"
            );
          return;
        }
      } else {
        res
          .status(200)
          .json(
            "Oops! This username is already taken,\nplease choose another :)"
          );
        return;
      }
    }
    if (req.body.hasOwnProperty("signIn")) {
      console.log("hi");
      let phoneNum = req.body.signIn.phone;
      phoneNum = phoneNum.replace("+", "");
      let userData = await User.findOne({ phone: `${phoneNum}` });
      if (userData != null) {
        let [token, exp] = getToken(userData["phone"]);
        res.status(200).json({ access_token: token, exp: exp, user: userData });
      }
    } else if (req.body.hasOwnProperty("getChallengeData")) {
      data = req.body;
      let challengeData = await Challenge.findOne({
        _id: `${data["getChallengeData"]}`
      });
      if (challengeData == null) {
        return res.status(404).json({
          msg: `Challenge ${data["getChallengeData"]} was not found`
        });
      }
      templateData = await Template.findOne({
        _id: `${challengeData["template"]}`
      });
      if (templateData == null) {
        return res.status(400).json({
          msg: `template ${challengeData["template"]} was not found`
        });
      }

      challengeData["name"] = templateId["name"];

      challengeData["image"] = templateId["image"];

      challengeData["language"] = templateData["language"];

      challengeData["isPublic"] = templateData["isPublic"];

      if (!templateData.hasOwnProperty("allowCopies")) {
        templateData["allowCopies"] = false;
      }

      challengeData["allowCopies"] = templateData["allowCopies"];

      if (templateData.hasOwnProperty("dayMargin")) {
        challengeData["dayMargin"] = templateData["dayMargin"];
      }

      if (templateData.hasOwnProperty("preDays")) {
        challengeData["preDays"] = templateData["preDays"];
      }

      challengeData["days"] = templateData["days"];

      if (challengeData.hasOwnProperty("selections")) {
        for (let day in challengeData["days"]) {
          if (challengeData["selections"].hasOwnProperty(`${day["id"]}`)) {
            for (let task in day["tasks"]) {
              if (
                challengeData["selections"][`${day["id"]}`].hasOwnProperty(
                  `${task["id"]}`
                )
              ) {
                task["selection"] =
                  challengeData["selections"][`${day["id"]}`][`${task["id"]}`];
              } else if (Object.keys(task["options"]).length > 0) {
                task["selection"] = task["options"][0]["text"];
              } else {
                task["selection"] = null;
              }
            }
          } else {
            for (let task in day["tasks"]) {
              if (Object.keys(task["options"]).length > 0) {
                task["selection"] = task["options"][0]["text"];
              } else {
                task["selection"] = null;
              }
            }
          }
          res.status(200).json(challengeData);
        }
      } else if (req.body.hasOwnProperty("getAllUsers")) {
        let users = await User.find(
          {},
          { drafts: 0, challenges: 0, templates: 0, createdChallenges: 0 }
        );
        // users  = users.flat()
        users = users.map(val => {
          return getUserData(val);
        });
        users.reverse();
        res.status(200).json(users);
      }
    }
  }
});

module.exports = router;
