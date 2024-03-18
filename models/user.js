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
    password: {
      type: String,
      required: true
    },
    accountType: {
      type: String,
      enum: ["individual", "organization"],
      default: "individual"
    },
    fullName: String,
    organization: String,
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
        // type: Schema.Types.ObjectId,
        type: String,
        ref: "Template"
      }
    ],
    drafts: [
      {
        // type: Schema.Types.ObjectId,
        type: String,
        ref: "Draft"
      }
    ],
    challenges: [
      {
        // type: Schema.Types.ObjectId,
        type: String,
        ref: "Challenge"
      }
    ],
    createdChallenges: [
      {
        // type: Schema.Types.ObjectId,
        type: String,
        ref: "Challenge"
      }
    ],
    groups: [
      {
        // type: Schema.Types.ObjectId,
        type: String,
        ref: "Group"
      }
    ],
    isAdmin: {
      type: Boolean,
      default: false
    },
    articleSubscribed: Boolean,
    telegramId: String,
    image: String,
    telegramCode: Number,
  },
  { timestamps: true }
);

exports.User = model("User", userSchema, "users");
