import db from 'mongoose';

export const waGroupSchema = new db.Schema(
  {
    groupID: String,
    challengeID: String,
    invite: String,
    name: String,
  },
  { versionKey: false }
);

export const UsersTestSchema = new db.Schema(
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

export const UserDraftSchema = new db.Schema(
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
    templateId: String,
    templateOnly: Boolean,
  },
  { versionKey: false }
);

const SelectionSchema = new db.Schema({
  day: Number,
  text: String,
  emoji: String, 
  score: Number,
});

export const ChallengeSchema = new db.Schema(
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
    selections: [SelectionSchema], // Reference the SelectionSchema
    template: String,
    verified: Boolean,
    days: Array,
    preMessages: Array,
    preDays: Array,
  },
  { versionKey: false }
);

export const TemplateSchema = new db.Schema(
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

export const PlayerSchema = new db.Schema(
  {
    _id: String,
    phone: String,
    userName: String,
    totalScore: Number,
    clubs: Array,
  },
  { versionKey: false }
);
