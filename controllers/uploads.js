const fs = require("fs");
const path = require("path");
const mime = require("mime");
const { Uploads } = require("../models/uploads");

exports.uploadFile = async (req, res) => {
  console.log("uploading file");
  const file = req.file;
  if (!file) {
    console.log("No file uploaded");
    return res.status(400).json({ msg: "No file uploaded" });
  }

  // check if file is already in db
  console.log(file.originalname);
  const fileInDB = await Uploads.findOne({ data: file.buffer });
  if (fileInDB) {
    console.log("File already exists in db:", fileInDB._id);
    return res.status(200).send(`/uploads/${fileInDB._id}`);
  }

  const uploadedFile = await uploadFileToDB(file);
  // create path to file in server and send it
  console.log("File uploaded successfully:", uploadedFile._id);
  return res.status(200).send(`/uploads/${uploadedFile._id}`);
};

exports.getFile = async (req, res) => {
  // check if file exists in temp if not check in db and save in temp
  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  let file;
  const tempFilePath = path.join(__dirname, "temp", req.params.id);
  if (!fs.existsSync(tempFilePath)) {
    file = await Uploads.findById(req.params.id);
    if (!file || !file.contentType) {
      console.log("File not found:", req.params.id);
      return res.status(404).json({ msg: "File not found" });
    }
    fs.writeFileSync(tempFilePath, file.data);
  } else {
    // read the file from the temp directory
    const contentType =
      mime.getType(tempFilePath) || "application/octet-stream";
    file = {
      data: fs.readFileSync(tempFilePath),
      contentType
    };
  }

  if (file) {
    res.setHeader("Content-Type", file.contentType);
    return res.send(file.data);
  } else {
    console.log("File not found:", req.params.id);
    return res.status(404).json({ msg: "File not found" });
  }
};
