const express = require("express");

const app = express();
const bodyParser = require("body-parser");

const wa = require("@open-wa/wa-automate");

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

//

let lastSender;

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

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
		isAdmin: Boolean,
		players: Array,
		photo: {
			name: String,
			data: String,
			contentType: String,
		},
		articleSubscribed: Boolean,
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

const QuestionModel = db.model("questions", QuestionSchema, "questions")

const SingularityMagicGame = db.model("singularity", QuestionSchema, "singularity")

// let quest=[
//     {
// 		_id:'',
//         qnum: "1",
//         text: "What is the greatest achievement in your life?"
//     },
//     {
// 		_id:'',
//         qnum: "2",
//         text: "What do you value most in friendship, & why?"
//     },
//     {
// 		_id:'',
//         qnum: "3",
//         text: "Share a personal challenge, & ask the other(s) how they would tackle it."
//     },
//     {
// 		_id:'',
//         qnum: "4",
//         text: "In a crisis situation, whom would you call first, & why?"
//     },
//     {
// 		_id:'',
//         qnum: "5",
//         text: "What is your most cherished memory, & why?"
//     },
//     {
// 		_id:'',
//         qnum: "6",
//         text: "Tell the other(s) what you like about them. Be honest!"
//     },
//     {
// 		_id:'',
//         qnum: "7",
//         text: "What does friendship mean to you?"
//     },
//     {
// 		_id:'',
//         qnum: "8",
//         text: "What are the 3 things that make a relationship work?"
//     },
//     {
// 		_id:'',
//         qnum: "9",
//         text: "What are you most curious to know about each other?"
//     },
//     {
// 		_id:'',
//         qnum: "10",
//         text: "What do you enjoy doing the most with your family members?"
//     },
//     {
// 		_id:'',
//         qnum: "11",
//         text: "Present your favorite 3 yoga positions"
//     },
//     {
// 		_id:'',
//         qnum: "12",
//         text: "Truth or Dare: ask each other anything 😊"
//     },
//     {
// 		_id:'',
//         qnum: "13",
//         text: "What is the most silly thing that you have ever done with a friend?"
//     },
//     {
// 		_id:'',
//         qnum: "14",
//         text: "Invent a new TikTok challegne"
//     },
//     {
// 		_id:'',
//         qnum: "15",
//         text: "Are there people in your life with whom you want to reconnect?"
//     },
//     {
// 		_id:'',
//         qnum: "16",
//         text: "What is freedom in a relationship?"
//     },
//     {
// 		_id:'',
//         qnum: "17",
//         text: "List 3 personal boundaries."
//     },
//     {
// 		_id:'',
//         qnum: "18",
//         text: "Draft together 3 statements that begin with: “We are feeling...”"
//     },
//     {
// 		_id:'',
//         qnum: "19",
//         text: "What is the most important thing in your life?"
//     },
//     {
// 		_id:'',
//         qnum: "20",
//         text: "If you were of a different gender, nationality or religion, what would be the difference?"
//     },
//     {
// 		_id:'',
// 		qnum: "21",
//         text: "Find 3 things that you have in common with each other."
//     },
//     {
// 		_id:'',
//         qnum: "22",
//         text: "What are the 3 things that you think about the most every day?"
//     },
//     {
// 		_id:'',
//         qnum: "23",
//         text: "What was the last nice thing you did to someone?"
//     },
//     {
// 		_id:'',
// 		qnum: "24",
//         text: "What are the challenges that the next generation might face, in your opinion?"
//     },
//     {
// 		_id:'',
//         qnum: "25",
//         text: "What do you feel most grateful for in your life?"
//     },
//     {
// 		_id:'',
//         qnum: "26",
//         text: "Tell the other(s) what your 1st impression was & whether it changed!"
//     },
//     {
// 		_id:'',
//         qnum: "27",
//         text: "What new thing did you learn today? this week? this year?"
//     },
//     {
// 		_id:'',
//         qnum: "28",
//         text: "Who are the people that truly care for you?"
//     },
//     {
// 		_id:'',
//         qnum: "29",
//         text: "Find 3 differences that you see between each other."
//     },
//     {
// 		_id:'',
//         qnum: "30",
//         text: "Explain the meaning: “living the moment - with respect!”"
//     },
//     {
// 		_id:'',
//         qnum: "31",
//         text: "List 5 of your main values, & rank them in order of importance."
//     },
//     {
// 		_id:'',
//         qnum: "32",
//         text: "What prejudice would you like to be gone, & why?"
//     },
//     {
// 		_id:'',
// 		qnum: "33",
//         text: "What is the importance of rest in your life?"
//     },
//     {
// 		_id:'',
//         qnum: "34",
//         text: "What does it take to have the necessary self-discipline to achieve your goals?"
//     },
//     {
// 		_id:'',
//         qnum: "35",
//         text: "What are you willing to fight for, & why?"
//     },
//     {
// 		_id:'',
//         qnum: "36",
//         text: "If you were the Minister of Happiness, what 3 new laws would you enact?"
//     },
//     {
// 		_id:'',
//       	qnum: "37",
//        	text: "What would you never compromise on?"
//     },
//     {
// 		_id:'',
//         qnum: "38",
//       	text: "If you could change the world, what would you do 1st ?"
//     },
//     {
// 		_id:'',
//         qnum: "39",
//         text: "Have you ever made a decision that changed your whole life?"
//     },
//     {
// 		_id:'',
//         qnum: "40",
//         text: "Make a wish & share it with everyone."
//     },
//     {
// 		_id:'',
//         qnum: "41",
//         text: "If you had a crystal ball, what would you want to know about the other(s)?"
//     },
//     {
// 		_id:'',
//         qnum: "42",
//         text: "Describe your dream home, provide 10 adjectives."
//     },
//     {
// 		_id:'',
//         qnum: "43",
//         text: "What makes you forget to eat?"
//     },
//     {
// 		_id:'',
//         qnum: "44",
//         text: "True or False - Share a story!"
//     },
//     {
// 		_id:'',
//         qnum: "45",
//         text: "Describe 3 successes of yours, & identify what they have in common."
//     },
//     {
// 		_id:'',
//         qnum: "46",
//         text: "Reinvent the 10 commandments with the other(s)."
//     },
//     {
// 		_id:'',
//         qnum: "47",
//         text: "Name 5 people that you particularly admire & what do they represent for you?"
//     },
//     {
// 		_id:'',
//         qnum: "48",
//         text: "How to improve your time management? Find solutions together."
//     },
//     {
// 		_id:'',
//         qnum: "49",
//         text: "Complete: “If I were King/Queen for a day, I would…”"
//     },
//     {
// 		_id:'',
//         qnum: "50",
//         text: "Time Machine: In what era would you like to live, and why?"
//     },
//     {
// 		_id:'',
//         qnum: "51",
//         text: "How do you express love towards yourself?"
//     },
//     {
// 		_id:'',
//         qnum: "52",
//         text: "What was your most vivid dream?"
//     },
//     {
// 		_id:'',
//         qnum: "53",
//         text: "Complete the sentence: “I wish I had someone to share...”"
//     },
//     {
// 		_id:'',
//         qnum: "54",
//         text: "Let’s create a story together, one sentence each."
//     },
//     {
// 		_id:'',
//         qnum: "55",
//         text: "Choose 3 animals of your liking. What is special about them?"
//     },
//     {
// 		_id:'',
//         qnum: "56",
//         text: "If you could be anyone for a day, who would you be?"
//     },
//     {
// 		_id:'',
//         qnum: "57",
//         text: "tell a story beginning with, “Once upon a time…”"
//     },
//     {
// 		_id:'',
//         qnum: "58",
//         text: "What would be the title of your TED talk & book, and why?"
//     },
//     {
// 		_id:'',
//         qnum: "59",
//         text: "True or False: one tells two stories, find the lie."
//     },
//     {
// 		_id:'',
//         qnum: "60",
//         text: "What trait of yours would you like to improve the most, & why?"
//     },
//     {
// 		_id:'',
//         qnum: "61",
//         text: "Truth or Dare: ask anything 😊"
//     },
//     {
// 		_id:'',
// 		qnum: "62",
//         text: "Name a new place that you would like to visit?"
//     },
//     {
// 		_id:'',
//         qnum: "63",
//         text: "What is most important: the road, the destination or ...?"
//     },
//     {
// 		_id:'',
//         qnum: "64",
//         text: "Ever planted a tree? What tree would you like to plant?"
//     },
//     {
// 		_id:'',
//         qnum: "65",
//         text: "Choose an animal each, & talk about the climate."
//     },
//     {
// 		_id:'',
//         qnum: "66",
//         text: "If you were an elephant, what would you tell about humans?"
//     },
//     {
// 		_id:'',
//         qnum: "67",
//         text: "What book or person inspired you the most & how were you affected?"
//     },
//     {
// 		_id:'',
//         qnum: "68",
//         text: "What makes a strong community?"
//     },
//     {
// 		_id:'',
//         qnum: "69",
//         text: "If you were rich, to what cause would you donate?"
//     },
//     {
// 		_id:'',
//         qnum: "70",
//         text: "What would be the most surprising scientific discovery imaginable?"
//     },
//     {
// 		_id:'',
//         qnum: "71",
//         text: "What's the world like in 10 years? Describe it in a magical way."
//     },
//     {
// 		_id:'',
//         qnum: "72",
//         text: "Can AI replace your friends?"
//     },
//     {
// 		_id:'',
//         qnum: "73",
//         text: "What is the meaning of life?"
//     },
//     {
// 		_id:'',
//         qnum: "74",
//         text: "Who are your favorite vloggers?"
//     },
//     {
// 		_id:'',
//         qnum: "75",
//         text: "How to improve life on earth?"
//     },
//     {
// 		_id:'',
//         qnum: "76",
//         text: "Complete together: “If only we were...then we could have…”"
//     },
//     {
// 		_id:'',
//         qnum: "77",
//         text: "What is the first thing you notice about people?"
//     },
//     {
// 		_id:'',
//         qnum: "78",
//         text: "What is the most fun party you have ever been to?"
//     },
//     {
// 		_id:'',
//         qnum: "79",
//         text: "What would you do if you won a hundred million $$$?"
//     },
//     {
//         qnum: "80",
//         text: "Name 3 things that you like the most about the other(s)."
//     },
//     {
// 		_id:'',
//         qnum: "81",
//         text: "Truth or Dare: ask anything 😊"
//     },
//     {
// 		_id:'',
//         qnum: "82",
//         text: "If there was a warning sign on you, what would it say?"
//     },
//     {
// 		_id:'',
//         qnum: "83",
//         text: "Find 5 red things around you."
//     },
//     {
// 		_id:'',
//         qnum: "84",
//         text: "Who is the most special person in your life?"
//     },
//     {
// 		_id:'',
//         qnum: "85",
//         text: "If you were rich, what would you do?"
//     },
//     {
// 		_id:'',
//         qnum: "86",
//         text: "Who do you know best & who knows you best?"
//     },
//     {
// 		_id:'',
//         qnum: "87",
//         text: "Chocolates or flowers? What would you rather get as a birthday present?"
//     },
//     {
// 		_id:'',
// 		qnum: "88",
//         text: "Name 3 things that really make you happy, & why?"
//     },
//     {
// 		_id:'',
//         qnum: "89",
//         text: "If you could change one thing in your life, what would it be?"
//     },
//     {
// 		_id:'',
// 		qnum: "90",
//         text: "Share: “People who know me think I'm the best at…”"
//     },
//     {
// 		_id:'',
//         qnum: "91",
//         text: "Which were your happiest moments this year? Ever?"
//     },
//     {
// 		_id:'',
//         qnum: "92",
//         text: "Say 3 nice things about each other."
//     },
//     {
// 		_id:'',
//         qnum: "93",
//         text: "What is your favorite game? toy?"
//     },
//     {
// 		_id:'',
//         qnum: "94",
//         text: "Choose a player & ask anything."
//     }
// ]
// quest.forEach((val)=>{
// 	val._id ='q_' + generateRandomString()
// })
// QuestionModel.insertMany(quest)

