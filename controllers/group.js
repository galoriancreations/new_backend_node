const { Group } = require("../models/Group");
const { User } = require("../models/user");

exports.loadGroup = async (req, res) => {
  try {
    console.log("loadGroup from controllers/group.js");

    const data = req.body.groupId.groupChatInfo;
    const groupId = data._id;
    console.log({ groupId });
    const group = await Group.findOne(
      { _id: groupId },
      { name: 1, messages: 1, botMessage: 1, emoji: 1 }
    );
    if (!group) {
      return res
        .status(400)
        .json({ msg: `No group found with this ID: ${groupId}` });
    }

    return res.status(200).json(group);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error occurred" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    console.log("sendMessage from controllers/group.js");

    const data = req.body;
    const groupId = data._id;
    const group = await Group.findOne({ _id: groupId });
    const user = await User.findOne({ _id: req.user._id });

    if (group) {
      console.log("group found");
      const msg = data.message;
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
          user.save();

          await Group.updateOne({ _id: groupId }, { scored: group.scored });
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
        for (let i = 0; i < group.users.length; i++) {
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
          for (let i = 0; i < group.users.length; i++) {
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
            await Group.updateOne({ _id: groupId }, { users: group.users });
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
        for (let i = 0; i < group.users.length; i++) {
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
            await Group.updateOne({ _id: groupId }, { invite: group.invite });
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
        user.save();
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
          for (let i = 0; i < group.users.length; i++) {
            if (group.users[i].userid == user._id) {
              if (group.users[i].role == "admin") {
                admin = !admin;
              }
              break;
            }
          }
          if (admin) {
            group.telInvite = shortmsg;
            await Group.updateOne(
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
              user.save();
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

      await Group.updateOne({ _id: groupId }, { messages: group.messages });

      // where is templates??
      const templates = group.templates;
      for (let template in templates) {
        if (template.hasOwnProperty("creator") && template.creator) {
          let creator;
          let creatorId = template["creator"];
          if (template.creator.hasOwnProperty(`${creatorId}`)) {
            // creator = creators[creatorID];
            creator = template.creator[creatorId];
          } else {
            creator = User.findOne(
              { _id: creatorId },
              { phone: 1, username: 1 }
            );
            if (!creator) {
              // creators[creatorId] = creator;
              template.creator[creatorId] = creator;
            }
          }
          if (!creator) {
            template.creator = creatorusername || creatorphone;
          }
        }
        return res.status(200).json(template);
      }
    } else {
      return res
        .status(400)
        .json({ msg: `No group found with this ID: ${groupId}` });
    }

    return res.status(200).json(group.messages);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error occurred" });
  }
};
