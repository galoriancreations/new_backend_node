import db from 'mongoose';
import {
  ChallengeSchema,
  PlayerSchema,
  TemplateSchema,
  UserDraftSchema,
  UsersTestSchema,
  waGroupSchema,
} from './schemas';

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
