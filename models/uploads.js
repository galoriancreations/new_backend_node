const { Schema, model } = require("mongoose");

const uploadsSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    required: true
  }
});

exports.Uploads = model("Uploads", uploadsSchema, "uploads");
