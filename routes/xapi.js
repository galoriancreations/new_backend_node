const { Router } = require("express");
const auth = require("../middleware/auth");
const { User } = require("../models/user");
const { Template } = require("../models/template");
const { updateUserInDB, generateRandomString } = require("../util/functions");

const router = Router();

router.use(auth);

router.post("/", async (req, res) => {
  const userId = req.user._id;
  const user = await User.findOne({ _id: userId });
  const current_user = user._id;

  const isAdmin = user["isAdmin"];

  const final = {};

  const data = req.body;
  if (!data.hasOwnProperty("userID")) {
    data["userID"] = current_user;
  }

  if (data.hasOwnProperty("userID")) {
    console.log(`data's userID is now ${data["userID"]}`);
    if (String(current_user).trim() === String(data["userID"]).trim()) {
      ///אנחנו בסוף נשלח את את זה חזרה לפרונט
      let userData = {};

      if (data.hasOwnProperty("editProfile")) {
        console.log("editProfile");
        let newData = data["editProfile"];
        let allowedChanges = [
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
        for (let key in allowedChanges) {
          if (newData.hasOwnProperty(allowedChanges[key])) {
            user[allowedChanges[key]] = newData[allowedChanges[key]];
          }
        }

        // ///תוספת שלי, הפרונט אנד מחפש קטגוריה של שחקנים למרות שהיא לא קיימת כשנוצר משתמש חדש
        // if (!(user.hasOwnProperty('players'))) {
        //   user['players'] = []
        // }
        await updateUserInDB(user);

        const userDoc = user.toObject();
        for (let key in userDoc) {
          if (userDoc.hasOwnProperty(key)) {
            userData[key] = userDoc[key];
          }
        }

        // if (!String(userData["phone"]).startsWith("+")) {
        //   userData["phone"] = "+" + String(userData["phone"]);
        // }

        userDrafts = {};
        if (userData.hasOwnProperty("drafts")) {
          for (let draftID in userData["drafts"]) {
            console.log("Fetching draft from DB:", draftID);
            let result = await findDraftInDB(draftID);
            console.log("Receiving draft from DB:", result);
            if (result != null) {
              userDrafts[draftID] = {
                _id: result["_id"],
                name: result["name"],
                language: result["language"]
              };
              if (result.hasOwnProperty("challengeId")) {
                userDrafts[draftID]["challengeId"] = result["challengeId"];
              }
            }
          }
        }
        userData["drafts"] = userDrafts;

        userData["challenges"] = {};

        createdChallenges = {};

        if (userData.hasOwnProperty("createdChallenges")) {
          for (let i = 0; i < userData["createdChallenges"].length; i++) {
            const challengeId = userData["createdChallenges"][i];
            challenge = await Challenges.findOne({ _id: challengeId });
            if (challenge != null) {
              templateId = challenge["template"];
              template = await findTemplateInDB(templateId);
              if (template != null) {
                challenge["name"] = template["name"];
                challenge["language"] = template["language"];
                if (template.hasOwnProperty("dayMargin")) {
                  challenge["dayMargin"] = template["dayMargin"];
                }
                createdChallenges[challengeId] = challenge;
              }
            }
          }
        }

        userData["createdChallenges"] = createdChallenges;

        final["logged_in_as"] = current_user;

        final["user"] = userData;
      } else if (data.hasOwnProperty("getAvailableTemplates")) {
        let publicTemplates = await Template.find({ isPublic: true });

        let privateTemplates = await Promise.all(
          user.templates.map(async val => {
            return await Template.find({
              _id: `${val._id}`,
              isPublic: false
            });
          })
        );

        privateTemplates = privateTemplates.flat(); ///המערך שמתקבל מהלולאה הקודמת הוא מערך של מערכים שמכילים כל אובייקט, לכן אנחנו צריכים להוציא את האובייקטים מתוך המערכים הפנימיים
        ///מחבר את שני המערכים
        let templates = publicTemplates.concat(privateTemplates);
        templates.filter(val => val !== null);

        final.templates = templates;
      } else if (data.hasOwnProperty("addPlayer")) {
        let phoneNum = req.body.addPlayer.phone;
        phoneNum = phoneNum.replace("+", "");
        if (user["accountType"] == "individual") {
          return res.status(403).json({
            msg: "Your account is not an organization, you can't add players."
          });
        }
        let findIndividual = await UsersTest.findOne({
          phone: `${phoneNum}`
        });
        if (findIndividual == null) {
          return res.status(403).json({
            msg: `No user found with this phone number: ${req.body.addPlayer.phone}`
          });
        }

        let findPlayer = await PlayersDB.findOne({
          userName: `${findIndividual["username"]}`
        });
        console.log("findPlayer :", findPlayer);
        if (findPlayer == null) {
          let playerId = null;
          while (
            playerId == null ||
            (await PlayersDB.findOne({ _id: `${playerId}` })) != null
          ) {
            playerId = "p_" + generateRandomString();
          }
          let temp = {
            _id: playerId,
            phone: phoneNum,
            userName: findIndividual.username,
            totalScore: 0,
            clubs: [
              {
                clubId: current_user,
                groupName: req.body.addPlayer.groupName,
                role: req.body.addPlayer.role,
                score: 0
              }
            ]
          };
          await PlayersDB.create(temp);
          user["players"] = [
            ...user["players"],
            {
              playerId: playerId,
              username: findIndividual.username,
              fullName: findIndividual.fullName,
              role: req.body.addPlayer.role
            }
          ];
          console.log("user with players" + user);
          updateUserInDB(user);
        } else {
          let checkId = findPlayer.clubs.find(val => val.clubId == user["_id"]);
          console.log("checkId:", checkId);
          if (checkId == undefined) {
            findPlayer["clubs"] = [
              ...findPlayer["clubs"],
              {
                clubId: current_user,
                groupName: req.body.addPlayer.groupName,
                role: req.body.addPlayer.role,
                score: 0
              }
            ];
            await PlayersDB.updateOne(
              { _id: `${findPlayer["_id"]}` },
              { $set: findPlayer }
            );
            user["players"] = [
              ...user["players"],
              {
                playerId: findPlayer["_id"],
                username: findPlayer.userName,
                fullName: findIndividual.fullName,
                role: req.body.addPlayer.role
              }
            ];
            updateUserInDB(user);
          } else {
            return res.status(403).json({
              msg: "A player with this phone number is already assigned to your organization!"
            });
          }
        }
        const response = {
          logged_in_as: current_user,
          msg: `${findIndividual.username}`,
          playerId: `${findIndividual["_id"]}`
        };
        Object.assign(final, response);
      } else if (data.hasOwnProperty("deletePlayer")) {
        let playerToRemove = await PlayersDB.findOne({
          _id: `${data.deletePlayer}`
        });

        playerToRemove.clubs = playerToRemove.clubs.filter(
          val => val.clubId !== user.phone
        );

        user.players = user.players.filter(
          val => val.playerId !== data.deletePlayer
        );

        updateUserInDB(user);

        await PlayersDB.updateOne(
          { _id: `${playerToRemove["_id"]}` },
          { $set: playerToRemove }
        );

        Object.assign(final, {
          msg: `sucessfully deleted user '${playerToRemove.username}`,
          playerId: `${playerToRemove["_id"]}`
        });
      } else if (data.hasOwnProperty("getTemplateData")) {
        let template = await Template.findOne({
          _id: `${data["getTemplateData"]}`
        });
        Object.assign(final, { template });
        // console.log("Template Ready!");
      } else if (data.hasOwnProperty("saveTemplate")) {
        let templateId = data["saveTemplate"]["templateId"];
        console.log("template id is : " + templateId);
        let templateData = data["saveTemplate"]["templateData"];

        templateData["creator"] = current_user;
        templateData["lastSave"] = new Date();

        if (templateId == null) {
          templateId = "t_" + generateRandomString();
          templateData["_id"] = templateId;
          if (isAdmin == false) {
            templateData["isPublic"] = false;
            await Template.create(templateData);
            let temp = {
              _id: templateId,
              name: templateData.name,
              isPublic: templateData.isPublic
            };
            user["templates"] = [...user["templates"], temp];
            // user['templates'] = [...user['templates'], templateId]
          }
        } else {
          templateData["_id"] = templateId;
          if (
            isAdmin == true ||
            user["templates"].find(val => val._id == templateId) != undefined
          ) {
            if (isAdmin == false) {
              templateData["isPublic"] = false;
            }
            await Template.updateOne(
              { _id: `${templateId}` },
              { $set: templateData }
            );
            let temp = {
              _id: templateId,
              name: templateData.name,
              isPublic: templateData.isPublic
            };
            let index = user["templates"].findIndex(
              val => val._id == templateId
            );
            user["templates"][index] = temp;
            updateUserInDB(user);
          } else {
            let existingTemplate = await Template.findOne({
              _id: templateId,
              isPublic: true
            });
            console.log("existingTemplateData :" + existingTemplateData);
            let excludedKeys = ["lastSave", "creator", "challenges", "_id"];

            existingTemplateData = Object.entries(existingTemplate).reduce(
              (result, [key, value]) => {
                if (key in templateData && !excludedKeys.includes(key)) {
                  result[key] = value;
                }
                return result;
              },
              {}
            );
            let filteredTemplateData = {};
            for (let key in templateData) {
              if (!excludedKeys.includes(key)) {
                filteredTemplateData[key] = templateData[key];
              }
            }
            if (String(existingTemplateData) !== String(filteredTemplateData)) {
              let originId = templateId;
              templateId = "t_" + generateRandomString();
              templateData["_id"] = templateId;
              templateData["isPublic"] = false;
              templateData["origin"] = originId;
              await Template.create(templateData);
              let temp = {
                _id: templateId,
                name: templateData.name,
                isPublic: templateData.isPublic
              };
              user["templates"] = [...user["templates"], temp];
            }
          }
        }
        updateUserInDB(user);
        Object.assign(final, {
          logged_in_as: current_user,
          templateId: templateId
        });
      } else if (data.hasOwnProperty("deleteTemplate")) {
        // delete multi templates at once with delete many
        if (Array.isArray(data.deleteTemplate.templateIds)) {
          const templateIds = data.deleteTemplate.templateIds;
          if (
            !isAdmin &&
            !templateIds.every(val =>
              user.templates.find(val2 => val2._id == val)
            )
          ) {
            return res
              .status(404)
              .json({ msg: `Template not found ${templateIds}` });
          }
          await Template.deleteMany({ _id: { $in: templateIds } });
          user.templates = user.templates.filter(
            val => !templateIds.includes(val._id)
          );
          updateUserInDB(user);
          Object.assign(final, {
            msg: `Successfully deleted templates: ${templateIds}`,
            templateIds: templateIds
          });
        }
        // delete single template
        else {
          const templateId = data.deleteTemplate.templateId;
          if (
            !isAdmin &&
            !(user.templates.find(val => val._id == templateId) != undefined)
          ) {
            return res
              .status(404)
              .json({ msg: `Template not found ${templateId}` });
          }
          await Template.deleteOne({ _id: `${templateId}` });
          user.templates = user.templates.filter(val => val._id !== templateId);
          // console.log("user templates:", user.templates);
          updateUserInDB(user);
          Object.assign(final, {
            msg: `Successfully deleted template: ${templateId}`,
            templateId: templateId
          });
        }
      } else if (data.hasOwnProperty("cloneTemplate")) {
        let originId = data["cloneTemplate"];
        let originTemplate = await Template.findOne({
          _id: `${originId}`
        });
        if (
          originTemplate == null ||
          (user["templates"].find(val => val._id == originId) == undefined &&
            !originTemplate["isPublic"])
        ) {
          return res
            .status(404)
            .json({ msg: `Template not found ${originId}` });
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
      } else if (data.hasOwnProperty("getAllTemplates")) {
        if (isAdmin == false) {
          return res
            .status(403)
            .json({ msg: "user not authorized to view all templates" });
        }
        let templates = await Template.find(
          {},
          { days: 0, preMessages: 0, preDays: 0 }
        );

        templates.reverse();

        let creators = { current_user: user };

        for (let template in templates) {
          if (
            template.hasOwnProperty("creator") &&
            template["creator"] != null
          ) {
            let creator;
            let creatorId = template["creator"];
            if (creators.hasOwnProperty(`${creatorId}`)) {
              creator = creators[creatorID];
            } else {
              creator = UsersTest.findOne(
                { _id: creatorId },
                { phone: 1, username: 1 }
              );
              if (creator != null) {
                creators[creatorId] = creator;
              }
            }
            if (creator != null) {
              template["creator"] = creator["username"] || creator["phone"];
            }
          }
          Object.assign(final, { templates });
        }
      } else if (data.hasOwnProperty("deleteChallenge")) {
        challengeId = data["deleteChallenge"];
        if (!user.isAdmin && !user["createdChallenges"].includes(challengeId)) {
          return res
            .status(404)
            .json({ msg: `No challenge found with this ID: ${challengeId}` });
        }
        await Challenges.deleteOne({ _id: challengeId });
        if (user["createdChallenges"].includes(challengeId)) {
          user["createdChallenges"] = user["createdChallenges"].filter(
            id => id != challengeId
          );
        }
        if (user["challenges"].includes(challengeId)) {
          user["challenges"] = user["challenges"].filter(
            id => id != challengeId
          );
        }
        updateUserInDB(user);

        Object.assign(final, {
          msg: `Successfully deleted challenge: ${challengeId}`,
          challengeId: challengeId
        });
      } else if (data.hasOwnProperty("createChallenge")) {
        const templateId = data["createChallenge"]["templateId"];
        const challengeData = {
          template: templateId,
          selections: data["createChallenge"]["selections"],
          name: data["createChallenge"]["name"],
          date: data["createChallenge"]["date"]
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
        await Challenges.insertMany(challengeData);

        if (verifyNow) {
          console.log(`::: VERIFING Challenge ${challengeId}`);
          //// const [verified, err] = verifyChallenge(challengeId, challengeData.creator, challengeData.name, image, challengeData.date);
          //// console.log(`::: VERIFIED ${verified}, ${err}`);
        }

        const draftId = data["createChallenge"]["draftId"];

        await UsersDrafts.deleteOne({ _id: draftId });
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

        await GroupsDB.insertMany(groupChatInfo);
        const arrayItemID = "A_" + generateRandomString();
        challengeItem = {
          _id: arrayItemID,
          challengeID: challengeId,
          groupID: groupID
        };
        await ChallengeArray.insertMany(challengeItem);
        updateUserInDB(user);
        Object.assign(final, { groupChatInfo });
      } else if (data.hasOwnProperty("joinGroup")) {
        const inviteId = data["joinGroup"];
        const group = await GroupsDB.findOne({ invite: inviteId });
        if (group) {
          let inGroup = false;
          for (let i = 0; i < group.userUser.length; i++) {
            if (group.users[i].userid == user._id) {
              inGroup = !inGroup;
              break;
            }
          }
          if (!inGroup) {
            const username = user.username ? user.username : "Jhon Doe";
            const userinfo = {
              userid: user._id,
              role: "student",
              username: username
            };
            group.userUser.push(userinfo);
            user.groups.push({ _id: group._id, name: group.name });
            updateUserInDB(user);
            await GroupsDB.updateOne(
              { invite: inviteId },
              { users: group.users }
            );
            return res
              .status(200)
              .json({ msg: "You are now a part of the group!" });
          } else {
            return res
              .status(400)
              .json({ msg: "you are already in this group" });
          }
        } else {
          return res
            .status(400)
            .json({ msg: `No group found with this ID: ${inviteId}` });
        }
      } else if (data.hasOwnProperty("loadGroup")) {
        const groupId = data["loadGroup"]["_id"];
        const group = await GroupsDB.findOne(
          { _id: groupId },
          { name: 1, messages: 1, botMessage: 1, emoji: 1 }
        );
        if (group) {
          Object.assign(final, { group });
        } else {
          return res
            .status(400)
            .json({ msg: `No group found with this ID: ${groupId}` });
        }
      } else if (data.hasOwnProperty("sendMessage")) {
        console.log("send message");
        const groupId = data["sendMessage"]["_id"];
        const group = await GroupsDB.findOne({ _id: groupId });
        if (group) {
          const msg = data["sendMessage"]["message"];
          const removeAbove20 = () => {
            if (group.messages.length >= 20) {
              group.messages.shift();
              removeAbove20();
            }
          };
          removeAbove20();
          const time = new Date();
          const hourmin = time.getHours();
          const username = user.username ? user.username : "Jhon Doe";
          const message = {
            msg: msg,
            time: hourmin,
            user: user._id,
            nickname: username
          };

          let botMessage;
          let goodEmoji = false;
          for (let i = 0; i < group.emoji.length; i++) {
            if (group.emoji[i][msg]) {
              goodEmoji = i;
              break;
            }
          }
          if (goodEmoji) {
            let userfound = group.scored.map(val => {
              if (val.user == user._id && val.emoji == msg) {
                return val;
              }
            });
            if (userfound) {
              botMessage = {
                msg: "you already did this task",
                time: hourmin,
                user: "Ting Global Bot"
              };
            } else {
              botMessage = {
                msg: "Task Finished!!!",
                time: hourmin,
                user: "Ting Global Bot"
              };
              const points = group.emoji[goodEmoji][msg][points];
              group.scored.push({ user: user._id, emoji: msg });
              user.totalScore += points;
              updateUserInDB(user);
              await GroupsDB.updateOne(
                { _id: groupId },
                { scored: group.scored }
              );
            }
            group.messages.push(message);
            group.messages.push(botMessage);
          } else if (msg == "/hello") {
            botMessage = {
              msg: "hi there!",
              time: hourmin,
              user: "Ting Global Bot"
            };

            group.messages.push(message);
            group.messages.push(botMessage);
          } else if (msg.startsWith("/promote")) {
            let number = msg.slice(8, msg.length);
            if (number[0] == " ") {
              number = number.slice(1, msg.number);
            }
            let admin = false;
            for (let i = 0; i < group.userUser.length; i++) {
              if (group.users[i].userid == user._id) {
                if (group.users[i].role == "admin") {
                  admin = !admin;
                  break;
                } else {
                  break;
                }
              }
            }
            if (admin) {
              let foundUser = false;
              let position;
              for (let i = 0; i < group.userUser.length; i++) {
                if (group.users[i].userid == number) {
                  foundUser = !foundUser;
                  position = i;
                  break;
                }
              }
              if (foundUser) {
                if (group.users[position].role == "student") {
                  group.users[position].role = "instructor";
                } else if (group.users[position].role == "instructor") {
                  group.users[position].role = "admin";
                }
                await GroupsDB.updateOne(
                  { _id: groupId },
                  { users: group.users }
                );
                botMessage = {
                  msg: "User has been premoted!!",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              } else {
                botMessage = {
                  msg: "I did not find a user with that number.\n did you type the correct one?",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              }
              group.messages.push(botMessage);
            } else {
              botMessage = {
                msg: "i am sorry only admins have accses to this command.\n if you would like to use it you can ask an admin for a promotion.",
                time: hourmin,
                user: "Ting Global Bot"
              };
              group.messages.push(message);
              group.messages.push(botMessage);
            }
          } else if (msg == "/invite") {
            let instructor = false;
            for (let i = 0; i < group.userUser.length; i++) {
              if (group.users[i].userid == user._id) {
                if (
                  group.users[i].role == "instructor" ||
                  group.users[i].role == "admin"
                ) {
                  instructor = !instructor;
                  break;
                } else {
                  break;
                }
              }
            }
            if (instructor) {
              if (group.invite.length > 0) {
                botMessage = {
                  msg: `this is the invite code for this group\n ${group.invite} send this to the users you want to invite`,
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              } else {
                const inviteCode = "i_" + generateRandomString();
                botMessage = {
                  msg: `this is the invite code for this group\n ${inviteCode} send this to the users you want to invite`,
                  time: hourmin,
                  user: "Ting Global Bot"
                };
                group.invite = inviteCode;
                await GroupsDB.updateOne(
                  { _id: groupId },
                  { invite: group.invite }
                );
              }
            } else {
              botMessage = {
                msg: "sorry you need to be an instructor or above to use this command",
                time: hourmin,
                user: "Ting Global Bot"
              };
            }
            group.messages.push(message);
            group.messages.push(botMessage);
          } else if (msg.startsWith("/nickname")) {
            let nickname = msg.slice(9, msg.length);
            if (nickname[0] == " ") {
              nickname = nickname.slice(1, msg.length);
            }
            user.username = nickname;
            updateUserInDB(user);
            botMessage = {
              msg: `Username changed to ${nickname}`,
              time: hourmin,
              user: "Ting Global Bot"
            };
            group.messages.push(message);
            group.messages.push(botMessage);
          } else if (msg.startsWith("/help")) {
            group.messages.push(message);
            if (msg == "/help") {
              botMessage = {
                msg: "Here are the commands i know:\n1. /hello\n2. /invite\n3. /promote\n4. /nickname\n5. /help\n type (/help) then the number of the command you want info on",
                time: hourmin,
                user: "Ting Global Bot"
              };
              group.messages.push(botMessage);
            } else {
              let number = msg.slice(5, msg.length);
              if (number[0] == " ") {
                number = number.slice(1, msg.length);
              }
              if (number == 1) {
                botMessage = {
                  msg: "This command is to say hello to me!",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              } else if (number == 2) {
                botMessage = {
                  msg: "This command is used to create an invite link to add players to the group,\n it can only be used by instructors.",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              } else if (number == 3) {
                botMessage = {
                  msg: "This command promotes a student to instructor and instructor to an admin,\n it can only be used by admins.",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              } else if (number == 4) {
                botMessage = {
                  msg: "This command gives you a nickname to identify in the group.",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              } else if (number == 5) {
                botMessage = {
                  msg: "This command gives a list of all commands available.",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              } else {
                botMessage = {
                  msg: "I am sorry i dont know this command",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              }

              group.messages.push(botMessage);
            }
          } else if (msg.startsWith("/telegram")) {
            let shortmsg = msg.slice(9, msg.length);
            if (shortmsg[0] == " ") {
              shortmsg = shortmsg.slice(1, msg.length);
            }
            if (shortmsg == "link") {
              if (group.telInvite) {
                botMessage = {
                  msg: `Here is the invite link to your telegram group\n${group.telInvite}`,
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              } else {
                botMessage = {
                  msg: "I am sorry you didnt register a telegram group to do that please add the TingGlobalBot to your group and give it your groupid",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              }
              group.messages.push(message);
              group.messages.push(botMessage);
            } else {
              let admin = false;
              for (let i = 0; i < group.userUser.length; i++) {
                if (group.users[i].userid == user._id) {
                  if (group.users[i].role == "admin") {
                    admin = !admin;
                  }
                  break;
                }
              }
              if (admin) {
                group.telInvite = shortmsg;
                await GroupsDB.updateOne(
                  { _id: groupId },
                  { telInvite: group.telInvite }
                );
                botMessage = {
                  msg: "telegram invite code registerd!!\n you can go to telegram and activate the group now!",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
                group.messages.push(message);
                group.messages.push(botMessage);
              } else {
                botMessage = {
                  msg: "only admins can use this command",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
                group.messages.push(message);
                group.messages.push(botMessage);
              }
            }
          } else if (msg.startsWith("/connect_account")) {
            if (msg == "/connect_account") {
              botMessage = {
                msg: "please use a 6 digit code after the command",
                time: hourmin,
                user: "Ting Global Bot"
              };
              group.messages.push(message);
              group.messages.push(botMessage);
            } else {
              let code = msg.slice(17, msg.length);
              code = parseInt(code);
              if (code) {
                if (code <= 999999 && code >= 100000) {
                  user.telegramId == code;
                  updateUserInDB(user);
                  botMessage = {
                    msg: "code accepted if you forget it you can set it again\nbut after connecting your telegram account it cannot be changed",
                    time: hourmin,
                    user: "Ting Global Bot"
                  };
                } else {
                  botMessage = {
                    msg: "please use a 6 digit code",
                    time: hourmin,
                    user: "Ting Global Bot"
                  };
                }
              } else {
                botMessage = {
                  msg: "please use only digits",
                  time: hourmin,
                  user: "Ting Global Bot"
                };
              }
              group.messages.push(botMessage);
            }
          } else {
            group.messages.push(message);
          }

          await GroupsDB.updateOne(
            { _id: groupId },
            { messages: group.messages }
          );

          for (let template in templates) {
            if (
              template.hasOwnProperty("creator") &&
              template["creator"] != null
            ) {
              let creator;
              let creatorId = template["creator"];
              if (creators.hasOwnProperty(`${creatorId}`)) {
                creator = creators[creatorID];
              } else {
                creator = UsersTest.findOne(
                  { _id: creatorId },
                  { phone: 1, username: 1 }
                );
                if (creator != null) {
                  creators[creatorId] = creator;
                }
              }
              if (creator != null) {
                template["creator"] = creator["username"] || creator["phone"];
              }
            }
            Object.assign(final, { templates });
          }
        }

        Object.assign(final, { group });
      } else if (data.hasOwnProperty("deleteGroup")) {
        const groupId = data["deleteGroup"]["_id"];
        // const group = await GroupsDB.findOne({_id:groupId},{name:1,messages:1,botMessage:1})
        // if (group) {
        //   Object.assign(final, {group})
        // }else{
        //   return res.status(400).json({ msg: `No group found with this ID: ${groupId}` });
        // }
      } else if (data.hasOwnProperty("createTemplateWithAi")) {
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
              `Server attempt ${
                i + 1
              } of ${maxAttempts} to create template with AI`
            );

            // cancel if user not in same page
            if (current_user !== data.createTemplateWithAi.creator) {
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
            } = data.createTemplateWithAi;

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
                  `No more attempts left, returning template with the most days (${template?.days?.length})`
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
            updateUserInDB(user);

            fs.writeFileSync("GPT/json/failed.json", JSON.stringify(templates));

            // return template
            Object.assign(final, { template });
            console.log("Template created successfully");
            break;
          }
        } catch (error) {
          console.error(error);
          return res.status(400).json({ msg: error });
        }
      } else if (data.hasOwnProperty("generateDayWithAi")) {
        // create challenge day with AI
        const { templateId } = data.generateDayWithAi;
        const template = await Template.findOne({ _id: templateId });
        if (!template) {
          return res.status(404).json({ msg: "Template not found" });
        }
        // get last day data
        const dayIndex = template.days.length;
        const lastDay = template.days[dayIndex - 1];

        // generate day
        const day = await generateDay({
          challengeName: template.name,
          challengeIntroduction: template.days[0].introduction,
          lastDay,
          dayIndex
        });

        if (!day || day.error) {
          return res
            .status(400)
            .json({ msg: day.msg || "Failed to generate day" });
        }

        // generate image
        let imageTheme = template.imageTheme;
        await replaceImages({
          challenge: day,
          imageTheme: imageTheme,
          callback: (i, j, theme) => {
            if (theme) {
              console.log("Added imageTheme:", theme);
              imageTheme = theme;
            }
          }
        });

        // generate audio
        await generateAudio(day, template.voice || "alloy");

        // update template
        await Template.updateOne(
          { _id: templateId },
          { $set: { imageTheme, [`days.${dayIndex}`]: day } }
        );

        // send day data
        Object.assign(final, { day });
      }
      res.status(200).json(final);
    }
  }
});

module.exports = router;
