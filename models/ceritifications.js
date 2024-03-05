const { Schema, model } = require("mongoose");

const certificationsSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: false
    },
    types: Object
  },
  { timestamps: true }
);

exports.Certification = model(
  "Certification",
  certificationsSchema,
  "certification"
);
