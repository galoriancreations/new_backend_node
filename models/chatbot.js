const { Schema, model } = require("mongoose");

const chatBotSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    threads: Array
  },
  { timestamps: true }
);

exports.ChatBot = model("Chatbot", chatBotSchema, "chatbot");
