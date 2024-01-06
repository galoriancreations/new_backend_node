const uniqid = require("uniqid");

exports.uploadFile = async req => {
  const { file } = req.files;
  const filetype = file.name.split(".").at(-1);
  const originalName = file.name.split(".")[0];
  const filename = originalName + "_" + uniqid();
  const fullFileName = filename + "." + filetype;
  const folderPath = "./uploads/" + filename;
  const filePath = folderPath + "." + filetype;
  await file.mv(filePath);
  return "/uploads/" + fullFileName;
};
