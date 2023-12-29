const { Schema, model } = require("mongoose");

const templateSchema = new Schema(
  {
    _id: String,
    allowCopies: {
      type: Boolean,
      default: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    dayMargin: Number,
    days: Array,
    image: String,
    isPublic: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      trim: true
    },
    lastSave: Date,
    name: {
      type: String,
      required: true
    },
    preDays: Array,
    preMessages: Array,
    challenges: [
      {
        type: Schema.Types.ObjectId,
        ref: "Challenge"
      }
    ]
  },
  { timestamps: true }
);

exports.Template = model("Template", templateSchema, "templates");
