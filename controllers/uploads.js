const { Uploads } = require("../models/uploads");
const { uploadFile, getFileData } = require("../utils/files");

exports.uploadFile = async (req, res) => {
  try {
    console.log("uploadFile from controller/uploads.js");

    const file = req.files?.file;
    if (!file) {
      console.log("No file uploaded");
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // check if file is already in db
    const fileInDB = await Uploads.findOne({ md5: file.md5 });
    if (fileInDB) {
      console.log("File already exists in db:", fileInDB.name);
      return res.status(200).send(`/uploads/${fileInDB.name}`);
    }

    const uploadedFilePath = await uploadFile(req);
    // create path to file in server and send it
    console.log("File uploaded successfully:", uploadedFilePath);
    return res.status(200).send(uploadedFilePath);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getFile = async (req, res) => {
  const file = await getFileData(req.params.id);

  if (file) {
    res.setHeader("Content-Type", file.contentType);
    return res.send(file.data);
  } else {
    console.log("File not found:", req.params.id);
    return res.status(404).json({ msg: "File not found" });
  }
};
