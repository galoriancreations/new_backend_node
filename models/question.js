const { Schema, model } = require("mongoose");

const questionSchema = new Schema(
  {
    _id: String,
    qnum: Number,
    text: String,
    answers: [
      {
        id: {
          type: String,
          required: true,
          unique: true
        },
        user: String,
        text: String,
        likes: Number
      }
    ]
  },
  { timestamps: true }
);

exports.Question = model("Question", questionSchema, "questions");