// let questSingularity=[
// 	{
// 	_id:'',
//     qnum: "1",
//     text: "What roles can AI play in advancing global healthcare solutions?"
// 	},
// 	{
// 	_id:'',
//     qnum: "2",
//     text: "How can AI foster collaboration in international scientific research?"
// 	},
// 	{
// 	_id:'',
//     qnum: "3",
//     text: "In what ways can AI contribute to sustainable environmental practices?"
// 	},
// 	{
// 	_id:'',
//     qnum: "4",
//     text: "How does AI enhance personalized learning in educational systems?"
// 	},
// 	{
// 	_id:'',
//     qnum: "5",
//     text: "What strategies ensure AI-driven automation benefits all economic sectors?"
// 	},
// 	{
// 	_id:'',
//     qnum: "6",
//     text: "How can AI improve emotional intelligence in virtual assistants?"
// 	},
// 	{
// 	_id:'',
//     qnum: "7",
//     text: "In what ways can AI support artistic creativity and innovation?"
// 	},
// 	{
// 	_id:'',
//     qnum: "8",
//     text: "How can AI aid in maintaining global peace and security?"
// 	},
// 	{
// 	_id:'',
//     qnum: "9",
//     text: "What role does AI have in promoting inclusive social policies?"
// 	},
// 	{
// 	_id:'',
//     qnum: "10",
//     text: "How can AI-driven analytics optimize renewable energy resource management?"
// 	},
// 	{
// 	_id:'',
//     qnum: "11",
//     text: "What are the ethical considerations in AI love and companionship?"
// 	},
// 	{
// 	_id:'',
//     qnum: "12",
//     text: "How can AI contribute to unbiased news and information dissemination?"
// 	},
// 	{
// 	_id:'',
//     qnum: "13",
//     text: "What potential does AI have in advancing space exploration missions?"
// 	},
// 	{
// 	_id:'',
//     qnum: "14",
//     text: "How can AI enhance disaster response and crisis management efficiency?"
// 	},
// 	{
// 	_id:'',
//     qnum: "15",
//     text: "In what ways can AI support mental health and well-being?"
// 	},
// 	{
// 	_id:'',
//     qnum: "16",
//     text: "How can AI assist in preserving and learning from historical data?"
// 	},
// 	{
// 	_id:'',
//     qnum: "17",
//     text: "What role can AI play in developing smarter, safer transportation systems?"
// 	},
// 	{
// 	_id:'',
//     qnum: "18",
//     text: "How does AI facilitate cross-cultural understanding and communication?"
// 	},
// 	{
// 	_id:'',
//     qnum: "19",
//     text: "What are innovative ways AI can combat global food shortages?"
// 	},
// 	{
// 	_id:'',
//     qnum: "20",
//     text: "How can AI contribute to fair and impartial legal judgments?"
// 	},
// ]
// questSingularity.forEach((val)=>{
// 	val._id ='q_' + generateRandomString()
// })
// SingularityMagicGame.insertMany(questSingularity)



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
app.post("/sendMessage", (req, res) => {
	let temp = req.body.mText;

	const sendReply = async (text) => {
		await client.sendText(lastSender, text);
	};

	sendReply(temp);
});
// ---test if i can take a photo from database----
// app.get("/photo", async (req, res) => {
// 	// Create a file path where you want to save the photo
// 	const testPhoto = await UsersTest.findOne({ username: "YanaTest" });
// 	console.log(testPhoto);
// 	// const filePath = `./uploads/${photo.name}`;

