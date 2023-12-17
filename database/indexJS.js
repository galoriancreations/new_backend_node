const db = require('mongoose');
const {
  waGroupSchema,
  UsersTestSchema,
  UserDraftSchema,
  ChallengeSchema,
  TemplateSchema,
  PlayerSchema,
} = require('./schemasJS');

db.connect(
  'mongodb+srv://Yinon:Challenge18@challenge18.hclji.mongodb.net/challenge'
);

const WaGroup = db.model('waGroups', waGroupSchema, 'waGroups'); // switch to tel_groups ?

const UsersTest = db.model('users', UsersTestSchema, 'users');

const UsersDrafts = db.model('user_drafts', UserDraftSchema, 'user_drafts');

const Challenges = db.model('challenges', ChallengeSchema, 'challenges');

const TemplatesDB = db.model('templates', TemplateSchema, 'templates');

const PlayersDB = db.model('players', PlayerSchema, 'players');

// function to add challenge to database
async function addChallengeToDb(challenge) {
  const challengeToAdd = new Challenges(challenge);
  await challengeToAdd.save();
}

exports = {
  WaGroup,
  UsersTest,
  UsersDrafts,
  Challenges,
  TemplatesDB,
  PlayersDB,
  addChallengeToDb,
};
