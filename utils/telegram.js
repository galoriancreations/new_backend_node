const { sendEmail } = require("../services/nodemailer");

exports.generateRandomCode = async () => {
  const code = Math.floor(100000 + Math.random() * 900000);

  return code;
};
