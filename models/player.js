const { Schema, model } = require("mongoose");

const playerSchema = new Schema(
  {
    _id: String,
    phone: String,
    userName: String,
    totalScore: Number,
    clubs: Array
  },
  { timestamps: true }
);

exports.Player = model("Player", playerSchema, "players");
