const { Schema, model } = require("mongoose");

const uploadsSchema = new Schema({
  name: String,
  data: Buffer,
  contentType: String
});

exports.Uploads = model("Uploads", uploadsSchema, "uploads");
