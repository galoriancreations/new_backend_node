const { Schema, model } = require("mongoose");

const groupSchema = new Schema(
  {
    _id: String,
    challengeID: {
      // type: Schema.Types.ObjectId,
      type: String,
      ref: "Challenge"
    },
    invite: String,
    telInvite: String,
    telGroupId: String,
    name: {
      type: String,
      required: true
    },
    users: [
      {
        userid: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        role: String
      }
    ],
    messages: [
      {
        msg: String,
        user: {
          type: Schema.Types.ObjectId,
          ref: "User"
        }
      }
    ],
    botMessage: [
      {
        text: String,
        ind: Number
      }
    ],
    emoji: [Object],
    scored: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        emoji: String
      }
    ]
  },
  { timestamps: true }
);

exports.Group = model("telGroups", groupSchema, "tel_groups");
