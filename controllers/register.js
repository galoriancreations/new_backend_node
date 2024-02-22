const { User } = require("../models/user");

exports.checkUsername = async (req, res) => {
  try {
    let check = await User.findOne({
      username: `${req.body.data}`
    });
    let [result, message] = [false, ""];
    if (check == null) {
      [result, message] = [
        true,
        `Great! you can register with username: ${req.body.data}`
      ];
    } else {
      [result, message] = [
        false,
        "Oops! This username is already taken,\nplease choose another :)"
      ];
    }
    res.status(200).json({ result: result, msg: message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

exports.checkPhone = async (req, res) => {
  try {
    let phoneNum = req.body.data;
    let check = await User.findOne({ phone: `${phoneNum}` });
    let [result, message] = [false, ""];
    if (check == null) {
      [result, message] = [
        true,
        `Great! you can register with this phone: ${req.body.data}`
      ];
    } else {
      [result, message] = [
        false,
        "Oops! This phone is already taken,\nplease choose another :)"
      ];
    }
    res.status(200).json({ result: result, msg: message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    let check = await User.findOne({
      email: `${req.body.data}`
    });
    let [result, message] = [false, ""];
    if (check == null) {
      [result, message] = [
        true,
        `Great! you can register with email: ${req.body.data}`
      ];
    } else {
      [result, message] = [
        false,
        "Oops! This email is already taken,\nplease choose another :)"
      ];
    }
    res.status(200).json({ result: result, msg: message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
