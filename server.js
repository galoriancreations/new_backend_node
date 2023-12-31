const express = require("express");
//test
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
				}
				res.status(200).json(final);
			}
		}
	}
});

app.listen(3000, () => {
	console.log("server works on port 3000!");
});
