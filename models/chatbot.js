const { Schema, model } = require("mongoose");

const chatBotSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    assistants: [
      {
        id: {
          type: String,
          required: true
        },
        created_at: {
          type: Number,
          required: true
        },
        threads: [
          {
            id: {
              type: String,
              required: true
            },
            created_at: {
              type: Number,
              required: true
            },
            metadata: Object,
            title: String,
            object: String
          }
        ],
        metadata: Object,
        title: String,
        object: String
      }
    ]
  },
  { timestamps: true }
);

exports.ChatBot = model("Chatbot", chatBotSchema, "chatbot");
