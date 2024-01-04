const { Schema, model } = require("mongoose");

const chatBotSchema = new Schema(
  {
    username: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    thread: Object
  },
  { timestamps: true }
);

exports.ChatBot = model("Chatbot", chatBotSchema, "chatbot");
