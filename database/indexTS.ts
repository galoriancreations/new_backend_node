import db from 'mongoose';
import {
  ChallengeSchema,
  PlayerSchema,
  TemplateSchema,
  UserDraftSchema,
  UsersTestSchema,
  waGroupSchema,
} from './schemas';
import { type Challenge } from '../GPT/ts/types';

db.connect(
  'mongodb+srv://Yinon:Challenge18@challenge18.hclji.mongodb.net/challenge'
);

export const WaGroup = db.model('waGroups', waGroupSchema, 'waGroups');

export const UsersTest = db.model('users', UsersTestSchema, 'users');

export const UsersDrafts = db.model(
  'user_drafts',
  UserDraftSchema,
  'user_drafts'
);

export const Challenges = db.model('challenges', ChallengeSchema, 'challenges');

export const TemplatesDB = db.model('templates', TemplateSchema, 'templates');

export const PlayersDB = db.model('players', PlayerSchema, 'players');

// function to add challenge to database
export async function addChallengeToDb(challenge: Challenge) {
  const challengeToAdd = new Challenges(challenge);
  await challengeToAdd.save();
}
