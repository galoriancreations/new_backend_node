const { Schema, model } = require("mongoose");

const challengeSchema = new Schema(
  {
    _id: String,
    active: {
      type: Boolean,
      default: true
    },
    createdOn: Date,
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    date: {
      type: Date,
      required: true
    },
    declined: {
      type: Boolean,
      default: false
    },
    invite: String,
    isPublic: {
      type: Boolean,
      default: false
    },
    name: {
      type: String,
      required: true
    },
    selections: Array,
    template: {
      type: Schema.Types.ObjectId,
      ref: "Template"
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

exports.Challenge = model("Challenge", challengeSchema, "challenges");