// 	// // Convert the Base64 data back to a Buffer
// 	// const buffer = Buffer.from(testPhoto.photo.data, "base64");

// 	// // Write the Buffer to the file
// 	// fs.writeFileSync(filePath, buffer);
// });
// ----end test----

app.post("/api", upload.single("photo"), (req, res) => {
	const start = async () => {
		//i cant use hasOwnProperty method like i use in below
		if (req.body.register != null) {
			console.log("this works");
			
			const photo = {
				name: "",
				data: "",
				contentType: "",
			};

			if (req.file) {
				// Read the uploaded file as a Buffer
				const fileBuffer = req.file.buffer;
				// Convert the Buffer to a Base64-encoded string
				const base64Data = fileBuffer.toString("base64");
				// structure how photo will be stored in DB
				photo = {
					name: req.file.originalname,
					data: base64Data,
					contentType: req.file.mimetype,
				};

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
						photo: photo,
					};
					console.log("all properties for a new user assigned");
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

			if (req.body.hasOwnProperty("signIn")) {
				let phoneNum = req.body.signIn.phone;
				phoneNum = phoneNum.replace("+", "");
				let userData = await UsersTest.findOne({ phone: `${phoneNum}` });
				if (userData != null) {
					let [token, exp] = getToken(userData["phone"]);
					res
						.status(200)
						.json({ access_token: token, exp: exp, user: userData });
				}
			} else if (req.body.hasOwnProperty("getChallengeData")) {
				data = req.body;
				challengeData = await Challenges.findOne({
					_id: `${data["getChallengeData"]}`,
				});
				if (challengeData == null) {
					return res.status(404).json({
						msg: `Challenge ${data["getChallengeData"]} was not found`,
					});
				}
				templateData = await TemplatesDB.findOne({
					_id: `${challengeData["template"]}`,
				});
				if (templateData == null) {
					return res.status(400).json({
						msg: `template ${challengeData["template"]} was not found`,
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
										challengeData["selections"][`${day["id"]}`][
											`${task["id"]}`
										];
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
		}
		
		if ('getChallengesByName' in req.body) {
			// check if user loggedin
			const { loggedIn, msg } = isUserLoggedIn(req);
			if (!loggedIn) {
				return res.status(401).json({ msg });
			}
			
			const names = req.body.getChallengesByName;

			const challenges = await Challenges.find(
				{ name: { $in: names }, platforms: { $exists: true } },
				{ days: 0, preMessages: 0, preDays: 0, selections: 0, scores: 0 }
			);

			let final = await Promise.all(
				challenges.map(async (challenge) => {
					const templateId = challenge.template;
					const template = await TemplatesDB.findOne(
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
			final = final.filter((challenge) => challenge !== undefined);
			// also sort method doesn't work in the map
			final.sort((a, b) => b.dayDiff - a.dayDiff);

			for (let i = 0; i < final.length; i++) {
				const creator = await UsersTest.findOne(
					// Crash sometimes because creator is null, need to check
					{ _id: final[i]?.creator },
					{ organization: 1, fullName: 1, username: 1 }
				);

				if (!creator) {
					final[i].creator = 'unknown';
					continue;
				}

				final[i].creator =
					creator.organization || creator.fullName || creator.username;
			}

			return res.status(200).json(final);
		} else if ('getPublicTemplateID' in req.body) {
			// check if user loggedin
			const { loggedIn, msg } = isUserLoggedIn(req);
			if (!loggedIn) {
				return res.status(401).json({ msg });
			}
			
			const names = req.body.getPublicTemplateID;
			const template = await TemplatesDB.findOne(
				{
					name: { $in: names },
					language: 'English',
					isPublic: true,
				},
				{ language: 1, name: 1 }
			);
			console.log(template);
			return res.status(200).json(template?._id);
		}
	};
	//התחלה
	start();
});

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
			msg: 'Invalid or expired token. Please refresh the page and login',
		};
	}
	// check if token is valid
	const current_user = decode_auth_token(req.headers.authorization.split(' ')[1], secretKey);
	if (!current_user) {
		return res.status(401).json({
			loggedIn: false,
			msg: 'Invalid or expired token. Please refresh the page and login',
		});
	}

	return { mesg: null, loggedIn: true };
}

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
						for (let challengeId in userData["createdChallenges"]) {
							console.log("Fetching draft from DB:", draftID);
							challenge = await findChallengeInDB(challengeId);
							console.log("Receiving draft from DB:", draftID);
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
				} else if (data.hasOwnProperty("getQuestion")){
					// console.log(data);
					const qId = data["qId"]
					// console.log(qId);
					let i;
					if (qId) {
						i = qId;
					}
					else{
						i = Math.floor(Math.random() * 94+1)
					}
					// console.log(i);
					const result = await QuestionModel.findOne({qnum:i})
					final = result
				}else if (data.hasOwnProperty("getSingularity")){
					// console.log(data);
					const qId = data["qId"]
					// console.log(qId);
					let i;
					if (qId) {
						i = qId;
					}
					else{
						i = Math.floor(Math.random() * 20+1)
					}
					// console.log(i);
					const result = await SingularityMagicGame.findOne({qnum:i})
					final = result
				}
				 else if (data.hasOwnProperty("getAnswer")){
					let question = data["getAnswer"]["question"]
					const answer = {
						id: 'a_' + generateRandomString(),
						user: user.fullName,
						text: data["getAnswer"]["answer"],
						likes: 0
					}
					const findAndUpAnswer = await QuestionModel.findOneAndUpdate(
						{qnum:question},{$push:{answers:answer}})
					const findAndUpSingularity = await SingularityMagicGame.findOneAndUpdate(
						{qnum:question},{$push:{answers:answer}})
					if(!findAndUpAnswer || !findAndUpSingularity ){
						return res.status(400).json({msg:'the question not found'})
					}
					if(findAndUpSingularity){
						const result = await SingularityMagicGame.find()
						final = result[parseInt(question)-1]
						// res.json({msg:'the answer singularity added'})
					}
					if(findAndUpAnswer){
						const result = await QuestionModel.find()
						final = result[parseInt(question)-1]
						// res.json({msg:'the answer added'})
					}
				}
				else if(data.hasOwnProperty("updateLikes")){
					let qnum = data["updateLikes"]["qnum"]
					let id =  data["updateLikes"]["id"]
					let likes = data["updateLikes"]["likes"]
					const findAndUpLikes = await QuestionModel.updateOne(
						{ qnum: qnum, "answers.id": id },
						{ $set: { "answers.$.likes": likes } }
					)
					const findAndUpSingularityLike = await SingularityMagicGame.updateOne(
						{ qnum: qnum, "answers.id": id },
						{ $set: { "answers.$.likes": likes } }
					)
					if(!findAndUpLikes || !findAndUpSingularityLike){
						return res.status(400).json({msg:'the question not found'})
					}
					if(findAndUpLikes){
						qnum = "";
						id = "";
						likes = 0;
					}
					if(findAndUpSingularityLike){
						qnum = "";
						id = "";
						likes = 0;
					}
				}
				res.status(200).json(final);
			}
		}
	}
});

app.listen(3000, () => {
	console.log("server works on port 3000!");
});
