const express = require("express");
//test
const app = express();
const bodyParser = require("body-parser");

//==== Its help to resolve
/*error 413 // payload too large, 
for base64 string after adjusting size in express */

app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(
	bodyParser.urlencoded({
		limit: "50mb",
		extended: true,
		parameterLimit: 50000,
	})
);
app.use(bodyParser.text({ limit: "200mb" }));

//=============================================

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
	console.log("new user to update:", user.templates);

	await UsersTest.updateOne({ _id: `${user["_id"]}` }, { $set: user });
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
		image: {
			name: String,
			data: String,
			contentType: String,
		},
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

///צריך לרשום לו עוד פרמטר עם אותו השם של הקולקשן כדי להגיד לו שאתה מתכוון למה שאתה מתכוון...
const WaGroup = db.model("waGroups", waGroupSchema, "waGroups");

const UsersTest = db.model("users", UsersTestSchema, "users");

const UsersDrafts = db.model("user_drafts", UserDraftSchema, "user_drafts");

const Challenges = db.model("challenges", ChallengeSchema, "challenges");

const TemplatesDB = db.model("templates", TemplateSchema, "templates");

const PlayersDB = db.model("players", PlayerSchema, "players");

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

				console.log(`API: image uploaded`);
			}
			//parse body from JSON to object
			let parseredRegister = JSON.parse(req.body.register);

			//check all propertise of parseredRegister object:
			console.log(`API: check all properties:`);
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
	};
	//התחלה
	start();
});

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

			// send back to front:
			final["logged_in_as"] = current_user;

			final["user"] = userData;

			//----------------end of editProfile-----------------------

			//---------------------Start of getAvailableTemplates-----------------------
		} else if (Object.hasOwn(data, "getAvailableTemplates")) {
			console.log(`--getAvailableTemplates--: start`);

			// ---
			// if i want to erase all templates in user.
			// for test and development only:
			// user.templates = [];
			// await UsersTest.updateOne({ _id: `${user["_id"]}` }, { $set: user });
			// ---

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

			//---------------------end of addPlayer-----------------------

			//---------------------Start of getTemplateData-----------------------
		} else if (Object.hasOwn(data, "getTemplateData")) {
			console.log(`--getTemplateData--: start`);
			// find template in DB, collection templates:
			let template = await TemplatesDB.findOne({
				_id: `${data["getTemplateData"]}`,
			});
			// send back to front:
			final = template;
			console.log(`--getTemplateData--: Template Ready!`);

			//---------------------end of getTemplateData-----------------------

			//---------------------Start of saveTemplate------------------------
		} else if (Object.hasOwn(data, "saveTemplate")) {
			console.log(`--saveTemplate--: start`);
			let templateId = data["saveTemplate"]["templateId"];
			console.log(`--saveTemplate--: template id is: ${templateId}`);
			let templateData = data["saveTemplate"]["templateData"];

			templateData["creator"] = current_user;
			templateData["lastSave"] = new Date();

			// if template is new there will be empty templateId,
			// and here it will be created:
			if (templateId == null) {
				templateId = "t_" + generateRandomString();
				templateData["_id"] = templateId;
				// if user is Not Admin create template in DB templates collection:
				if (isAdmin == false) {
					templateData["isPublic"] = false;
					await TemplatesDB.create(templateData);
					let temp = {
						_id: templateId,
						name: templateData.name,
						isPublic: templateData.isPublic,
					};
					user["templates"] = [...user["templates"], temp];
				}

				// user.templates.forEach((t) => {
				// 	for (let key in t) {
				// 		console.log(`${key}: ${t[key]}`);
				// 	}
				// });

				await updateUserInDB(user);
			}
			// if templateId is already exists:
			else {
				// do we need this row? is id is the same templateID in front already?:)
				templateData["_id"] = templateId;

				// if a user is Admin OR there is such template in user variable already:
				if (
					isAdmin == true ||
					user["templates"].find((val) => val._id == templateId) != undefined
				) {
					// if user is Not Admin template will be privat:
					if (isAdmin == false) {
						templateData["isPublic"] = false;
					}
					// update DB - templates collection:
					await TemplatesDB.updateOne(
						{ _id: `${templateId}` },
						{ $set: templateData }
					);
					// update user variable:
					let temp = {
						_id: templateId,
						name: templateData.name,
						isPublic: templateData.isPublic,
					};
					let index = user["templates"].findIndex(
						(val) => val._id == templateId
					);
					user["templates"][index] = temp;

					//update DB - users collection:
					await updateUserInDB(user);
					// if user is Not Admin AND there that templateId in user variable already exists:
				} else {
					let existingTemplate = await TemplatesDB.findOne({
						_id: templateId,
						isPublic: true,
					});
					console.log(
						`--saveTemplate--: existingTemplateData: ${existingTemplateData}`
					);
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
						await TemplatesDB.create(templateData);
						let temp = {
							_id: templateId,
							name: templateData.name,
							isPublic: templateData.isPublic,
						};
						user["templates"] = [...user["templates"], temp];
					}
					await updateUserInDB(user);
				}
			}
			// updateUserInDB(user);

			// send back to front:
			final = { logged_in_as: current_user, templateId: templateId };

			//---------------------end of saveTemplate------------------------

			//---------------------Start of deleteTemplate-----------------------
		} else if (Object.hasOwn(data, "deleteTemplate")) {
			console.log(`--deleteTemplate--: start`);
			let templateId = data["deleteTemplate"]["templateId"];
			if (
				!isAdmin &&
				!(user["templates"].find((val) => val._id == templateId) != undefined)
			) {
				return res
					.status(404)
					.json({ msg: `Template not found ${templateId}` });
			}
			// delete template from DB, collection templates:
			await TemplatesDB.deleteOne({ _id: `${templateId}` });
			// update user virable:
			user.templates = user.templates.filter((val) => val._id !== templateId);
			console.log(`--deleteTemplate--: user templates are: ${user.templates}`);
			// delete template from DB, collection users:
			await updateUserInDB(user);

			// send back to front:
			final = {
				msg: `Successfully deleted template: ${templateId}`,
				templateId: templateId,
			};

			//---------------------end of deleteTemplate-----------------------

			//---------------------Start of cloneTemplate-----------------------
		} else if (Object.hasOwn(data, "cloneTemplate")) {
			console.log(`--cloneTemplate--: start`);
			let originId = data["cloneTemplate"];
			let originTemplate = await TemplatesDB.findOne({
				_id: `${originId}`,
			});
			if (
				originTemplate == null ||
				(user["templates"].find((val) => val._id == originId) == undefined &&
					!originTemplate["isPublic"])
			) {
				return res.status(404).json({ msg: `Template not found ${originId}` });
			}
			// create new object for the copy of a template:
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
				if (template.hasOwnProperty("creator") && template["creator"] != null) {
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
			//---------------------end of getAllTemplates-----------------------

			//---------------------Start of saveDraft-----------------------
		} else if (Object.hasOwn(data, "saveDraft")) {
			console.log(`--saveDraft--: start`);
			let draftData = data["saveDraft"]["draftData"];
			let draftId = data["saveDraft"]["draftId"];
			draftData["lastSave"] = Date.now();
			// if draft is new there will be empty draftId,
			// and here it will be created:
			if (draftId === null) {
				// console.log(`--saveDraft--: draftId is null: ${draftId}`);
				draftId = "d_" + generateRandomString();
				draftData["_id"] = draftId;
				// create draft in DB UserDrafts collection:
				await UsersDrafts.create(draftData);
				// if there is no drafts in user variable:
				if (!user["drafts"]) {
					user["drafts"] = [];
				}
				// put a new draftID in user variable
				user["drafts"].push(draftId);
				// update DB - users collection:
				await updateUserInDB(user);
			} else {
				// console.log(`--saveDraft--: draftId is exists: ${draftId}`);
				// if draft is no in user virable (i dont know how it is possible?):
				if (!user["drafts"].includes(draftId)) {
					return res
						.status(404)
						.json({ msg: `No draft found with this ID: ${draftId} ` });
				}
				// update draft in DB UserDrafts collection:
				await UsersDrafts.updateOne({ _id: draftId }, { $set: draftData });
			}
			// send back to front:
			final = { logged_in_as: current_user, draftId: draftId };
			//---------------------end of saveDraft-----------------------

			//---------------------Start of getDraftData-----------------------
		} else if (Object.hasOwn(data, "getDraftData")) {
			console.log(`--getDraftData--: start`);
			// "getDraftData" includes id only. there are no another data
			let draftId = data["getDraftData"];
			// get draft data from DB UserDrafts collection:
			let draft = await UsersDrafts.findOne({ _id: draftId });
			// if draft is no in user virable (i dont know how it is possible?)
			// or there is no such draft data in DB:
			if (!user["drafts"].includes(draftId) || !draft) {
				return res
					.status(404)
					.json({ msg: `No draft found with this ID: ${draftId} ` });
			}

			// console.log(`--getDraftData--: ${draft}`);
			// send back to front:
			final = draft;
			//---------------------end of getDraftData-----------------------

			//---------------------Start of deleteDraft-----------------------
		} else if (Object.hasOwn(data, "deleteDraft")) {
			console.log(`--deleteDraft--: start`);
			let draftId = data["deleteDraft"];
			if (!user["drafts"].includes(draftId)) {
				return res
					.status(404)
					.json({ msg: `No draft found with this ID: ${draftId} ` });
			}

			// delete draft in DB UserDrafts collection:
			await UsersDrafts.deleteOne({ _id: draftId });

			if (user["drafts"].includes(draftId)) {
				user["drafts"].splice(user["drafts"].indexOf(draftId), 1);
				// delete draft in DB Users collection:
				await updateUserInDB(user);
			}
			// send back to front:
			final = {
				msg: "Successfully deleted draft",
				draftId: draftId,
			};

			//---------------------end of deleteDraft-----------------------
		}

		res.status(200).json(final);
	}
});

app.listen(3000, () => {
	console.log("server works on port 3000!");
});
