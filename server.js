const express = require("express");

const app = express();
const bodyParser = require("body-parser");


const { Telegraf } = require('telegraf')

const db = require("mongoose");

const cors = require("cors");

// --photo test -----------------------------------

const multer = require("multer");

// const storage = multer.diskStorage({
// 	destination: function (req, file, cb) {
// 		cb(null, "uploads/"); // The directory where uploaded files will be stored
// 	},
// 	filename: function (req, file, cb) {
// 		cb(null, Date.now() + "-" + file.originalname); // Define the filename for the uploaded file
// 	},
// });
// const upload = multer({ storage });

const storage = multer.memoryStorage(); //store file in memory
const upload = multer({ storage });
// -- end photo test -----------------------------------

let client;

let lastSender;

const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const { Z_UNKNOWN } = require("zlib");
const { generateChallenge } = require('./GPT/ChallengeGenerator');
// const { scheduleArticleJob } = require('./GPT/ArticleGenerator');
const fs = require("fs");
const EventEmitter = require('events');

const secretKey = "GYRESETDRYTXXXXXFUGYIUHOt7";

const generateRandomString = () => {
  const length = 22;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};

const convertToNum = (id) => {
  let phoneCheck = "";

  let i = 0;

  while (id[i] != "@") {
    phoneCheck += id[i];
    i++;
  }

  console.log(`phoneCheck: ${phoneCheck}`);

  return phoneCheck;
};

const addUserToDb = async (user) => {
  try {
    await UsersTest.create(user);
    console.log(`User ${user.fullName} added!!`);
  } catch (error) {
    console.log("error: ", error);
  }
};

const getUserData = (user) => {
  userData = {};
  keys = [
    "_id",
    "username",
    "phone",
    "fullName",
    "organization",
    "accountType",
    "isAdmin",
  ];
  const userDoc = user.toObject();
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (userDoc.hasOwnProperty(key)) {
      userData[key] = userDoc[key];
    }
  }
  return userData;
};

const generateToken = (user_id, secretKey) => {
  const expiresIn = 60 * 60 * 24;
  const payload = {
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    iat: Math.floor(Date.now() / 1000),
    sub: user_id,
  };

  try {
    const token = jwt.sign(payload, secretKey, { algorithm: "HS256" });
    const exp = new Date(payload.exp * 1000);
    return [token, exp];
  } catch (error) {
    return [error, error];
  }
};

const getToken = (id) => {
  let [access_token, exp] = generateToken(id, secretKey);

  return [access_token, exp];
};

const decode_auth_token = (auth_token, secretKey) => {
  try {
    const payload = jwt.verify(auth_token, secretKey, {
      algorithms: ["HS256"],
    });
    return payload.sub;
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return false;
    }
    throw error;
  }
};

const fetchUserFromID = async (id) => {
  let user = await UsersTest.findOne({ _id: id });

	return user; 
};

const updateUserInDB = async (user) => {
  // console.log("new user to update:", user);
  await UsersTest.updateOne({ _id: `${user["_id"]}` }, { $set: user });
  return;
};

// why in this three searches i exculde:
//  "days" "preMessages", "preDays"?
const findDraftInDB = async (draft) => {
  return await UsersDrafts.findOne(
    { _id: draft },
    { days: 0, preMessages: 0, preDays: 0 }
  );
};

const findChallengeInDB = async (challenge) => {
  return await Challenges.findOne(
    { _id: challenge },
    { days: 0, preMessages: 0, selections: 0 }
  );
};

const findTemplateInDB = async (template) => {
  return await TemplatesDB.findOne(
    { _id: template },
    { days: 0, preMessages: 0, preDays: 0 }
  );
};

//אני לא יודע למה, אבל השרת לא מוכן לטעון את הסקריפט בלי השורה הזו
app.set("js", "text/javascript");

