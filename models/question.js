const { Schema, model } = require("mongoose");

const answerSchema = new Schema({
    user: String,
    text: String,
    likes: Number 
});

const questionSchema = new Schema(
  {
    qnum: String,
    text: String,
    answers: [answerSchema]
  },
  { timestamps: true }
);


// exports.Question = model("Question", questionSchema, "questions");

exports.UnIMagic = model("UnIMagic", questionSchema, "UnIMagic");
exports.MoralMagic = model("MoralMagic", questionSchema, "MoralMagic");
exports.Imagic = model("Imagic", questionSchema, "Imagic");
exports.Environmagic = model("Environmagic", questionSchema, "Environmagic");
exports.KidsMagic = model("KidsMagic", questionSchema, "KidsMagic");
exports.SDGMagic = model("SDGMagic", questionSchema, "SDGMagic");
exports.BGIMagic = model("BGIMagic", questionSchema, "BGIMagic");