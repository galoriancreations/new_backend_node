const { Schema, model } = require("mongoose");

const draftSchema = new Schema(
  {
    allowTemplateCopies: {
      type: Boolean,
      default: true
    },
    days: Array,
    image: String,
    date: String,
    isTemplatePublic: Boolean,
    language: String,
    lastSave: Date,
    name: String,
    preDays: Array,
    preMessages: Array,
    dayMargin: Number,
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "Template"
    },
    templateOnly: Boolean
  },
  { timestamps: true }
);

exports.Draft = model("Draft", draftSchema, "user_drafts");