//אני לא יודע למה, אבל השרת לא מוכן לטעון את הסקריפט בלי השורה הזו
app.get("/script.js", (req, res) => {
  res.type("js");
  res.sendFile(__dirname + "/script.js");
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(express.static("pages"));

app.use(
  cors({
    origin: "http://localhost:4500",
  })
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/addUser", (req, res) => {
  res.sendFile(__dirname + "/testing.html");
  res.sendFile(__dirname + "/testing.html");
});

db.connect(
  "mongodb+srv://Yinon:Challenge18@challenge18.hclji.mongodb.net/challenge"
);

const waGroupSchema = new db.Schema(
  {
    groupID: String,
    challengeID: String,
    invite: String,
    name: String,
  },
  { versionKey: false },
  {
    groupID: String,
    challengeID: String,
    invite: String,
    name: String,
  },
  { versionKey: false }
);

const UsersTestSchema = new db.Schema(
	{
		_id: String,
		username: String,
		phone: String,
		fullName: String,
		organization: String,
		country: String,
		memberName: String,
		memberRole: String,
		email: String,
		language: String,
		accountType: String,
		templates: Array,
		drafts: Array,
		challenges: Array,
		createdChallenges: Array,
    groups: Array,
		isAdmin: Boolean,
		players: Array,
		photo: {
			name: String,
			data: String,
			contentType: String,
		},
		articleSubscribed: Boolean,
    telegramId: String,
	},
	{ versionKey: false }
);

const UserDraftSchema = new db.Schema(
	{
		_id: String,
		allowTemplateCopies: Boolean,
		days: Array,
		image: String,
		date: String,
		isTemplatePublic: Boolean,
		language: String,
		lastSave: Number,
		name: String,
		preDays: Array,
		preMessages: Array,
		dayMargin: Number,
		templateId: String,
		templateOnly: Boolean,
	},
	{ versionKey: false }
);

const ChallengeSchema = new db.Schema(
  {
    _id: String,
    active: Boolean,
    createdOn: Number,
    creator: String,
    date: String,
    declined: Boolean,
    invite: String,
    isPublic: Boolean,
    name: String,
    scores: Array,
    selections: Array,
    template: String,
    verified: Boolean,
    days: Array,
    preMessages: Array,
    preDays: Array,
  },
  { versionKey: false }
);

const TemplateSchema = new db.Schema(
	{
		_id: String,
		allowCopies: Boolean,
		creator: String,
		dayMargin: Number,
		days: Array,
		image:String,
		isPublic: Boolean,
		language: String,
		lastSave: String,
		name: String,
		preDays: Array,
		challenges: Array,
		preMessages: Array,
	},
	{ versionKey: false }
);

const PlayerSchema = new db.Schema(
	{
		_id: String,
		phone: String,
		userName: String,
		totalScore: Number,
		clubs: Array,
	},
	{ versionKey: false }
);
 
const StarsSchema = new db.Schema(
  {
    _id: String,
    image: String,
    title: String,
    names: Array,
    text: String,
    link: String,
    linkText: String,
    totalRateing: Number,
    users: Array,
  },
  { versionKey: false }
);
  const GroupSchema = new db.Schema(
    {
      _id: String,
      challengeID: String,
      invite: String,
      telInvite: String,
      telGroupId: String,
      name: String,
      users: [Object],
      messages:[Object],
      botMessage:[Object],
      emoji:[Object],
      scored:[Object],
    },
);
  const ChallengeArraySchema = new db.Schema(
  {
    _id: String,
    challengeID: String,
  },
  { versionKey: false }
);
 
// const StarsSchema = new db.Schema(
//   {
//     _id: String,
//     image: String,
//     title: String,
//     names: Array,
//     text: String,
//     link: String,
//     linkText: String,
//     totalRateing: Number,
//     users: Array,
//   },
//   { versionKey: false }
// );
//   const GroupSchema = new db.Schema(
//     {
//       _id: String,
//       challengeID: String,
//       invite: String,
//       telInvite: String,
//       telGroupId: String,
//       name: String,
//       users: [Object],
//       messages:[Object],
//       botMessage:[Object],
//       emoji:[Object],
//       scored:[Object],
//     },
// );
//   const ChallengeArraySchema = new db.Schema(
//   {
//     _id: String,
//     challengeID: String,
//   },
//   { versionKey: false }
// );
 
// // const StarsSchema = new db.Schema(
// //   {
// //     _id: String,
// //     image: String,
// //     title: String,
// //     names: Array,
// //     text: String,
// //     link: String,
// //     linkText: String,
// //     totalRateing: Number,
// //     users: Array,
// //   },
// //   { versionKey: false }
// );
//   const GroupSchema = new db.Schema(
//     {
//       _id: String,
//       challengeID: String,
//       invite: String,
//       telInvite: String,
//       telGroupId: String,
//       name: String,
//       users: [Object],
//       messages:[Object],
//       botMessage:[Object],
//       emoji:[Object],
//       scored:[Object],
//     },
// );
//   const ChallengeArraySchema = new db.Schema(
//   {
//     _id: String,
//     challengeID: String,
//   },
//   { versionKey: false }
// );

const QuestionSchema = new db.Schema(
	{
		_id: String,
		qnum:Number,
		text:String,
		answers: Array
	},
	{ versionKey: false }
)

///צריך לרשום לו עוד פרמטר עם אותו השם של הקולקשן כדי להגיד לו שאתה מתכוון למה שאתה מתכוון...
const WaGroup = db.model("waGroups", waGroupSchema, "waGroups");

const UsersTest = db.model("users", UsersTestSchema, "users");

const UsersDrafts = db.model("user_drafts", UserDraftSchema, "user_drafts");

const Challenges = db.model("challenges", ChallengeSchema, "challenges");

const TemplatesDB = db.model("templates", TemplateSchema, "templates");

const PlayersDB = db.model("players", PlayerSchema, "players");

const StarsDB = db.model("stars", StarsSchema, "stars");

const GroupsDB = db.model("tel_groups", GroupSchema, "tel_groups");

const ChallengeArray = db.model("group_challnge_array", ChallengeArraySchema, "group_challnge_array");


// function start(client) { ///פונקציית ההתחלה שמקבלת את הקליינט

//   console.log('function successful!')

//   client.onMessage(async message => {
//     if (message.isGroupMsg === true && message.body === '😀') {
//       let i = 0;
//       let user
//       user = await UsersTest.findOne({ phone: `${convertToNum(message.sender.id)}` })
//       user.challengeScore += 10;
//       user.totalScore += 10;
//       await UsersTest.updateOne({ _id: `${user.phone}` }, {
//         .: user.challengeScore,
//         totalScore: user.totalScore
//       })
//         .then(() => {
//           console.log(`User ${user.fullName} updated successfully!`)
//         })
//         .catch((error) => {
//           console.log('Error: ', error)
//         })
//       await client.sendText(message.from, `כל הכבוד ${user.fullName}! קיבלת 10 נקודות.\n אנא שלח '🔄' כדי לקבל ניקוד כולל.`)
//     }

//     if (message.isGroupMsg === true && message.body === '🔄') {
//       let user = await UsersTest.findOne({ _id: `${convertToNum(message.sender.id)}` })
//       await client.sendText(message.from, `!נקודות ${user.totalScore} צבר/ה סה"כ ${user.fullName}`)
//     }

//     if (message.isGroupMsg === false && message.body === '😀') {
//       lastSender = message.from
//       await client.sendText(message.from, 'מצויין! קיבלת 10 נקודות')
//       console.log(`last message was sent from ${lastSender}`)
//     }
//   }
//   );
// }

// wa.create({ ///יוצר את הקליינט, הסשן של התוכנה עם ווצאפ
//   sessionId: "WEST",
//   multiDevice: true, //required to enable multiDevice support
//   authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
//   blockCrashLogs: true,
//   disableSpins: true,
//   headless: true,
//   hostNotificationLang: 'PT_BR',
//   logConsole: false,
//   popup: true,
//   port: 8080,
//   qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
// }).then((waClient) => {
//   client = waClient
//   start(client) ///שולח את הקליינט לפונקציית ההתחלה של לביצוע פעולות
// })
///




const token = '6510559827:AAGKzetnLXsASIqILp2Iw11tb-qFZAqxw9Q';

const bot = new Telegraf(token)
let hourmin = true;
const task = []
const dailyTask = [{}]
const checkIf = () => {
  const d = new Date();
  let hour = d.getHours()
  let min = d.getMinutes
  if (!hourmin) {
    if (hour != 18) {
      setTimeout(()=>{
        checkIf()
          },1740000)
    }else if (min != 0) {
      setTimeout(()=>{
        checkIf()
      },60000)
    }else{
      hourmin = !hourmin
      checkIf()
    }
  }else{
    console.log('starting giving missions');
    // setInterval(()=>{
      const dailyChallnges = async() =>{
        task[0] = {}
        dailyTask[0] = {}
        const Challengearray = await ChallengeArray.find()
        // console.log(Challengearray);
        const _d = new Date()
        const day = _d.getDate()
        const month = _d.getMonth() + 1
        const year = _d.getFullYear()
        Challengearray.forEach(async (val) => {
          const ID = val.challengeID
          const Challenge = await Challenges.findOne({_id:ID})
          const Group = await GroupsDB.findOne({challengeID:ID})
          if (Challenge) {
            // console.log(Challenge);
            const objectFound = Challenge.selections[0][month+'/'+day+'/'+year]
            Group.botMessage = [{text:'welcome to the group',ind:0}]
            Group.emoji = []
            Group.scored = []
            if (objectFound) {
              
              // objectFound.ids = ID
              // console.log(objectFound);
              Object.keys(objectFound).forEach(key => {
                const val = objectFound[key]
                
                val.ids = ID
                // console.log(val);
                // console.log(val);
                const time = val.time
                if (task[0][time]) {
                  task[0][time].push(val)
                }else{
                  task[0][time] = [val]
                }
              });
              // console.log(task[0]);
            }else{
              // Create a new Date object for the given date
              const dateArray = Object.keys(Challenge.selections[0])
              const givenDate = new Date(dateArray[dateArray.length-1]);


              // Compare the two dates using getTime() method and check if the given date is in the past
              if (givenDate.getTime() < _d.getTime()) {
                console.log('The last missions date has been passed deleting challnge from array');
                Group.botMessage = [{text:'challnge is over thank you for participating',ind:0}]
                console.log(Group);
                if (Group.telGroupId) {
                  bot.telegram.sendMessage(Group.telGroupId,'challnge is over thank you for participating')  
                }
                await ChallengeArray.deleteOne({_id:val._id})
              }else if (Group.telGroupId) {
                bot.telegram.sendMessage(Group.telGroupId,'good morning there is no challnge for today')  
              }
            }
            await GroupsDB.updateOne({challengeID:ID},{ $set: Group });
          }else{
            await ChallengeArray.deleteOne({_id:val._id})
            console.error('Challenge not found');
          }
        });
      }
      dailyChallnges()
    // },86400000)
  }
}
setInterval(()=>{
  // console.log(task);
  // console.log(task[0]);
  if (task[0]) {
    const d = new Date
    const timeOfDay = '18:00'//d.getHours() + ':' + d.getMinutes()
    if (task[0][timeOfDay]) {
      // console.log(task[0][timeOfDay]);
      const missions = task[0][timeOfDay]
      const idArray = [{}]
      missions.forEach(obj=>{
        const id = obj.ids
                if (idArray[0][id]) {
                  idArray[0][id].push(obj)
                }else{
                  idArray[0][id] = [obj]
                }
      })
      // console.log(idArray);
      const objArray = Object.keys(idArray[0])
      // console.log(objArray);
      objArray.forEach( async (challngeID) => {
        const tasksOfDay = idArray[0][challngeID]
        // console.log(tasksOfDay);
        // console.log(obj);
        const ID = challngeID
        const Group = await GroupsDB.findOne({challengeID:ID})
        if (Group) {
          
        
        tasksOfDay.forEach(async (obj,ind) => {
        console.log(obj);
        console.log(ID);
        
        // if (Group) {
          if (Group.botMessage[0].text == 'welcome to the group') {
            Group.botMessage = []
          }
          // console.log(objArray);
          // objArray.forEach(async (key,ind)=>{
            // if (key != 'ids') {
              // const val = obj
              // console.log(val);
              Group.botMessage.push({text:obj.message,ind:Group.botMessage.length})
              Group.emoji.push({[obj.emoji]:obj.points})
              if (Group.telGroupId) {
                bot.telegram.sendMessage(Group.telGroupId,`${obj.message}\nTo complete this challnge send this emoji ${obj.emoji}`)
                // bot.telegram.sendMessage(Group.telGroupId,`To complete this challnge send this emoji ${val.emoji}`)
              }
            // }
          // })
          
        // }
      });
      await GroupsDB.updateOne({challengeID:ID},{ $set: Group });
    }
    });
    }
    
    if (timeOfDay == '16:00') {
      const daytimes = task[0]
      // console.log(daytimes);
      const idArray = {}
      Object.keys(daytimes).forEach(key => {
        // console.log(daytimes);
        const mission = daytimes[key]
        // console.log(mission);
        mission.forEach(val => {
          //add counting groups to make sure every group gets only one 
          // console.log(val);
          // console.log(Object.keys(val));
          // console.log(val);
          const ID = val.ids
          if (!idArray[ID]) {
            idArray[ID] = true
          }
          });
        })
        Object.keys(idArray).forEach(async (ID) => {
            const Group = await GroupsDB.findOne({challengeID:ID})
            if (Group) {
              Group.botMessage.push({
                text:'2 Hour warning until challnges end',
                ind:Group.botMessage.length
              })
              Group.messages.push({msg:'2 Hour warning until challnge ends',time:timeOfDay,user:'Ting Global Bot'})
              if (Group.telGroupId) {
                bot.telegram.sendMessage(Group.telGroupId,'2 Hour warning until challnge ends')
              }
              await GroupsDB.updateOne({challengeID:ID},{ $set: Group });
            }
          
        })
      
      console.log(idArray);
    };
        
                
  }          
},10000)

checkIf()



bot.start((ctx)=> ctx.reply('hello i am the ting global bot'))
bot.command('connect_account',(ctx)=>{
  // console.log(ctx.message.text.length);
  if (ctx.message.text == '/connect_account') {
    ctx.reply('please use a 6 digit code after the command')
  }else{
    let code = ctx.message.text.slice(17,ctx.message.text.length)
    try {
      code = parseInt(code)
    }catch(err){
      code = false
    }
    
    if (code) {
      const search = async () => {
            const player = await UsersTest.findOne({telegramId:code});
            if (player) {
              player.telegramId = (ctx.message.from.id).toString()
              updateUserInDB(player)
              ctx.reply('Account connected if this is not the correct account you can request help from ting global help center')
            }else{
              ctx.reply('I did not find a user with that code.\ndid you set up your 6 digit code in your group?')
            }
            
      }
      search()
    }else{
      ctx.reply('please use only digits')
    } 
  }
})
bot.command('finishTask',(ctx) => {
  const msg = ctx.message.text
  if (msg.length == 11) {
    ctx.reply('please add the emoji of your mission to the message')
  }else{
    let msgEmoji = msg.slice(11,msg.length)
    if (msgEmoji[0] == ' ') {
      msgEmoji = msgEmoji.slice(1,msgEmoji.length)
    }
  
    const search = async () => {
      const user = await UsersTest.findOne({telegramId:(ctx.message.from.id).toString()});
      if (user) {
        const group = await GroupsDB.findOne({telGroupId:(ctx.chat.id).toString()})
        console.log(group);
        if (group) {
          if (msgEmoji == '😀') {
            if (dailyTask[0][user._id]) {
              ctx.reply('you already did the global task')
            }else{
              if (user.totalScore) {
              user.totalScore += 10
              }else{
                user.totalScore = 10
              }
              ctx.reply('good job you got 10 points!')
              dailyTask[0][user._id] = true

              updateUserInDB(user)
            } 
          }
          let goodEmoji = false
          let index;
          for (let i = 0; i < group.emoji.length; i++) {
            if (group.emoji[i][msgEmoji]) {
              goodEmoji = !goodEmoji
              index = i
              break
            }
          }
          if (goodEmoji) {
            let userfound = false
            group.scored.forEach((val)=>{
              if (val.user == user._id && val.emoji == msgEmoji) {
                userfound = !userfound
              }});
            if (userfound) {
              ctx.reply('you already did this task')
            }else{
              ctx.reply('Task Finished!!!')
              const points = group.emoji[index][msgEmoji] 
              group.scored.push({user:user._id,emoji:msgEmoji})
              user.totalScore += points
              updateUserInDB(user)
              await GroupsDB.updateOne({_id:group._id},{scored:group.scored})
            }
        }else{
          ctx.reply('you already did this task')
        }
      }else{
        ctx.reply('I did not find a group connected to this telegram group\ndid you connect it?')
      }
    }else{
      ctx.reply('I did not find a user with your id\ndid you set it up?')

    }
  }
  search()
  
}
  
})

bot.command('connect',(ctx)=>{
  const msg = ctx.message.text
  if (msg.length == 8) {
    ctx.reply('please add the link of your group to the message')
  }else{
    let link = msg.slice(8,msg.length)
    if (link[0] == ' ') {
      link = link.slice(1,link.length)
    }
    const findAndUpdate = async ()=>{
      const group = await GroupsDB.findOne({invite:link})
      if (group) {
        try{
          const telLink = await ctx.createChatInviteLink()
          const botMessage = {
            msg:`if you are the one that activeted this group use the telegram command with this link ${telLink.invite_link}`,
            user:'telegram Ting Global Bot'
          }
          group.messages.push(botMessage)
          await GroupsDB.updateOne({invite:link}, { messages:group.messages})
          ctx.reply('Go to your Ting Global group to confirm')
        } catch (error) {
          console.error(error);
          ctx.reply('Error generating invite link.\n did you try giving me admin permissions?');
        }
        
      }else{
        ctx.reply('I did not find a group with this invite link')
      }
    }
    findAndUpdate()
  }
})
bot.command('activate',(ctx)=>{
  const msg = ctx.message.text
  if (msg.length == 9) {
    ctx.reply('please add the link of your group to the message')
  }else{
    let message = msg.slice(9,msg.length)
    if (message[0] == ' ') {
      message = message.slice(1,message.length)
    }
    let Tinglink = message.slice(0,24)
    let telLink = message.slice(24,message.length)
    
    if (telLink[0] == ' ') {
      telLink = telLink.slice(1,telLink.length)
    }
    const findAndConfirm = async ()=>{
      const group = await GroupsDB.findOne({invite:Tinglink})
      if (group) {
        if (group.telInvite == telLink) {
          const chatId = ctx.chat.id
          const telid = await GroupsDB.findOne({telGroupId:chatId})
          if (!telid) {
            group.telGroupId = chatId
        
            const botMessage = {
              msg:`Telegram Group connected!!!\n the link is ${telLink}`,
              user:'telegram Ting Global Bot'
            }
      
            group.messages.push(botMessage)
            await GroupsDB.updateOne({invite:Tinglink}, { $set: group })
            ctx.reply(`your Ting Global group has been connected from here on all commands are available`)
          }
          ctx.reply('this group is already conncted to connect to a new Ting Global group create a new Telegram Group')
        }else{
          ctx.reply('please connect the link to the group in the Ting Global website')
        }
      }else{
        ctx.reply('I did not find a group with this invite link')
      }
    }
    findAndConfirm()
  }
})
bot.help((ctx) => ctx.reply('Send me a sticker (placeholder)'))
bot.on('sticker', (ctx) => ctx.reply(ctx.message.sticker.emoji))
bot.hears('hi', (ctx) => ctx.reply('Hey how can i help you?'))

bot.launch()

app.post("/sendMessage", (req, res) => {
  let temp = req.body.mText;

  const sendReply = async (text) => {
    await client.sendText(lastSender, text);
  };

  sendReply(temp);
});

// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------
//  ----------------------------------!!-- API --!!---------------------------------------------
// ----------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------

app.post("/api", upload.single("image"), (req, res) => {
	const start = async () => {
		//i cant use hasOwnProperty method like i use in below
		// instead i using Object.hasOwn
		if (Object.hasOwn(req.body, "register")) {
			const image = {
				name: "",
				data: "",
				contentType: "",
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
			if ((await UsersTest.findOne({ username: `${_username}` })) == null) {
				//if a phone dosent already exists in DB
				if ((await UsersTest.findOne({ phone: `${_phone}` })) == null) {
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
						image: image,
					};
					console.log("API: all properties for a new user assigned");
					//add new user to DB
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
		} else {
			if (req.body.hasOwnProperty("getTopPlayers")) {
				const players = await PlayersDB.find();
				let newPlayers = players.map((player) => playerData(player));
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
				let check = await UsersTest.findOne({
					username: `${req.body.checkUsername}`,
				});
				let [result, message] = [false, ""];
				if (check == null) {
					[result, message] = [
						true,
						`Great! you can register with username: ${req.body.checkUsername}`,
					];
				} else {
					[result, message] = [
						false,
						"Oops! This username is already taken,\nplease choose another :)",
					];
				}
				res.status(200).json({ result: result, msg: message });
			}

			if (req.body.hasOwnProperty("checkPhone")) {
				let phoneNum = req.body.checkPhone;
				phoneNum = phoneNum.replace("+", "");
				let check = await UsersTest.findOne({ phone: `${phoneNum}` });
				let [result, message] = [false, ""];
				if (check == null) {
					[result, message] = [
						true,
						`Great! you can register with this phone: ${req.body.checkPhone}`,
					];
				} else {
					[result, message] = [
						false,
						"Oops! This phone is already taken,\nplease choose another :)",
					];
				}
				res.status(200).json({ result: result, msg: message });
			}

      if (req.body.hasOwnProperty("register")) {
        let _username = req.body.register.username;
        let _phone = req.body.register.phone;
        _phone = _phone.replace("+", "");
        if ((await UsersTest.findOne({ username: `${_username}` })) == null) {
          if ((await UsersTest.findOne({ phone: `${_phone}` })) == null) {
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
              isAdmin: false,
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
        console.log('hi');
        let phoneNum = req.body.signIn.phone;
        phoneNum = phoneNum.replace("+", "");
        let userData = await UsersTest.findOne({ phone: `${phoneNum}` });
        if (userData != null) {
          let [token, exp] = getToken(userData["phone"]);
          res.status(200).json({ access_token: token, exp: exp, user: userData });
        }
      } else if (req.body.hasOwnProperty("getChallengeData")) {
        data = req.body;
        let challengeData = await Challenges.findOne({
          _id: `${data["getChallengeData"]}`,
        });
        if (challengeData == null) {
          return res
            .status(404)
            .json({ msg: `Challenge ${data["getChallengeData"]} was not found` });
        }
        templateData = await TemplatesDB.findOne({
          _id: `${challengeData["template"]}`,
        });
        if (templateData == null) {
          return res
            .status(400)
            .json({ msg: `template ${challengeData["template"]} was not found` });
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
          let users = await UsersTest.find(
            {},
            { drafts: 0, challenges: 0, templates: 0, createdChallenges: 0 }
          );
          // users  = users.flat()
          users = users.map((val) => {
            return getUserData(val);
          });
          users.reverse();
          res.status(200).json(users);
        }
      };

    }  
  }
  //התחלה
  start();
})

/**
 * Calculate the difference between two dates
 *
 * @param {String} date The date to calculate the difference from
 * @returns {Number} The difference in days
 *
 * @example
 * const dayDiff = calculateDayDifference('2021-01-01');
 * console.log(dayDiff); // 10
 */
function calculateDayDifference(date) {
  const today = new Date();
  const challengeDate = new Date(date);
  const timeDiff = challengeDate.getTime() - today.getTime();
  const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return dayDiff;
}

/**
 * Check if user is logged in
 *
 * @param {Request} req The request object
 * @returns {Object} { loggedIn: Boolean, msg: String }
 */
function isUserLoggedIn(req) {
  if (!req.headers.authorization) {
    return {
      loggedIn: false,
      msg: "Invalid or expired token. Please refresh the page and login",
    };
  }
  // check if token is valid
  const current_user = decode_auth_token(
    req.headers.authorization.split(" ")[1],
    secretKey
  );
  if (!current_user) {
    return res.status(401).json({
      loggedIn: false,
      msg: "Invalid or expired token. Please refresh the page and login",
    });
  }

  return { mesg: null, loggedIn: true };
}

// ==============================================================================================
// ----------------------------------------------------------------------------------------------
//  ----------------------------------!!-- XAPI --!!---------------------------------------------
// ----------------------------------------------------------------------------------------------
// ==============================================================================================

app.post("/xapi", upload.single("image"), async (req, res) => {
	data = req.body;
	console.log("XAPI START");
	goodToken = false;

	let headerToken = req.headers["authorization"];

	try {
		headerToken = headerToken.split(" ")[1];
		goodToken = true;
	} catch (error) {
		console.trace(error);
		console.log(" ::: ERROR OCCURRED ON XAPI, ignoring");
	}

	// ---------------------RETURN---------------------------------
	if (!goodToken) {
		return;
	}
	// ------------------------------------------------------------

	let current_user = decode_auth_token(headerToken, secretKey);

	// ---------------------RETURN---------------------------------
	if (!current_user) {
		return res.status(401).json({
			msg: "Invalid or expired token. Please refresh the page and login",
		});
	}
	// ------------------------------------------------------------

	let user = await UsersTest.findOne({ _id: current_user });

	// user.templates.forEach((t) => {
	// 	for (let key in t) {
	// 		console.log(`==XAPI==: ${key}: ${t[key]}`);
	// 	}
	// });

	const isAdmin = user["isAdmin"];

	// value that xapi returns:
	let final = {};

	if (!Object.hasOwn(data, "userID")) {
		data["userID"] = current_user;
	}

	console.log(`XAPI: data's userID is now ${data["userID"]}`);

	if (String(current_user).trim() === String(data["userID"]).trim()) {
		//object that will return to front
		let userData = {};
		// must have this "editProfile" field when entering dashboard
		//---------------------Start of editProfile-----------------------

		if (Object.hasOwn(data, "editProfile")) {
			console.log(`--editProfile--: start`);
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
				"country",
			];
			// 	this value is needed when editing profile, because user data is send in json
			let parseredBody = null;
			//  this value is needed in another cases
			let newData = null;
			//  try, catch is for two cases:
			//  1. if user is editing profile
			//  2. any another case
			try {
				//parse body from JSON to object
				JSON.parse(req.body.editProfile);
				parseredBody = JSON.parse(req.body.editProfile);

				// image variable structure
				const image = {
					name: "",
					data: "",
					contentType: "",
				};
				// if user sended image to update
				if (req.file) {
					// Read the uploaded image as a Buffer
					const fileBuffer = req.file.buffer;
					// Convert the Buffer to a Base64-encoded string
					const base64Data = fileBuffer.toString("base64");
					// structure how image will be stored in DB
					image.name = req.file.originalname;
					image.data = base64Data;
					image.contentType = req.file.mimetype;
				}
				// copy all user data that sended from front to user variable
				for (let key in allowedChanges) {
					if (parseredBody.hasOwnProperty(allowedChanges[key])) {
						user[allowedChanges[key]] = parseredBody[allowedChanges[key]];
					}
				}
				// copy image
				user.image = image;
				console.log(`--editProfile--: 1.here`);
				// if it is not edit profile case:
			} catch (error) {
				console.log(`--editProfile--: 2.here`);
				newData = data["editProfile"];
				// copy all user data that sended from front to user variable
				for (let key in allowedChanges) {
					if (newData.hasOwnProperty(allowedChanges[key])) {
						user[allowedChanges[key]] = newData[allowedChanges[key]];
						console.log(`--editProfile--: 2.2.here`);
					}
				}
			}

			// ///תוספת שלי, הפרונט אנד מחפש קטגוריה של שחקנים למרות שהיא לא קיימת כשנוצר משתמש חדש
			// if (!(user.hasOwnProperty('players'))) {
			//   user['players'] = []
			// }

			// update DataBase
			console.log(`--editProfile--: 3.here`, user.templates.length);

			await updateUserInDB(user);

			// why i need this? why i use userData variable instead of just user variable?
			const userDoc = user.toObject();
			for (let key in userDoc) {
				if (userDoc.hasOwnProperty(key)) {
					userData[key] = userDoc[key];
				}
			}

			// userDoc.templates.forEach((t) => {
			// 	for (let key in t) {
			// 		console.log(`==XAPI==: ${key}: ${t[key]}`);
			// 	}
			// });

			// if (!String(userData["phone"]).startsWith("+")) {
			//   userData["phone"] = "+" + String(userData["phone"]);
			// }

			let userDrafts = {};

			// if user have drafts
			if (userData.hasOwnProperty("drafts")) {
				for (let draftID in userData["drafts"]) {
					console.log(`--editProfile--: Fetching draft from DB: 
						${draftID} : ${userData["drafts"][draftID]}`);

					// ---
					// if i want to erase all drafts in user.
					// for test and development only:
					// user.drafts = [];
					// await UsersTest.updateOne({ _id: `${user["_id"]}` }, { $set: user });
					// ---

					// find current draft in draft collection:
					let result = await findDraftInDB(userData["drafts"][draftID]);

					// console.log(`--editProfile--: Receiving draft from DB: ${result}`);
					// but takes from it only three parameters,
					// beacause on dashboard page i dont need all the info:
					// id, name, language and challengeId

					if (result != null) {
						userDrafts[draftID] = {
							_id: result["_id"],
							name: result["name"],
							language: result["language"],
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
				// for (let challengeId in userData["createdChallenges"]) {
          for (let i = 0; i < userData["createdChallenges"].length; i++) {
            const challengeId = userData["createdChallenges"][i];
            
          
					// console.log("Fetching draft from DB:", draftID);
					let challenge = await findChallengeInDB(challengeId);
          console.log(challengeId);
					// console.log("Receiving draft from DB:", draftID);
					if (challenge != null) {
						let templateId = challenge["template"];
						let template = await findTemplateInDB(templateId);
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
			// send back to front:
        final["user"] = userData;
      } else if (data.hasOwnProperty("getAvailableTemplates")) {
          let publicTemplates = await TemplatesDB.find({ isPublic: true });

			//  in user collection storages only three parametors of template.
			//  all details storages in templates collection
			// get all details for each users template:
			let privateTemplates = await Promise.all(
				user.templates.map(async (val) => {
					return await TemplatesDB.find({
						_id: `${val._id}`,
						isPublic: false,
					});
				})
			);

			privateTemplates = privateTemplates.flat(); ///המערך שמתקבל מהלולאה הקודמת הוא מערך של מערכים שמכילים כל אובייקט, לכן אנחנו צריכים להוציא את האובייקטים מתוך המערכים הפנימיים
			///מחבר את שני המערכים
			let templates = publicTemplates.concat(privateTemplates);
			templates.filter((val) => val !== null);

			// send back to front:
			final = { templates: templates };

			//---------------------end of getAvailableTemplates-----------------------

			//---------------------Start of addPlayer-----------------------
		} else if (Object.hasOwn(data, "addPlayer")) {
			let phoneNum = req.body.addPlayer.phone;
			phoneNum = phoneNum.replace("+", "");
			if (user["accountType"] == "individual") {
				return res.status(403).json({
					msg: "Your account is not an organization, you can't add players.",
				});
			}
			let findIndividual = await UsersTest.findOne({
				phone: `${phoneNum}`,
			});
			if (findIndividual == null) {
				return res.status(403).json({
					msg: `No user found with this phone number: ${req.body.addPlayer.phone}`,
				});
			}

			let findPlayer = await PlayersDB.findOne({
				userName: `${findIndividual["username"]}`,
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
							score: 0,
						},
					],
				};
				await PlayersDB.create(temp);
				user["players"] = [
					...user["players"],
					{
						playerId: playerId,
						username: findIndividual.username,
						fullName: findIndividual.fullName,
						role: req.body.addPlayer.role,
					},
				];
				console.log("user with players" + user);
				await updateUserInDB(user);
			} else {
				let checkId = findPlayer.clubs.find((val) => val.clubId == user["_id"]);
				console.log("checkId:", checkId);
				if (checkId == undefined) {
					findPlayer["clubs"] = [
						...findPlayer["clubs"],
						{
							clubId: current_user,
							groupName: req.body.addPlayer.groupName,
							role: req.body.addPlayer.role,
							score: 0,
						},
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
							role: req.body.addPlayer.role,
						},
					];
					await updateUserInDB(user);
				} else {
					return res.status(403).json({
						msg: "A player with this phone number is already assigned to your organization!",
					});
				}
			}
			final = {
				logged_in_as: current_user,
				msg: `${findIndividual.username}`,
				playerId: `${findIndividual["_id"]}`,
			};
		} else if (Object.hasOwn(data, "deletePlayer")) {
			let playerToRemove = await PlayersDB.findOne({
				_id: `${data.deletePlayer}`,
			});

			playerToRemove.clubs = playerToRemove.clubs.filter(
				(val) => val.clubId !== user.phone
			);

			user.players = user.players.filter(
				(val) => val.playerId !== data.deletePlayer
			);

			await updateUserInDB(user);

			await PlayersDB.updateOne(
				{ _id: `${playerToRemove["_id"]}` },
				{ $set: playerToRemove }
			);

          final = {
            msg: `sucessfully deleted user '${playerToRemove.username}`,
            playerId: `${playerToRemove["_id"]}`,
          };
        } else if (data.hasOwnProperty("getTemplateData")) {
          let template = await TemplatesDB.findOne({
            _id: `${data["getTemplateData"]}`,
          });
          final = template;
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
							await TemplatesDB.create(templateData);
							let temp = {
								_id: templateId,
								name: templateData.name,
								isPublic: templateData.isPublic,
							};
							user["templates"] = [...user["templates"], temp];
							// to save templets in model "users" in drafts arr but not in model "user_drafts"
							// user["drafts"] = [...user["drafts"], temp];
							// user['templates'] = [...user['templates'], templateId]
						}
					} else {
						templateData["_id"] = templateId;

						if (
							isAdmin == true ||
							user["templates"].find((val) => val._id == templateId) !=
								undefined
						) {
							if (isAdmin == false) {
								templateData["isPublic"] = false;
							}
							await TemplatesDB.updateOne(
								{ _id: `${templateId}` },
								{ $set: templateData }
							);
							let temp = {
								_id: templateId,
								name: templateData.name,
								isPublic: templateData.isPublic,
							};
							let index = user["templates"].findIndex(
								(val) => val._id == templateId
							);
							user["templates"][index] = temp;
							updateUserInDB(user);
						} else {
							let existingTemplate = await TemplatesDB.findOne({
								_id: templateId,
								isPublic: true,
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
              if (
                String(existingTemplateData) !== String(filteredTemplateData)
              ) {
                let originId = templateId;
                templateId = "t_" + generateRandomString();
                templateData["_id"] = templateId;
                templateData["isPublic"] = false;
                templateData["origin"] = originId;
                await TemplatesDB.create(templateData);
                let temp = {
                  _id: templateId,
                  name: templateData.name,
                  isPublic: templateData.isPublic,
                };
                user["templates"] = [...user["templates"], temp];
              }
            }
          }
          updateUserInDB(user);
          final = { logged_in_as: current_user, templateId: templateId };
        } else if (data.hasOwnProperty("deleteTemplate")) {
          // delete multi templates at once with delete many
          if (Array.isArray(data.deleteTemplate.templateIds)) {
            const templateIds = data.deleteTemplate.templateIds;
            if (
              !isAdmin &&
              !templateIds.every((val) =>
                user.templates.find((val2) => val2._id == val)
              )
            ) {
              return res
                .status(404)
                .json({ msg: `Template not found ${templateIds}` });
            }
            await TemplatesDB.deleteMany({ _id: { $in: templateIds } });
            user.templates = user.templates.filter(
              (val) => !templateIds.includes(val._id)
            );
            updateUserInDB(user);
            final = {
              msg: `Successfully deleted templates: ${templateIds}`,
              templateIds: templateIds,
            };
          }
          // delete single template
          else {
            const templateId = data.deleteTemplate.templateId;
            if (
              !isAdmin &&
              !(
                user.templates.find((val) => val._id == templateId) !=
                undefined
              )
            ) {
              return res
                .status(404)
                .json({ msg: `Template not found ${templateId}` });
            }
            await TemplatesDB.deleteOne({ _id: `${templateId}` });
            user.templates = user.templates.filter(
              (val) => val._id !== templateId
            );
            // console.log("user templates:", user.templates);
            updateUserInDB(user);
            final = {
              msg: `Successfully deleted template: ${templateId}`,
              templateId: templateId,
            };
          }
        } else if (data.hasOwnProperty("cloneTemplate")) {
          let originId = data["cloneTemplate"];
          let originTemplate = await TemplatesDB.findOne({
            _id: `${originId}`,
          });
          if (
            originTemplate == null ||
            (user["templates"].find((val) => val._id == originId) ==
              undefined &&
              !originTemplate["isPublic"])
          ) {
            return res
              .status(404)
              .json({ msg: `Template not found ${originId}` });
          }
          let newTemplate = {};

			// toObject is not a native methos in JS. where it is gets from?:)
			const originDoc = originTemplate.toObject();
			// cope all the property of a template to a new one:
			for (let key in originDoc) {
				newTemplate[`${key}`] = originTemplate[`${key}`];
			}

			let newId = "t_" + generateRandomString();
			newTemplate["_id"] = newId;
			newTemplate["isPublic"] = originTemplate["isPublic"] && isAdmin;
			newTemplate["name"] = `${originTemplate["name"]} (copy)`;
			newTemplate["creator"] = current_user;
			// place cloned template in DB, collection templates:
			await TemplatesDB.create(newTemplate);
			let temp = {
				_id: newId,
				name: newTemplate["name"],
				isPublic: newTemplate["isPublic"],
			};
			// update user virable:
			user["templates"] = [...user["templates"], temp];

			// place cloned template in DB, collection users:
			await updateUserInDB(user);

			let excludedKeys = ["days", "preDays", "preMessages"];

			// what it is doing?
			for (let key in newTemplate) {
				if (!excludedKeys.includes(key)) {
					newTemplate[key] = newTemplate[key];
				}
			}

			newTemplate["creator"] = user["phone"];

			// send back to front:
			final = newTemplate;

			//---------------------end of cloneTemplate-----------------------

			//---------------------Start of getAllTemplates-----------------------
		} else if (Object.hasOwn(data, "getAllTemplates")) {
			console.log(`--getAllTemplates--: start`);
			if (isAdmin == false) {
				return res
					.status(403)
					.json({ msg: "user not authorized to view all templates" });
			}
			let templates = await TemplatesDB.find(
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
            final = templates;
          }
          
        }else if (data.hasOwnProperty("deleteChallenge")) {
          challengeId = data["deleteChallenge"]
          if (!user.isAdmin && !user["createdChallenges"].includes(challengeId)) {
            return res
              .status(404)
              .json({ msg: `No challenge found with this ID: ${challengeId}` });
          }
          await Challenges.deleteOne({_id:challengeId})
          if (user["createdChallenges"].includes(challengeId)) {
            user["createdChallenges"] = user["createdChallenges"].filter(id => id != challengeId)
          }
          if (user["challenges"].includes(challengeId)) {
            user["challenges"] = user["challenges"].filter(id => id != challengeId)
          }
          updateUserInDB(user);

          final = {
            msg: `Successfully deleted challenge: ${challengeId}`,
            challengeId: challengeId
          }
        }else if (data.hasOwnProperty("createChallenge")) {
            

            const templateId = data['createChallenge']['templateId'];
            const challengeData = {
              template: templateId,
              selections: data['createChallenge']['selections'],
              name: data['createChallenge']['name'],
              date: data['createChallenge']['date'],
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
        
            const template = await TemplatesDB.findOne({ _id: templateId });
        
            if (!template) {
              return res.status(400).json({ msg: `No template found with this ID: ${templateId}` });
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
        
            const draftId = data['createChallenge']['draftId'];

            await UsersDrafts.deleteOne({ _id: draftId });
            user['drafts'] = user['drafts'].filter((draft) => draft !== draftId);
        
            
        
            

            const groupID = "g_" + generateRandomString();

            const username = user.username ? user.username : 'Jhon Doe'
            const groupChatInfo = {
              _id:groupID,
              challengeID: challengeId,
              invite: '',
              name: `${challengeData.name} group chat`,
              users: [{userid:user._id,role:'admin',username:username}],
              messages:[],
              botMessage:[{text:'welcome to the group',ind:0}],
              emoji:[], 
              scored:[],

            }
            user.groups.push({_id:groupID,name:`${challengeData.name} group chat`})

            await GroupsDB.insertMany(groupChatInfo);
            const arrayItemID = "A_" + generateRandomString();
            challengeItem = {
              _id: arrayItemID,
              challengeID: challengeId,
              groupID:groupID
            }
            await ChallengeArray.insertMany(challengeItem)
            updateUserInDB(user);
            final = groupChatInfo;
        }else if (data.hasOwnProperty("joinGroup")) {
          const inviteId = data["joinGroup"]
          const group = await GroupsDB.findOne({invite:inviteId})
          if (group) {
            let inGroup = false
            for (let i = 0; i < group.users.length; i++) {
              if (group.users[i].userid == user._id) {
                inGroup = !inGroup
                break
              }
            }
            if (!inGroup) {
              const username = user.username ? user.username : 'Jhon Doe'
              const userinfo = {userid:user._id,role:'student',username:username}
              group.users.push(userinfo)
              user.groups.push({_id:group._id,name:group.name})
              updateUserInDB(user);
              await GroupsDB.updateOne({invite:inviteId},{users:group.users})
              return res.status(200).json({ msg:'You are now a part of the group!'});
            }else{
              return res.status(400).json({ msg:'you are already in this group'});
            }
          }else{
            return res.status(400).json({ msg: `No group found with this ID: ${inviteId}` });
          }
  




        }else if (data.hasOwnProperty("loadGroup")) {
          const groupId = data["loadGroup"]["_id"]
          const group = await GroupsDB.findOne({_id:groupId},{name:1,messages:1,botMessage:1,emoji:1})
          if (group) {
            final = group
          }else{
            return res.status(400).json({ msg: `No group found with this ID: ${groupId}` });
          }
        }else if (data.hasOwnProperty("sendMessage")) {
          console.log('send message');
          const groupId = data["sendMessage"]["_id"]
          const group = await GroupsDB.findOne({_id:groupId})
          if (group) {
            const msg = data["sendMessage"]["message"]
            const removeAbove20 = () =>{
              if (group.messages.length >=20) {
                group.messages.shift()
                removeAbove20()
              }
            }
            removeAbove20()
            const time = new Date
            const hourmin = time.getHours()
            const username = user.username ? user.username : 'Jhon Doe'
            const message = {msg:msg,time:hourmin,user:user._id,nickname:username} 

            let botMessage;
            let goodEmoji = false
            if (group.emoji) {
              for (let i = 0; i < group.emoji.length; i++) {
              if (group.emoji[i][msg]) {
                goodEmoji = i
                break
              }
            }
            }
            
            if (goodEmoji) {
              let userfound = group.scored.map((val)=>{if (val.user == user._id && val.emoji == msg) {
                return val
              }});
              if (userfound) {
                botMessage = {msg:'you already did this task',time:hourmin,user:'Ting Global Bot'} 
              }else{
                botMessage = {msg:'Task Finished!!!',time:hourmin,user:'Ting Global Bot'}
                const points = group.emoji[goodEmoji][msg][points] 
                group.scored.push({user:user._id,emoji:msg})
                user.totalScore += points
                updateUserInDB(user)
                await GroupsDB.updateOne({_id:groupId},{scored:group.scored})
              }
              group.messages.push(message)
              group.messages.push(botMessage)
            }else if (msg == '/hello') {
              botMessage = {msg:'hi there!',time:hourmin,user:'Ting Global Bot'} 

              group.messages.push(message)
              group.messages.push(botMessage)
            }else if (msg.startsWith('/promote')) {
              let number = msg.slice(8,msg.length)
              if (number[0] == ' ') {
                number = number.slice(1,msg.number)
              }
              let admin = false
              for (let i = 0; i < group.users.length; i++) {
                if (group.users[i].userid == user._id ) {
                  if (group.users[i].role == 'admin') {
                    admin =!admin
                    break
                  }else{
                    break
                  }
                }
              }
              if (admin) {
                let foundUser = false
                let position;
                for (let i = 0; i < group.users.length; i++) {
                  if (group.users[i].userid == number) {
                    foundUser =!foundUser
                    position = i
                    break
                  }
                }
                if (foundUser) {
                  if (group.users[position].role == 'student'){
                    group.users[position].role = 'instructor'
                  }else if (group.users[position].role == 'instructor') {
                    group.users[position].role = 'admin'
                  }
                  await GroupsDB.updateOne({_id:groupId},{users:group.users})
                  botMessage = {msg:'User has been premoted!!',time:hourmin,user:'Ting Global Bot'}
                }else{
                  botMessage = {msg:'I did not find a user with that number.\n did you type the correct one?',time:hourmin,user:'Ting Global Bot'}
                }
                group.messages.push(botMessage)
              }else{
                botMessage = {msg:'i am sorry only admins have accses to this command.\n if you would like to use it you can ask an admin for a promotion.',time:hourmin,user:'Ting Global Bot'} 
                group.messages.push(message)
                group.messages.push(botMessage)
              }
              
               
            }else if (msg == '/invite') {
              let instructor = false
              for (let i = 0; i < group.users.length; i++) {
                if (group.users[i].userid == user._id ) {
                  if (group.users[i].role == 'instructor' || group.users[i].role == 'admin') {
                    instructor =!instructor
                    break
                  }else{
                    break
                  }
                }
              }
              if (instructor) {
                if (group.invite.length > 0) {
                  botMessage = {msg:`this is the invite code for this group\n ${group.invite} send this to the users you want to invite`,time:hourmin,user:'Ting Global Bot'}
                }else{
                  const inviteCode = "i_" + generateRandomString();
                  botMessage = {msg:`this is the invite code for this group\n ${inviteCode} send this to the users you want to invite`,time:hourmin,user:'Ting Global Bot'}
                  group.invite = inviteCode
                  await GroupsDB.updateOne({_id:groupId},{invite:group.invite})
                }
              }else{
                botMessage = {msg:'sorry you need to be an instructor or above to use this command',time:hourmin,user:'Ting Global Bot'}
              }
              group.messages.push(message)
              group.messages.push(botMessage)
              
            }else if (msg.startsWith('/nickname')) {
              let nickname = msg.slice(9,msg.length)
              if (nickname[0] == ' ') {
                nickname = nickname.slice(1,msg.length)
              }
              user.username = nickname
              updateUserInDB(user)
              botMessage = {
                msg:`Username changed to ${nickname}`,
                time:hourmin,
                user:'Ting Global Bot'
              }
              group.messages.push(message)
              group.messages.push(botMessage)
            }else if (msg.startsWith('/help')) {
              group.messages.push(message)
              if (msg == '/help') {
                botMessage = {
                  msg:'Here are the commands i know:\n1. /hello\n2. /invite\n3. /promote\n4. /nickname\n5. /help\n type (/help) then the number of the command you want info on',
                  time:hourmin,
                  user:'Ting Global Bot'
                }
                group.messages.push(botMessage)
              }else{
                let number = msg.slice(5,msg.length)
                if (number[0] == ' ') {
                  number = number.slice(1,msg.length)
                }
                if (number == 1) {
                  botMessage = {
                    msg:'This command is to say hello to me!',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }else if (number == 2) {
                  botMessage = {
                    msg:'This command is used to create an invite link to add players to the group,\n it can only be used by instructors.',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }else if (number == 3) {
                  botMessage = {
                    msg:'This command promotes a student to instructor and instructor to an admin,\n it can only be used by admins.',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }else if (number == 4) {
                  botMessage = {
                    msg:'This command gives you a nickname to identify in the group.',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }else if (number == 5) {
                  botMessage = {
                    msg:'This command gives a list of all commands available.',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }else {
                  botMessage = {
                    msg:'I am sorry i dont know this command',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }
                
                group.messages.push(botMessage)
                
                
              }


              
            }else if (msg.startsWith('/telegram')) {
              let shortmsg = msg.slice(9,msg.length)
              if (shortmsg[0] == ' ') {
                shortmsg = shortmsg.slice(1,msg.length)
              }
              if (shortmsg == 'link') {
                if (group.telInvite) {
                  botMessage = {
                    msg:`Here is the invite link to your telegram group\n${group.telInvite}`,
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }else{
                  botMessage = {
                    msg:'I am sorry you didnt register a telegram group to do that please add the TingGlobalBot to your group and give it your groupid',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }
                group.messages.push(message)
                group.messages.push(botMessage)
              }else{
                let admin = false
                for (let i = 0; i < group.users.length; i++) {
                  if (group.users[i].userid == user._id ) {
                    if (group.users[i].role == 'admin') {
                      admin =!admin
                    }
                    break
                  }
                }
                if (admin) {
                  group.telInvite = shortmsg
                  await GroupsDB.updateOne({_id:groupId},{telInvite:group.telInvite})
                  botMessage = {
                    msg:'telegram invite code registerd!!\n you can go to telegram and activate the group now!',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                  group.messages.push(message)
                  group.messages.push(botMessage)
                }else{
                  botMessage = {
                    msg:'only admins can use this command',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                  group.messages.push(message)
                  group.messages.push(botMessage)
                }
              }
              
            }else if (msg.startsWith('/connect_account')) {
              if (msg == '/connect_account') {
                botMessage = {
                  msg:'please use a 6 digit code after the command',
                  time:hourmin,
                  user:'Ting Global Bot'
                }
                group.messages.push(message)
                group.messages.push(botMessage)
              }else{
                let code = msg.slice(17,msg.length)
                code = parseInt(code)
                if (code) {
                  if (code <= 999999 && code >= 100000) {
                    user.telegramId == code
                    updateUserInDB(user)
                    botMessage = {
                      msg:'code accepted if you forget it you can set it again\nbut after connecting your telegram account it cannot be changed',
                      time:hourmin,
                      user:'Ting Global Bot'
                    }
                  }else{
                    botMessage = {
                      msg:'please use a 6 digit code',
                      time:hourmin,
                      user:'Ting Global Bot'
                    }
                  }
                }else{
                  botMessage = {
                    msg:'please use only digits',
                    time:hourmin,
                    user:'Ting Global Bot'
                  }
                }
                group.messages.push(botMessage)
              }
            }else{
              group.messages.push(message)
            }




            await GroupsDB.updateOne({_id:groupId},{messages:group.messages})
          } 

            final = group.messages
        }else if (data.hasOwnProperty("deleteGroup")) {
            const groupId = data["deleteGroup"]["_id"]
            // const group = await GroupsDB.findOne({_id:groupId},{name:1,messages:1,botMessage:1})
            // if (group) {
            //   final = group
            // }else{
            //   return res.status(400).json({ msg: `No group found with this ID: ${groupId}` });
            // }
        } else if (data.hasOwnProperty('createTemplateWithAi')) {
            try {
              // try 3 times to create template with ai
              const maxAttempts = progressMaxAttempts;
              // create array to store failed templates
              const templates = [];
              for (let i = 0; i < maxAttempts; i++) {
                // update progress attempts
                progressAttempts = i + 1;
                progressEmitter.emit('progressAttemptsChanged');
                // console.log('progressAttempts:', progressAttempts);
  
                // delay of 5 secs for testing
                // await new Promise((resolve) => setTimeout(resolve, 5000));
                // if (i + 1 == maxAttempts) {
                //   progressAttempts = 0;
                //   return;
                //   // throw 'test';
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
                  console.log('User not in same page, cancelling');
                  throw 'User not in same page, cancelling';  
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
                } = data.createTemplateWithAi;
  
                // create template
                const templateId = 't_' + generateRandomString();
                let template = await generateChallenge({
                  creator: current_user,
                  id: templateId,
                  topic,
                  days,
                  tasks,
                  messages,
                  preDays,
                  preMessagesPerDay,
                  language: 'English', // only english supported for now
                  targetAudience,
                  numAttempts: 1,
                });
  
                if (template?.error) {
                  console.error('Failed to create template with AI');
                  if (template.response) {
                    templates.push(template.response);
                  }
                  if (i + 1 === maxAttempts) {
                    // take the template with the most days
                    template = templates.reduce((prev, current) =>
                    prev.days.length > current.days.length ? prev : current
                    );
                    console.log(
                      `No more attempts left, returning template with the most days (${template.days.length})`
                    );
                  } else {
                    console.log('Trying again');
                    continue;
                  }
                }
  
                progressAttempts = maxAttempts;
                progressEmitter.emit('progressAttemptsChanged');
                
                // add template to db
                await TemplatesDB.create(template);
  
                // add template to user
                const temp = {
                  _id: templateId,
                  name: template.name,
                  isPublic: template.isPublic,
                };
                user.templates = [...user.templates, temp];
                updateUserInDB(user);
  
                fs.writeFileSync(
                  'GPT/json/failed.json',
                  JSON.stringify(templates)
                );
  
                // return template
                final = { template };
                console.log('Template created successfully');
                break;
              }
            } catch (error) {
              progressAttempts = 0;
              console.error(error);
              return res.status(400).json({ msg: error });
            }          
        }
        res.status(200).json(final);
      }
    }
  );

app.listen(3000, () => {
  console.log("server works on port 3000!");
});


/*************************
 *** Progress tracking ***
 ************************/
const progressEmitter = new EventEmitter();

let progressAttempts = 0;
let progressMaxAttempts = 3;

app.get('/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const progressListener = () => {
    // calculate progress percentage
    const progress = Math.floor(
      (progressAttempts / progressMaxAttempts) * 100
    );
    const data = {
      progress,
      attempts: progressAttempts,
      maxAttempts: progressMaxAttempts,
    };
    if (progress === 100) {
      data.done = true;
    }
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  progressListener();

  progressEmitter.on('progressAttemptsChanged', progressListener);
  req.on('close', () => {
    progressEmitter.removeListener('progressAttemptsChanged', progressListener);
  });
});


// start article generator schedule to run every Monday at 9:00
// scheduleArticleJob(1, 9, 0);
