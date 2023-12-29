const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true
    },
    phone: {
      type: String,
      unique: true,
      required: true
    },
    accountType: {
      type: String,
      enum: ["player", "organization"],
      default: "player"
    },
    fullName: {
      type: String,
      required: true
    },
    organization: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    country: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2
    },
    memberName: String,
    memberRole: String,
    email: String,
    language: {
      type: String,
      trim: true
    },
    templates: [
      {
        type: Schema.Types.ObjectId,
        ref: "Template"
      }
    ],
    drafts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Draft"
      }
    ],
    challenges: [
      {
        type: Schema.Types.ObjectId,
        ref: "Challenge"
      }
    ],
    createdChallenges: [
      {
        type: Schema.Types.ObjectId,
        ref: "Challenge"
      }
    ],
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: "Group"
      }
    ],
    isAdmin: {
      type: Boolean,
      default: false
    },
    photo: String,
    articleSubscribed: Boolean,
    telegramId: String
  },
  { timestamps: true }
);

exports.User = model("User", userSchema, "users");
