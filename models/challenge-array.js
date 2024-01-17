const { Schema, model } = require("mongoose");

const challengeArraySchema = new Schema(
  {
    _id: String,
    challengeID: {
      // type: Schema.Types.ObjectId,
      type: String,
      ref: "Challenge"
    }
  },
  { timestamps: true }
);

exports.ChallengeArray = model(
  "group_challnge_array",
  challengeArraySchema,
  "group_challnge_array"
);
