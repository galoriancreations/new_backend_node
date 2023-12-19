const db = require('mongoose');
const {
  waGroupSchema,
  UsersTestSchema,
  UserDraftSchema,
  ChallengeSchema,
  TemplateSchema,
  PlayerSchema,
  FilesDBSchema,
} = require('./schemas');

db.connect(
  'mongodb+srv://Yinon:Challenge18@challenge18.hclji.mongodb.net/challenge'
);

// const WaGroup = db.model('waGroups', waGroupSchema, 'waGroups'); // switch to tel_groups ?

// const UsersTest = db.model('users', UsersTestSchema, 'users');

// const UsersDrafts = db.model('user_drafts', UserDraftSchema, 'user_drafts');

// const Challenges = db.model('challenges', ChallengeSchema, 'challenges');

// const TemplatesDB = db.model('templates', TemplateSchema, 'templates');

// const PlayersDB = db.model('players', PlayerSchema, 'players');

const FilesDB = db.model('uploads', FilesDBSchema);

// function to add challenge to database
// async function addChallengeToDb(challenge) {
//   const challenge = await Challenges.create(challenge);
//   return challenge;
// }

async function uploadFileToDB(file) {
  // ceck if file is valid, check for file
  if (!file || !file.originalname || !file.buffer || !file.mimetype) {
    console.log('Invalid file object');
    return null;
  }

  const fileInDB = await FilesDB.create({
    name: file.originalname,
    data: file.buffer,
    contentType: file.mimetype,
  });

  return fileInDB;
}

module.exports = {
  // WaGroup,
  // UsersTest,
  // UsersDrafts,
  // Challenges,
  // TemplatesDB,
  // PlayersDB,
  FilesDB,
  // addChallengeToDb,
  uploadFileToDB,
};
