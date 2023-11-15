const express = require("express");

const app = express();
const bodyParser = require("body-parser");


const { Telegraf } = require('telegraf')

const db = require("mongoose");

const cors = require("cors");

let client;



let lastSender;

const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const { Z_UNKNOWN } = require("zlib");
const { error } = require("console");

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
  console.log("new user to update:", user);
  await UsersTest.updateOne({ _id: `${user["_id"]}` }, { $set: user });
  return;
};

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
    telegramId: String,
  },
  { versionKey: false }
);

const UserDraftSchema = new db.Schema(
  {
    _id: String,
    days: Array,
    image: String,
    allowTemplateCopies: Boolean,
    date: String,
    isTemplatePublic: Boolean,
    language: String,
    lastSave: Number,
    name: String,
    preMessages: Array,
    preDays: Array,
    days: Array,
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
    image: String,
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
      botMessage:String,
      emoji:String,
      selectionPosition:Number,
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

///צריך לרשום לו עוד פרמטר עם אותו השם של הקולקשן כדי להגיד לו שאתה מתכוון למה שאתה מתכוון...
const WaGroup = db.model("waGroups", waGroupSchema, "waGroups");

const UsersTest = db.model("users", UsersTestSchema, "users");

const UsersDrafts = db.model("user_drafts", UserDraftSchema, "user_drafts");

const Challenges = db.model("challenges", ChallengeSchema, "challenges");

const TemplatesDB = db.model("templates", TemplateSchema, "templates");

const PlayersDB = db.model("players", PlayerSchema, "players");

const StarsDB = db.model("stars", StarsSchema, "stars");

const GroupsDB = db.model("tel_groups", GroupSchema, "tel_groups");

const ChallengeArray = db.model("group_array", ChallengeArraySchema, "group_array");

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
//         challengeScore: user.challengeScore,
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



// Replace 'YOUR_BOT_TOKEN' with your actual bot token
const token = '6510559827:AAGKzetnLXsASIqILp2Iw11tb-qFZAqxw9Q';

// const bot = new TelegramBot(token, { polling: true });
const bot = new Telegraf(token)
const groupArray = []
let hourmin = false;
const checkIf = () => {
  const d = new Date();
  // let day = d.getDay()
  let hour = d.getHours()
  let min = d.getMinutes
  if (!hourmin) {
    if (hour != 8) {
      setTimeout(()=>{
        checkIf()
          },1740000)
    }else if (min != 30) {
      setTimeout(()=>{
        checkIf()
      },60000)
    }else{
      hourmin = !hourmin
      checkIf()
    }
  }else{
    
    setTimeout(()=>{
      checkIf()
      const dailyChallnges = async() =>{
        const Challengearray = await ChallengeArray.find()
        const _d = new Date()
        const day = _d.getDate()
        const month = _d.getMonth()
        // sync Monthes between create challnge scheme and dailyChallnges jan = 0
        const date = {day,month}
        Challengearray.forEach(async (val) => {
          const ID = val.challengeID
          const Challenge = await Challenges.findone({_id:ID})
          const Group = await GroupsDB.findone({_id:ID})
          if (Challenge) {
            const elementPos = Challenge.selection.map(function(val,ind) { if (val.date.day == date.day && val.date.month == date.month) {
              return ind; 
            }});
            const objectFound = Challenge.selection[elementPos];
            if (objectFound) {
              Group.botMessage = objectFound.text
              Group.emoji = objectFound.emoji
              Group.selectionPosition = elementPos
              Group.scored = []
              if (Group[i].telGroupId) {
                bot.telegram.sendMessage(Group[i].telGroupId,'good morning here is your challnge for today')  
                bot.telegram.sendMessage(Group[i].telGroupId,objectFound.text)
                bot.telegram.sendMessage(Group[i].telGroupId,`To complete this challnge send this emoji ${objectFound.emoji}`)
              }
            }else{
              Group.botMessage = 'welcome to the group'
              Group.emoji = null
              Group.selectionPosition = null
              if (Group[i].telGroupId) {
                bot.telegram.sendMessage(Group[i].telGroupId,'good morning there is no challnge for today')  
              }
              
            }
            await GroupsDB.updateOne({_id:ID},{ $set: Group });
          }else{
            console.error('Challenge not found');
          }


          
        });

      }
      dailyChallnges()
    },86400000)
  }
}
// checkIf()
bot.start((ctx)=> ctx.reply('hello i am the ting global bot'))
bot.command('findM',(ctx) => {

  // const search = () =>{
  //   Challenges.findOne({_id:'c_jafvUgNsrGHTyXaka5UJFw'})
  //   .then ((response)=>{ctx.reply(response.selections[0]['1kpy8q9dj']['1kpy8q9dk'])})
      
    
    
  // }
  // search()
  

  // bot.telegram.getChatMember()
      // console.log(ctx.message);
  // if (ctx.message.text.length === 6) {

    
  //   const search = async () => {
  //     const player = await UsersTest.findOne({telegramId:ctx.message.from.id});
  //     if (player) {
  //      ctx.reply(`Welcome ${player.username}`)
      //  let i = 0;
//       let user
//       user = await UsersTest.findOne({ phone: `${convertToNum(message.sender.id)}` })
//       user.challengeScore += 10;
//       user.totalScore += 10;
//       await UsersTest.updateOne({ _id: `${user.phone}` }, {
//         challengeScore: user.challengeScore,
//         totalScore: user.totalScore
//       })
//         .then(() => {
//           console.log(`User ${user.fullName} updated successfully!`)
//         })
//         .catch((error) => {
//           console.log('Error: ', error)
//         })
      // }else{
      //  ctx.reply('I didnt find a user with your Id.\nif you did not register please add your number after the /start command to register.')
      // }
    //  }
    //  search()
  // }else{
    // const phonenumber = ctx.message.text.substring(7,ctx.message.text.length)
    // // console.log(phonenumber);
    // const addIdToUser = async () => {
    //  let player = await UsersTest.findOne({phone:phonenumber});
    // //  console.log(player);
    // //  player['telegramId'] = ctx.message.from.id
    //  if (player) {
    //   //add id to user in database
    //   //
    //   // let obj = {
    //   //   '1':'hi1',
    //   //   '2':'hi2'
    //   // }
    //   // const num = '3'
    //   // const info = 'gk'
    //   // obj[num] = info
    //   // console.log(obj);
      
    //   // console.log(player);


    //   await UsersTest.findOneAndUpdate({ _id: phonenumber },{telegramId:ctx.message.from.id})
    //     .then(() => {
    //       console.log(`User ${player.username} updated successfully!`)
    //     })
    //     .catch((error) => {
    //       console.log('Error: ', error)
    //     })
    //   ctx.reply(`Welcome ${player.username}`)
    //  }else{
    //   ctx.reply('I didnt find a user with that number.\nis the number correct?\nremember to use the same number you use to login.')
    //  }
    // }
    // addIdToUser()

  // }
  // console.log(ctx.message.text);

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
          ctx.reply('Error generating invite link.');
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
        let telInvite = group.telInvite.slice(0,26) + group.telInvite.slice(27,group.telInvite.length)
        if (telInvite == telLink) {
          group.telGroupId = ctx.chat.id
        
          const botMessage = {
            msg:`Telegram Group connected!!!\n the link is ${telLink}`,
            user:'telegram Ting Global Bot'
          }
      
          group.messages.push(botMessage)
          await GroupsDB.updateOne({invite:Tinglink}, { $set: group })
          ctx.reply(`your Ting Global group has been connected from here on all commands are available`)
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
bot.command('finish',(ctx)=>{
  const msg = ctx.message.text
  if (msg.length == 7) {
    ctx.reply('please add the link of your group to the message')
  }else{
    let message = msg.slice(7,msg.length)
    if (message[0] == ' ') {
      message = message.slice(1,message.length)
    }
    const findAndConfirm = async ()=>{
      const group = await GroupsDB.findOne({telGroupId:ctx.chat.id})
      // if (group) {
      //   let userfound = group.scored.map((val)=>{if (val == user._id) {
      //     return val
      //   }});
      //   if (userfound) {
      //     botMessage = {msg:'you already did this task',time:hourmin,user:'Ting Global Bot'} 
      //   }else{
      //     const challenge = await Challenges.findOne({_id:group.challengeID},{selections:1})
      //     botMessage = {msg:'Task Finished!!!',time:hourmin,user:'Ting Global Bot'} 
      //     const mission = challenge[group.selectionPosition]
      //     group.scored.push({user:user._id,points:mission.points})
      //     // user.totalScore += mission.points
      //     // updateUserInDB(user)
      //     //
      //     //
      //     // give points to player
      //     //
      //     //
      //     //
      //     //
      //     //
      //     //
      //     //
      //     //
      //     //
      //     //
      //     //
          
      //     await GroupsDB.updateOne({_id:groupId},{scored:group.scored})
          
      //   }
      //   group.messages.push(message)
      //   group.messages.push(botMessage)
      //   if (telInvite == telLink) {
      //     group.telGroupId = ctx.chat.id
        
      //     const botMessage = {
      //       msg:`Telegram Group connected!!!\n the link is ${telLink}`,
      //       user:'telegram Ting Global Bot'
      //     }
      
      //     group.messages.push(botMessage)
      //     await GroupsDB.updateOne({invite:Tinglink}, { $set: group })
      //     ctx.reply(`your Ting Global group has been connected from here on all commands are available`)
      //   }else{
      //     ctx.reply('please connect the link to the group in the Ting Global website')
      //   }
      // }else{
      //   ctx.reply('please connect your group before doing missions')
      // }
    }
    findAndConfirm()
  }
})
bot.help((ctx) => ctx.reply('Send me a sticker (placeholder)'))
bot.on('sticker', (ctx) => ctx.reply(ctx.message.sticker.emoji))
bot.hears('hi', (ctx) => ctx.reply('Hey how can i help you?'))

// bot.on('new_chat_members', async (ctx) => {
//   const chat = ctx.chat
//   const botName = (await ctx.telegram.getMe()).username
//   console.log(botName);
  
//   // Check if the bot is among the new chat members.
//   let botIsNewMember;
//   // console.log(chat.first_name);
//   console.log(chat.username);
//   if (chat.title == botName) {
//     botIsNewMember = chat.first_name
//   }
//   // const botIsNewMember = chat.first_name
//   // const botIsNewMember = chat.new_chat_members.some(member => member.username === botName);
  
//   if (botIsNewMember) {
//     const welcomeMessage = `Hello! I am your friendly bot. Thank you for adding me to this chat.`;
  
//     // Send the welcome message to the chat.
//     ctx.reply(welcomeMessage);
//   }
// });

// bot.command('/go',(ctx)=>{ctx.reply(ctx.telegram.createChatInviteLink(ctx.chat.id,ctx.chat.id))})
bot.command('createinvite', async (ctx) => {
  // Replace 'chatId' with the ID of the group or channel for which you want to create an invite link.
  const chatId = ctx.chat.id;

  // Create an invite link for the specified chat.
  const inviteLink = await ctx.telegram.createChatInviteLink(chatId);

  // Send the invite link to the user who triggered the command.
  ctx.reply(`Here is the invite link for the chat: ${inviteLink.invite_link}`);
});

bot.launch()

// bot.onText(/\/start/, (msg) => {
//     chatId = msg.chat.id;
//     bot.sendMessage(chatId,
//         'bot commands:\n.1 /Time: gives the time\n.2 /Date: gives the date\n.3 /storeData: stores info in shelfs (/storeData (shelf name) (data stored))\n.4 /giveData: retrives info in shelf (/giveData (shelf name))\n.5 /gif: gives a random gif\n.6 work in progress'
//     )
//     stop = false
// });

// bot.onText(/\/message (.+)/, (msg, match) => {
//   console.log(msg);
//   const chatId = msg.chat.id;
//   const Match = match[1]
//   console.log(match);
//   console.log(Match);
//   // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, 'Received your message');
// });


// bot.onText(/\/Time/, (msg) => {
//     const chatId = msg.chat.id;
    // const d = new Date();
//     const hour = d.getHours()
//     const min = d.getMinutes()
//     const second = d.getSeconds()
//     bot.sendMessage(chatId, `the time is ${hour}:${min}:${second}`);
// });
// bot.onText(/\/Date/, (msg) => {
//     const chatId = msg.chat.id;
//     const d = new Date();
//     let dayofweek = d.getDay()
//     if (dayofweek == 0) {
//         dayofweek = 'Sunday'
//     }else if (dayofweek == 1) {
//         dayofweek = 'Monday'
//     }else if (dayofweek == 2) {
//         dayofweek = 'Tuesday'
//     }else if (dayofweek == 3) {
//         dayofweek = 'Wednesday'
//     }else if (dayofweek == 4) {
//         dayofweek = 'Thursday'
//     }else if (dayofweek == 5) {
//         dayofweek = 'Friday'
//     }else if (dayofweek == 6) {
//         dayofweek = 'Saturday'
//     }
//     const day = d.getDate()
//     const month = d.getMonth() + 1
//     const year = d.getFullYear()
//     bot.sendMessage(chatId, `the date is ${day}.${month}.${year}\n${dayofweek}`);
// });

// let shelfs = []
// bot.onText(/\/storeData (.+)/, (msg, match) => {
//     const chatId = msg.chat.id;
//     let input = match[1];
    
//     const shelfName = input.substring(0,input.indexOf(' '))
//     const shelfData = input.substring(input.indexOf(' ')+1,)
//     shelfs.push({shelfName,shelfData})
//     bot.sendMessage(chatId, `stored ${shelfData} in ${shelfName}`);
// });

// bot.onText(/\/giveData (.+)/, (msg, match) => {
//     const chatId = msg.chat.id;
//     let input = match[1];
//     let shelfoutput
//     for (let i = 0; i < shelfs.length; i++) {
//         if (shelfs[i].shelfName == input) {
//             shelfoutput = shelfs[i]
//             break
//         }
//     }
//     bot.sendMessage(chatId,`the data from shelf (${shelfoutput.shelfName}) is (${shelfoutput.shelfData})`)
// });

// bot.onText(/\/gif/, (msg) => {
//     const chatId = msg.chat.id;
//     // const apiKey = 'Hm9ug9Kc9c2E3Xi5YAoNalRkPPLxHnMP'
//     // const getRandomGif = async () => {
//     //     try {
//     //       const response = await fetch(
//     //         `https://api.giphy.com/v1/gifs/random?api_key=${apiKey}`
//     //       );
//     //       const data = await response.json();
//     //         console.log(data);
//     //         // bot.sendAnimation(chatId,data.data.embed_url)
//     //         bot.sendAnimation(chatId,data.data.embed_url)
//     //     } catch (error) {
//     //       console.error('Error:', error);
//     //     }
//     //   }
    
//     //   // Call the function to get a random GIF
//     //   getRandomGif();
//     const gifgif = async () => {
//             // Giphy API defaults
//             const giphy = {
//                 baseURL: "https://api.giphy.com/v1/gifs/",
//                 apiKey: "Hm9ug9Kc9c2E3Xi5YAoNalRkPPLxHnMP",
//                 tag: "fail",
//                 type: "random",
//                 rating: "pg-13"
//             };
            
//             // Giphy API URL
//             let giphyURL = encodeURI(
//                 giphy.baseURL +
//                     giphy.type +
//                     "?api_key=" +
//                     giphy.apiKey +
//                     "&tag=" +
//                     giphy.tag +
//                     "&rating=" +
//                     giphy.rating
//             );
        
//             // Call Giphy API and render data
//             try {
//               const response = await fetch(
//                 `${giphyURL}`
//               );
//               const data = await response.json();
//               bot.sendMessage(chatId,data.data.url)
//             } catch (error) {
//               bot.sendMessage(chatId,'node-fetch@ not installed on server so gif does not work')
//               // console.error('Error:', error);
//             }
        
//         };
//         gifgif()
// })

app.post("/sendMessage", (req, res) => {
  let temp = req.body.mText;

  const sendReply = async (text) => {
    await client.sendText(lastSender, text);
  };

  sendReply(temp);
});

app.post("/api", (req, res) => {
  const start = async () => {
     if (req.body.hasOwnProperty("getTopPlayers")) {
      const players = await PlayersDB.find();
      let newPlayers = players.map((player) => playerData(player));
      if (newPlayers.length > 18) {
        newPlayers = newPlayers.slice(0, 18);
      }
      newPlayers.sort((a, b) => b.totalScore - a.totalScore);
      function playerData(player) {
        const pData = {};
        const keys = ["userName", "fullName", "phone", "totalScore","stats"];
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
    }
    else if (req.body.hasOwnProperty("checkUsername")) {
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
        }
      }
      console.log("final is:", challengeData);
      res.status(200).json(challengeData);
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
    if (req.body.hasOwnProperty("getPublicTemplateID")) {
      data = req.body; // all the names/title of the challenge
      let templates = await TemplatesDB.find({//find all public templates with language and name set as 1
      });
      let challengeID;
      for (let i = 0; i < templates.length; i++) {
        if (data["getPublicTemplateID"].includes(templates[i].name) && templates[i].language == "English"){// if the template name is in the names of the template you picked
          challengeID = templates[i]._id //return its id and stop
          break
        }
      }
      if (challengeID == null) {
        return res
          .status(404)
          .json({ msg: `Challenge ${data["getPublicTemplateID"]} was not found` });
      }else{
        return res
          .status(200)
          .json(challengeID);
      }
    }
    if (req.body.hasOwnProperty("getChallengesByName")) {
      data = req.body
      const names = data["getChallengesByName"];

      // Fetch challenges
      const challenges = await Challenges.aggregate([{$project:{  
        days: 0,
        preMessages: 0,
        preDays: 0,
        selections: 0,
        scores: 0
      }}]);

      const filteredChallenges = [];

      const calculateDayDifference = (date) => {
        // change variable into a JavaScript Date object
        const challengeDateObj = new Date(date);
        // Get the current date
        const todayDate = new Date();
        const timeDifference = todayDate - challengeDateObj;
        // Convert to days
        const dayDifference = Math.floor(timeDifference / (24 * 60 * 60 * 1000));

        return dayDifference;
      }
      //checks challnge has a date and platforms fields and that name is the same as the challenge picked
      for (let i = 0; i < challenges.length; i++) {
        if ( 
          challenges[i].date &&
          challenges[i].platforms &&
          names.includes(challenges[i].name)
          // when activted code below crashes server
          // challenges[i].platforms.includes("wa") 
        ) {
          //gives the challenge a language and checks if it started
          const templateId = challenges[i].template;
          const template = await TemplatesDB.findOne(
            { _id: templateId },
            { language: 1 }
          );
          if (template) {
            challenges[i].language = template.language;
            challenges[i].dayDiff = calculateDayDifference(challenges[i].date);
            if (challenges[i].dayDiff <= 1000) {//1000 for now no new challnges,change to 0 when you have new challnges
              filteredChallenges.push(challenges[i]);
            }
          }
        }
      }
      //sorts the challenges by dates
      filteredChallenges.sort((a, b) => a.dayDiff - b.dayDiff);
      //searchs for the creator of the challenge to set as a username 
      for (let i = 0; i < filteredChallenges.length; i++) {
        //can make a more efficient way only calling db once
        const creator = await UsersTest.findOne(
          { phone: filteredChallenges[i].creator },
          { organization: 1, fullName: 1, username: 1 }
        );
        if (creator) {
          filteredChallenges[i].creator = creator.organization || creator.fullName || creator.username;
        }else{//90% made by sharon which doesnt have an account so it returns unknown still needs testing
          filteredChallenges[i].creator = 'unknown'
        }
            
      }
      //returns challenges after validations
      return res
        .status(200)
        .json(filteredChallenges);


    }
    if (req.body.hasOwnProperty("rankStars")) {
      data = req.body
      let stars = await StarsDB.find({
      });
      let goodToGo = false
      let challengeID;
      let userid
      try{
        userid = data["rankStars"].user.toString()
        goodToGo = !goodToGo
      }catch(error){

      }
      if (goodToGo) {
        let user = {id:userid,stars:data["rankStars"].star}//data from client data["rankStars"].userId
        let savedUsers;
        let foundId = false
        
        for (let i = 0; i < stars.length; i++) {
          if (data["rankStars"].names.includes(stars[i].title)){
            challengeID = stars[i]._id//return its id and stop
            savedUsers = stars[i].users
            for (let v = 0; v < savedUsers.length; v++) {
              // console.log(savedUsers[v].id);
              // console.log(user.id);
              if (savedUsers[v].id == user.id) {
                savedUsers[v] = user
                foundId = !foundId
                await StarsDB.findOneAndUpdate({_id:challengeID},{users:savedUsers});
                break
              }
            }
            if (!foundId) {
              savedUsers.push(user)
              await StarsDB.findOneAndUpdate({_id:challengeID},{users:savedUsers});
            }
            break
          }
        }
        if (challengeID == null) {
          return res
            .status(404)
            .json({ msg: `Challenge ${data["rankStars"].names} was not found` });
        }else{

          return res
            .status(200)
            .json(challengeID);
        }
      }
    }
    /////////////////////////
    if (req.body.hasOwnProperty("getRankings")) {
      let stars = await StarsDB.find({});
        return res
          .status(200)
          .json(stars);
      // }
    }
    
  }
  //התחלה
  start();
});

app.post("/xapi", async (req, res) => {
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
  if (goodToken) {
    let current_user = decode_auth_token(headerToken, secretKey);
    if (!current_user) {
      return res.status(401).json({
        msg: "Invalid or expired token. Please refresh the page and login",
      });
    }
    let user = await UsersTest.findOne({ _id: current_user });

    const isAdmin = user["isAdmin"];

    let final = {};

    if (!data.hasOwnProperty("userID")) {
      data["userID"] = current_user;
    }

    if (data.hasOwnProperty("userID")) {
      console.log(`data's userID is now ${data["userID"]}`);
      if (String(current_user).trim() === String(data["userID"]).trim()) {
        ///אנחנו בסוף נשלח את את זה חזרה לפרונט
        let userData = {};

        if (data.hasOwnProperty("editProfile")) {
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
            "country",
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
                
              // }
              // console.log(userData["createdChallenges"]);
              // console.log("Fetching draft from DB:", draftID);
              // console.log(challengeId);
              challenge = await Challenges.findOne({ _id: challengeId })
              // console.log(challenge); 
              // console.log("Receiving draft from DB:", draftID);
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
          let publicTemplates = await TemplatesDB.find({ isPublic: true });

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

          final = { templates: templates };
        } else if (data.hasOwnProperty("addPlayer")) {
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
            updateUserInDB(user);
          } else {
            let checkId = findPlayer.clubs.find(
              (val) => val.clubId == user["_id"]
            );
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
              updateUserInDB(user);
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
        } else if (data.hasOwnProperty("deletePlayer")) {
          let playerToRemove = await PlayersDB.findOne({
            _id: `${data.deletePlayer}`,
          });

          playerToRemove.clubs = playerToRemove.clubs.filter(
            (val) => val.clubId !== user.phone
          );

          user.players = user.players.filter(
            (val) => val.playerId !== data.deletePlayer
          );

          updateUserInDB(user);

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
          console.log("Template Ready!");
        // }else if (data.hasOwnProperty("saveDraft")) {
        //   let draftData = data["saveDraft"]["draftData"];
        //   let draftId = data["saveDraft"]["draftId"];
        //   draftData["lastSave"] = Date.now();

        //   if (draftId === null) {
        //     draftId = "d_" + generateRandomString();
        //     draftData["_id"] = draftId;
            
        //     await UsersDrafts.insertMany(draftData);
        //     if (!user.drafts) {
        //       user.drafts = [];
        //     }
        //     user.drafts.push(draftId);
        //     updateUserInDB(user);          
        //   } else {
        //     if (!user.drafts.includes(draftId)) {
        //       return res.status(404).json({ msg: `No draft found with this ID: ${draftId}`, draftId: draftId });
        //     }
        //     await UsersDrafts.updateOne({ _id: draftId }, { $set: draftData });
        //   }

        //   final = {
        //     logged_in_as: current_user,
        //     draftId: draftId,
        //   };
        }else if (data.hasOwnProperty("saveTemplate")) {
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
              console.log("existingTemplateData :" + existingTemplateData);
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
          let templateId = data["deleteTemplate"]["templateId"];
          if (
            !isAdmin &&
            !(
              user["templates"].find((val) => val._id == templateId) !=
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
          console.log("user templates:", user.templates);
          updateUserInDB(user);
          final = {
            msg: `Successfully deleted template: ${templateId}`,
            templateId: templateId,
          };
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

          const originDoc = originTemplate.toObject();
          for (let key in originDoc) {
            newTemplate[`${key}`] = originTemplate[`${key}`];
          }

          let newId = "t_" + generateRandomString();
          newTemplate["_id"] = newId;
          newTemplate["isPublic"] = originTemplate["isPublic"] && isAdmin;
          newTemplate["name"] = `${originTemplate["name"]} (copy)`;
          newTemplate["creator"] = current_user;
          await TemplatesDB.create(newTemplate);
          let temp = {
            _id: newId,
            name: newTemplate["name"],
            isPublic: newTemplate["isPublic"],
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

          final = newTemplate;
        } else if (data.hasOwnProperty("getAllTemplates")) {
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
              scored:[],
              botMessage:'welcome to the group',
              emoji:null,
              selectionPosition:null
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
          // console.log(inviteId);
          const group = await GroupsDB.findOne({invite:inviteId})
          // console.log(group);
          if (group) {
            let inGroup = false
            for (let i = 0; i < group.users.length; i++) {
              // console.log(group.users[i].userid);
              if (group.users[i].userid == user._id) {
                // console.log(user._id);
                inGroup = !inGroup
                break
              }
            }
            if (!inGroup) {
              const username = user.username ? user.username : 'Jhon Doe'
              const userinfo = {userid:user._id,role:'student',username:username}
              group.users.push(userinfo)
              user.groups.push({_id:group._id,name:group.name})
              // console.log(user.groups);
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
          const group = await GroupsDB.findOne({_id:groupId},{name:1,messages:1,botMessage:1})
          console.log(group);
          if (group) {
            final = group
          }else{
            return res.status(400).json({ msg: `No group found with this ID: ${groupId}` });
          }
        }else if (data.hasOwnProperty("sendMessage")) {
          const groupId = data["sendMessage"]["_id"]
          const group = await GroupsDB.findOne({_id:groupId})
          // const group = []
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

            if (msg == group.emoji) {
              let userfound = group.scored.map((val)=>{if (val == user._id) {
                return val
              }});
              if (userfound) {
                botMessage = {msg:'you already did this task',time:hourmin,user:'Ting Global Bot'} 
              }else{
                const challenge = await Challenges.findOne({_id:group.challengeID},{selections:1})
                botMessage = {msg:'Task Finished!!!',time:hourmin,user:'Ting Global Bot'} 
                const mission = challenge[group.selectionPosition]
                group.scored.push({user:user._id,points:mission.points})
                // user.totalScore += mission.points
                // updateUserInDB(user)
                //
                //
                // give points to player
                //
                //
                //
                //
                //
                //
                //
                //
                //
                //
                //
                
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
              
            }else{
              group.messages.push(message)
            }

            
            //group bot response
            
            // const challengeID = data["sendMessage"]["challengeID"]
            // const challenge = await Challenges.findOne({_id:challengeID})
            // const challengeArray = challenge.selections
            //code to figure out how many days have passed since challnge started
            //
            //
            //used to check imojis
            //
            //wait until selection sys rework
            // const date = 5     ////////////////////////////////////////////////////////////////////////////////////placeholder
            // if (challengeArray[date].imoji == msg) {
            //   //give points
            //   //set player mission for challnge finished
            //   //give response
            //   const msg = 'placeholder'     /////////////////////////////////////////////////////////////////////placeholder
            //   const messageFromBot = {msg:msg,time:hourmin,user:'Ting_Global_BOT'} 
            //   group.messages.push(messageFromBot)
            // }$set: group 



            await GroupsDB.updateOne({_id:groupId},{messages:group.messages})



            final = group.messages
          }else{
            return res.status(400).json({ msg: `No group found with this ID: ${groupId}` });
          }
        }else if (data.hasOwnProperty("deleteGroup")) {
          const groupId = data["deleteGroup"]["_id"]
          // const group = await GroupsDB.findOne({_id:groupId},{name:1,messages:1,botMessage:1})
          // if (group) {
          //   final = group
          // }else{
          //   return res.status(400).json({ msg: `No group found with this ID: ${groupId}` });
          // }
        }
        // sendMessage
        res.status(200).json(final);
      }
    }
  }
});

app.listen(3000, () => {
  console.log("server works on port 3000!");
});
